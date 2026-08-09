import { http, HttpResponse } from "msw";
import { requisicoesFixtures } from "@/mocks/fixtures/requisicoes";
import { amostrasFixtures } from "@/mocks/fixtures/amostras";
import { boletinsFixtures, hydrateBoletim } from "@/mocks/fixtures/boletins";
import { amostraRejeicoesFixtures } from "@/mocks/fixtures/amostras";
import type { AmostraDto } from "@/types/dto/amostra";
import type { RequisicaoDto, RequisicaoPayload } from "@/types/dto/requisicao";
import type { Paginated } from "@/types/dto/paginated";

const BASE = "*/api/requisicoes";

/** Junta o boletim interno + rejeição a uma amostra, tal como o backend faz via `with()`. */
function hydrateAmostra(amostraId: string): AmostraDto | undefined {
  const amostra = amostrasFixtures.find((a) => a.id === amostraId);
  if (!amostra) return undefined;
  const boletim = boletinsFixtures.find((b) => b.amostraId === amostra.id);
  return {
    ...amostra,
    boletimInterno: boletim ? hydrateBoletim(boletim) : null,
    rejeicao: amostraRejeicoesFixtures.find((r) => r.amostraId === amostra.id) ?? null,
  };
}

function hydrateRequisicao(r: RequisicaoDto): RequisicaoDto {
  return {
    ...r,
    amostras: amostrasFixtures.filter((a) => a.requisicaoId === r.id).map((a) => hydrateAmostra(a.id)!),
  };
}

export const requisicoesHandlers = [
  http.get(BASE, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1") || 1;
    const perPage = Number(url.searchParams.get("per_page") ?? "20") || 20;
    const laboratorioId = url.searchParams.get("laboratorio_id");
    const search = (url.searchParams.get("search") ?? "").trim().toLowerCase();

    let rows = [...requisicoesFixtures].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (laboratorioId) rows = rows.filter((r) => r.laboratorioId === laboratorioId);
    if (search) {
      rows = rows.filter((r) => r.clienteNome.toLowerCase().includes(search) || r.numero.toLowerCase().includes(search));
    }

    const total = rows.length;
    const lastPage = Math.max(1, Math.ceil(total / perPage));
    const start = (page - 1) * perPage;
    const data = rows.slice(start, start + perPage).map(hydrateRequisicao);

    const body: Paginated<RequisicaoDto> = { data, meta: { currentPage: page, perPage, total, lastPage } };
    return HttpResponse.json(body);
  }),

  http.get(`${BASE}/:id`, ({ params }) => {
    const { id } = params as { id: string };
    const requisicao = requisicoesFixtures.find((r) => r.id === id);
    if (!requisicao) return HttpResponse.json({ message: "Requisição não encontrada." }, { status: 404 });
    return HttpResponse.json(hydrateRequisicao(requisicao));
  }),

  http.post(BASE, async ({ request }) => {
    const payload = (await request.json().catch(() => ({}))) as RequisicaoPayload;
    const numero = `PAT-${String(requisicoesFixtures.length + 1).padStart(3, "0")}-${new Date().getFullYear()}`;
    const id = `req-${Date.now()}`;

    const created: RequisicaoDto = {
      id,
      numero,
      laboratorioId: payload.laboratorioId,
      tipoSujeito: payload.tipoSujeito,
      clienteNome: payload.clienteNome,
      clienteContacto: payload.clienteContacto ?? null,
      veterinarioResponsavel: payload.veterinarioResponsavel ?? null,
      dadosEpidemiologicos: payload.dadosEpidemiologicos ?? null,
      dadosFacturacao: payload.dadosFacturacao ?? null,
      consentimento: !!payload.consentimento,
      assinaturaCliente: payload.assinaturaCliente,
      createdBy: "usr-0001",
      createdAt: new Date().toISOString(),
    };
    requisicoesFixtures.unshift(created);

    (payload.amostras ?? []).forEach((a, index) => {
      amostrasFixtures.push({
        id: `amo-${Date.now()}-${index}`,
        requisicaoId: id,
        numero: `${numero}-A${index + 1}`,
        tipoAmostra: a.tipoAmostra,
        origemMatriz: a.origemMatriz ?? null,
        pontoColheita: a.pontoColheita ?? null,
        colhidaPor: a.colhidaPor ?? null,
        sujeito: a.sujeito ?? null,
        latitude: null,
        longitude: null,
        recebidaEm: new Date().toISOString(),
        status: "recebida",
      });
    });

    return HttpResponse.json(hydrateRequisicao(created), { status: 201 });
  }),
];

export default requisicoesHandlers;
