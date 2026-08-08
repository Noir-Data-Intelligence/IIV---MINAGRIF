import { http, HttpResponse } from "msw";
import { amostrasFixtures, amostraRejeicoesFixtures } from "@/mocks/fixtures/amostras";
import { boletinsFixtures, hydrateBoletim } from "@/mocks/fixtures/boletins";
import type { AmostraDto, RejeitarAmostraPayload } from "@/types/dto/amostra";
import type { BoletimInternoDto } from "@/types/dto/boletim";
import type { Paginated } from "@/types/dto/paginated";

const BASE = "*/api/amostras";

function hydrate(amostra: AmostraDto): AmostraDto {
  const boletim = boletinsFixtures.find((b) => b.amostraId === amostra.id);
  return {
    ...amostra,
    boletimInterno: boletim ? hydrateBoletim(boletim) : null,
    rejeicao: amostraRejeicoesFixtures.find((r) => r.amostraId === amostra.id) ?? null,
  };
}

export const amostrasHandlers = [
  http.get(BASE, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1") || 1;
    const perPage = Number(url.searchParams.get("per_page") ?? "20") || 20;
    const requisicaoId = url.searchParams.get("requisicao_id");
    const status = url.searchParams.get("status");

    let rows = [...amostrasFixtures].sort((a, b) => b.recebidaEm.localeCompare(a.recebidaEm));
    if (requisicaoId) rows = rows.filter((a) => a.requisicaoId === requisicaoId);
    if (status) rows = rows.filter((a) => a.status === status);

    const total = rows.length;
    const lastPage = Math.max(1, Math.ceil(total / perPage));
    const start = (page - 1) * perPage;
    const data = rows.slice(start, start + perPage).map(hydrate);

    const body: Paginated<AmostraDto> = { data, meta: { currentPage: page, perPage, total, lastPage } };
    return HttpResponse.json(body);
  }),

  http.get(`${BASE}/:id`, ({ params }) => {
    const { id } = params as { id: string };
    const amostra = amostrasFixtures.find((a) => a.id === id);
    if (!amostra) return HttpResponse.json({ message: "Amostra não encontrada." }, { status: 404 });
    return HttpResponse.json(hydrate(amostra));
  }),

  // POST /api/amostras/:id/aceitar -> abre o Boletim Interno
  http.post(`${BASE}/:id/aceitar`, ({ params }) => {
    const { id } = params as { id: string };
    const index = amostrasFixtures.findIndex((a) => a.id === id);
    if (index === -1) return HttpResponse.json({ message: "Amostra não encontrada." }, { status: 404 });
    if (amostrasFixtures[index].status !== "recebida") {
      return HttpResponse.json({ message: 'Só é possível aceitar uma amostra em estado "recebida".' }, { status: 422 });
    }

    amostrasFixtures[index] = { ...amostrasFixtures[index], status: "aceite" };

    const boletim: BoletimInternoDto = {
      id: `bol-${Date.now()}`,
      amostraId: id,
      numeroAnalise: `PAT-${String(boletinsFixtures.length + 1).padStart(3, "0")}-${new Date().getFullYear()}`,
      exames: null,
      entradaEm: new Date().toISOString(),
      inicioEm: new Date().toISOString(),
      conclusaoEm: null,
      status: "em_analise",
      boletimAnalise: null,
    };
    boletinsFixtures.push(boletim);

    return HttpResponse.json(hydrate(amostrasFixtures[index]));
  }),

  // POST /api/amostras/:id/rejeitar -> exige criterio + assinatura (RN Termo de Rejeição)
  http.post(`${BASE}/:id/rejeitar`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const index = amostrasFixtures.findIndex((a) => a.id === id);
    if (index === -1) return HttpResponse.json({ message: "Amostra não encontrada." }, { status: 404 });
    if (amostrasFixtures[index].status !== "recebida") {
      return HttpResponse.json({ message: 'Só é possível rejeitar uma amostra em estado "recebida".' }, { status: 422 });
    }

    const payload = (await request.json().catch(() => ({}))) as Partial<RejeitarAmostraPayload>;
    if (!payload.criterioRejeicaoId || !payload.assinaturaResponsavel) {
      return HttpResponse.json({ message: "Critério e assinatura do responsável são obrigatórios." }, { status: 422 });
    }

    amostrasFixtures[index] = { ...amostrasFixtures[index], status: "rejeitada" };
    amostraRejeicoesFixtures.push({
      id: `arej-${Date.now()}`,
      amostraId: id,
      criterioRejeicaoId: payload.criterioRejeicaoId,
      responsavelId: "usr-0001",
      detalhe: payload.detalhe ?? null,
      assinaturaResponsavel: payload.assinaturaResponsavel,
      rejeitadaEm: new Date().toISOString(),
    });

    return HttpResponse.json(hydrate(amostrasFixtures[index]));
  }),
];

export default amostrasHandlers;
