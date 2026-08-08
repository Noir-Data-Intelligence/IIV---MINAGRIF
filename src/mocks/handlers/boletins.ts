import { http, HttpResponse } from "msw";
import { boletinsFixtures, boletinsAnalisesFixtures, setBoletinsAnalisesFixtures, hydrateBoletim } from "@/mocks/fixtures/boletins";
import { amostrasFixtures } from "@/mocks/fixtures/amostras";
import { requisicoesFixtures } from "@/mocks/fixtures/requisicoes";
import { laboratoriosFixtures } from "@/mocks/fixtures/laboratorios";
import { usersFixtures } from "@/mocks/fixtures/users";
import type { BoletimAnaliseDto, BoletimInternoDto } from "@/types/dto/boletim";
import type { Paginated } from "@/types/dto/paginated";

/**
 * Handlers MSW do módulo Boletins — replica o `LabWorkflowService` do
 * backend real: validação dupla/tripla com validadores distintos, lista
 * nomeada da Bacteriologia, gate Salmonela=0 da Bromatologia.
 */
const BASE = "*/api/boletins";

function currentUserId(request: Request): string | null {
  const auth = request.headers.get("Authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  return usersFixtures.find((u) => u.id === token)?.id ?? null;
}

function laboratorioForBoletim(boletim: BoletimInternoDto) {
  const amostra = amostrasFixtures.find((a) => a.id === boletim.amostraId);
  const requisicao = amostra ? requisicoesFixtures.find((r) => r.id === amostra.requisicaoId) : undefined;
  return requisicao ? laboratoriosFixtures.find((l) => l.id === requisicao.laboratorioId) : undefined;
}

export const boletinsHandlers = [
  http.get(BASE, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1") || 1;
    const perPage = Number(url.searchParams.get("per_page") ?? "20") || 20;
    const status = url.searchParams.get("status");

    let rows = [...boletinsFixtures].sort((a, b) => b.entradaEm.localeCompare(a.entradaEm));
    if (status) rows = rows.filter((b) => b.status === status);

    const total = rows.length;
    const lastPage = Math.max(1, Math.ceil(total / perPage));
    const start = (page - 1) * perPage;
    const data = rows.slice(start, start + perPage).map(hydrateBoletim);

    const body: Paginated<BoletimInternoDto> = { data, meta: { currentPage: page, perPage, total, lastPage } };
    return HttpResponse.json(body);
  }),

  http.get(`${BASE}/:id`, ({ params }) => {
    const { id } = params as { id: string };
    const boletim = boletinsFixtures.find((b) => b.id === id);
    if (!boletim) return HttpResponse.json({ message: "Boletim não encontrado." }, { status: 404 });
    return HttpResponse.json(hydrateBoletim(boletim));
  }),

  // PUT /api/boletins/:id/resultado -> regista/substitui o resultado bruto
  http.put(`${BASE}/:id/resultado`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const index = boletinsFixtures.findIndex((b) => b.id === id);
    if (index === -1) return HttpResponse.json({ message: "Boletim não encontrado." }, { status: 404 });
    if (["aprovado", "comunicado"].includes(boletinsFixtures[index].status)) {
      return HttpResponse.json({ message: "Não é possível alterar o resultado de um boletim já aprovado/comunicado." }, { status: 422 });
    }

    const { resultado } = (await request.json().catch(() => ({}))) as { resultado?: Record<string, unknown> };
    const existing = boletinsAnalisesFixtures.find((ba) => ba.boletimInternoId === id);
    const updated: BoletimAnaliseDto = existing
      ? { ...existing, resultado: resultado ?? null }
      : {
          id: `ba-${Date.now()}`,
          boletimInternoId: id,
          resultado: resultado ?? null,
          validador1Id: null,
          validador2Id: null,
          validador3Id: null,
          validadoEm: null,
          aprovadoPorId: null,
          aprovadoEm: null,
          comunicadoEm: null,
        };
    setBoletinsAnalisesFixtures(boletinsAnalisesFixtures.filter((ba) => ba.boletimInternoId !== id));
    boletinsAnalisesFixtures.push(updated);

    boletinsFixtures[index] = { ...boletinsFixtures[index], status: "resultado_registado" };
    return HttpResponse.json(hydrateBoletim(boletinsFixtures[index]));
  }),

  // POST /api/boletins/:id/validar -> assinatura de validação; ao atingir validadorCount, aprova
  http.post(`${BASE}/:id/validar`, ({ params, request }) => {
    const { id } = params as { id: string };
    const boletimIndex = boletinsFixtures.findIndex((b) => b.id === id);
    if (boletimIndex === -1) return HttpResponse.json({ message: "Boletim não encontrado." }, { status: 404 });

    const boletim = boletinsFixtures[boletimIndex];
    if (!["resultado_registado", "em_validacao"].includes(boletim.status)) {
      return HttpResponse.json({ message: "O boletim tem de ter um resultado registado antes de poder ser validado." }, { status: 422 });
    }

    const validadorId = currentUserId(request);
    if (!validadorId) return HttpResponse.json({ message: "Sessão inválida." }, { status: 401 });

    const laboratorio = laboratorioForBoletim(boletim);
    const baIndex = boletinsAnalisesFixtures.findIndex((ba) => ba.boletimInternoId === id);
    if (baIndex === -1) return HttpResponse.json({ message: "Resultado não encontrado." }, { status: 422 });
    const ba = boletinsAnalisesFixtures[baIndex];

    const jaValidaram = [ba.validador1Id, ba.validador2Id, ba.validador3Id].filter((v): v is string => !!v);
    if (jaValidaram.includes(validadorId)) {
      return HttpResponse.json({ message: "Este utilizador já validou este boletim — a RN exige validadores distintos." }, { status: 422 });
    }
    if (laboratorio?.validadoresNomeados?.length && !laboratorio.validadoresNomeados.includes(validadorId)) {
      return HttpResponse.json({ message: `A validação de ${laboratorio.code} está restrita à lista de validadores nomeados.` }, { status: 422 });
    }

    const slot = jaValidaram.length === 0 ? "validador1Id" : jaValidaram.length === 1 ? "validador2Id" : "validador3Id";
    const updatedBa: BoletimAnaliseDto = { ...ba, [slot]: validadorId };
    const totalValidadores = [updatedBa.validador1Id, updatedBa.validador2Id, updatedBa.validador3Id].filter(Boolean).length;
    const required = laboratorio?.validadorCount ?? 2;

    if (totalValidadores < required) {
      boletinsAnalisesFixtures[baIndex] = updatedBa;
      boletinsFixtures[boletimIndex] = { ...boletim, status: "em_validacao" };
      return HttpResponse.json(hydrateBoletim(boletinsFixtures[boletimIndex]));
    }

    // Gate nomeado por disciplina — Bromatologia: Salmonela tem de ser 0.
    if (laboratorio?.code === "BR") {
      const salmonela = (updatedBa.resultado as { parametros?: { salmonela?: number } } | null)?.parametros?.salmonela;
      if (salmonela !== undefined && Number(salmonela) !== 0) {
        return HttpResponse.json({ message: "Bromatologia: resultado de Salmonela tem de ser 0 para aprovar o boletim." }, { status: 422 });
      }
    }

    boletinsAnalisesFixtures[baIndex] = {
      ...updatedBa,
      validadoEm: new Date().toISOString(),
      aprovadoPorId: validadorId,
      aprovadoEm: new Date().toISOString(),
    };
    boletinsFixtures[boletimIndex] = { ...boletim, status: "aprovado", conclusaoEm: new Date().toISOString() };
    return HttpResponse.json(hydrateBoletim(boletinsFixtures[boletimIndex]));
  }),

  // POST /api/boletins/:id/comunicar -> exige boletim aprovado
  http.post(`${BASE}/:id/comunicar`, ({ params }) => {
    const { id } = params as { id: string };
    const index = boletinsFixtures.findIndex((b) => b.id === id);
    if (index === -1) return HttpResponse.json({ message: "Boletim não encontrado." }, { status: 404 });
    if (boletinsFixtures[index].status !== "aprovado") {
      return HttpResponse.json({ message: "Só é possível comunicar um boletim já aprovado." }, { status: 422 });
    }

    boletinsFixtures[index] = { ...boletinsFixtures[index], status: "comunicado" };
    const baIndex = boletinsAnalisesFixtures.findIndex((ba) => ba.boletimInternoId === id);
    if (baIndex !== -1) {
      boletinsAnalisesFixtures[baIndex] = { ...boletinsAnalisesFixtures[baIndex], comunicadoEm: new Date().toISOString() };
    }
    return HttpResponse.json(hydrateBoletim(boletinsFixtures[index]));
  }),
];

export default boletinsHandlers;
