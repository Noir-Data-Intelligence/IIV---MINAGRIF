import { http, HttpResponse } from "msw";
import {
  criteriasFixtures,
  cyclesFixtures,
  evaluationsFixtures,
  historyFixtures,
  scoresFixtures,
} from "@/mocks/fixtures/avaliacoes";
import { employeesTransversalFixtures } from "@/mocks/fixtures/recursosHumanosTransversal";
import { employeesLaboratorioFixtures } from "@/mocks/fixtures/recursosHumanosLaboratorio";
import { usersFixtures } from "@/mocks/fixtures/users";
import type {
  CriteriaDto,
  CriteriaInput,
  CycleDto,
  CycleInput,
  EvaluationDto,
  EvaluationInput,
  EvaluationStats,
  EvaluationStatus,
  EvaluationTransitionInput,
  HistoryDto,
} from "@/types/dto/avaliacoes";
import type { Paginated } from "@/types/dto/paginated";

/**
 * Handlers MSW do módulo Avaliações de Desempenho (5 entidades: ciclos,
 * critérios, avaliações, pontuações, histórico).
 *
 * As rotas mais específicas (`/avaliacoes/ciclos`, `/avaliacoes/criterios`,
 * `/avaliacoes/stats`, `/avaliacoes/:id/pontuacoes`, transições) são registadas
 * ANTES de `/avaliacoes/:id` e `/avaliacoes` para a especificidade ser
 * respeitada (senão "ciclos"/"stats" seriam capturados como um :id). Operam
 * sobre os arrays mutáveis em memória de `fixtures/avaliacoes.ts`.
 *
 * Workflow de aprovação — modelado como POSTs dedicados, à semelhança de
 * `/processos/:id/avancar` e `/missoes/:id/aprovar`:
 *   submeter  rascunho|rejeitada -> submetida
 *   aprovar   submetida          -> aprovada
 *   rejeitar  submetida          -> rejeitada   (motivo obrigatório)
 *   validar   aprovada           -> validada    (reconhecimento)
 *   reabrir   aprovada|validada|rejeitada -> rascunho
 * CADA transição regista automaticamente uma linha em `historyFixtures`.
 */
const BASE = "*/api/avaliacoes";

// --- Resolução de nomes (eager-load simulado) -------------------------------

function employeeName(id: string): string | null {
  return (
    employeesTransversalFixtures.find((e) => e.id === id)?.fullName ??
    employeesLaboratorioFixtures.find((e) => e.id === id)?.fullName ??
    null
  );
}
function userName(id: string | null): string | null {
  if (!id) return null;
  return usersFixtures.find((u) => u.id === id)?.fullName ?? null;
}
function cycleName(id: string): string | null {
  return cyclesFixtures.find((c) => c.id === id)?.name ?? null;
}

/** Preenche os campos `*Name` resolvidos de uma avaliação para a resposta. */
function withNames(e: EvaluationDto): EvaluationDto {
  return {
    ...e,
    cycleName: cycleName(e.cycleId),
    employeeName: employeeName(e.employeeId),
    evaluatorName: userName(e.evaluatorId),
    approvedByName: userName(e.approvedBy),
  };
}

let historySeq = 1000;
/** Regista uma linha de histórico para uma transição de workflow. */
function pushHistory(
  evaluationId: string,
  actorId: string | null,
  action: string,
  fromStatus: EvaluationStatus | null,
  toStatus: EvaluationStatus,
  comment: string | null,
): void {
  const row: HistoryDto = {
    id: `his-${historySeq++}`,
    evaluationId,
    actorId,
    actorName: userName(actorId),
    action,
    fromStatus,
    toStatus,
    comment,
    changes: { from: fromStatus, to: toStatus },
    createdAt: new Date().toISOString(),
  };
  historyFixtures.unshift(row);
}

/** Aplica uma transição de estado + regista histórico; devolve a resposta HTTP. */
async function applyTransition(
  id: string,
  request: Request,
  allowedFrom: EvaluationStatus[],
  action: string,
  toStatus: EvaluationStatus,
  patch: (e: EvaluationDto, actorId: string | null, reason: string | null) => Partial<EvaluationDto>,
) {
  const index = evaluationsFixtures.findIndex((e) => e.id === id);
  if (index === -1) {
    return HttpResponse.json({ message: "Avaliação não encontrada." }, { status: 404 });
  }
  const current = evaluationsFixtures[index];
  if (!allowedFrom.includes(current.status)) {
    return HttpResponse.json(
      { message: `Transição inválida a partir do estado "${current.status}".` },
      { status: 409 },
    );
  }
  const payload = (await request.json().catch(() => ({}))) as EvaluationTransitionInput;
  const actorId = payload.actorId ?? null;
  const reason = payload.reason ?? null;
  const from = current.status;
  const updated: EvaluationDto = { ...current, ...patch(current, actorId, reason), status: toStatus };
  evaluationsFixtures[index] = updated;
  pushHistory(id, actorId, action, from, toStatus, reason);
  return HttpResponse.json(withNames(updated));
}

export const avaliacoesHandlers = [
  // ======================= CICLOS =======================
  // GET /avaliacoes/ciclos -> lista paginada + filtrada (ano desc)
  http.get(`${BASE}/ciclos`, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1") || 1;
    const perPage = Number(url.searchParams.get("per_page") ?? "20") || 20;
    const search = (url.searchParams.get("search") ?? "").trim().toLowerCase();
    const status = url.searchParams.get("status") ?? "";

    let rows = [...cyclesFixtures].sort((a, b) => b.year - a.year);
    if (status) rows = rows.filter((c) => c.status === status);
    if (search) {
      rows = rows.filter(
        (c) =>
          c.name.toLowerCase().includes(search) ||
          String(c.year).includes(search) ||
          (c.description ?? "").toLowerCase().includes(search),
      );
    }

    const total = rows.length;
    const lastPage = Math.max(1, Math.ceil(total / perPage));
    const start = (page - 1) * perPage;
    const body: Paginated<CycleDto> = {
      data: rows.slice(start, start + perPage),
      meta: { currentPage: page, perPage, total, lastPage },
    };
    return HttpResponse.json(body);
  }),

  // POST /avaliacoes/ciclos -> cria ciclo
  http.post(`${BASE}/ciclos`, async ({ request }) => {
    const payload = (await request.json().catch(() => ({}))) as CycleInput;
    const created: CycleDto = {
      id: `cyc-${Date.now()}`,
      name: payload.name ?? "Sem nome",
      year: Number(payload.year) || new Date().getFullYear(),
      startDate: payload.startDate ?? new Date().toISOString().slice(0, 10),
      endDate: payload.endDate ?? new Date().toISOString().slice(0, 10),
      status: payload.status ?? "planeado",
      description: payload.description ?? null,
      createdAt: new Date().toISOString(),
    };
    cyclesFixtures.unshift(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  // PUT /avaliacoes/ciclos/:id -> actualiza ciclo
  http.put(`${BASE}/ciclos/:id`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const index = cyclesFixtures.findIndex((c) => c.id === id);
    if (index === -1) return HttpResponse.json({ message: "Ciclo não encontrado." }, { status: 404 });
    const payload = (await request.json().catch(() => ({}))) as Partial<CycleInput>;
    const updated: CycleDto = {
      ...cyclesFixtures[index],
      ...payload,
      year: payload.year !== undefined ? Number(payload.year) : cyclesFixtures[index].year,
      id: cyclesFixtures[index].id,
      createdAt: cyclesFixtures[index].createdAt,
    };
    cyclesFixtures[index] = updated;
    return HttpResponse.json(updated);
  }),

  // DELETE /avaliacoes/ciclos/:id -> remove ciclo + critérios + avaliações dependentes
  http.delete(`${BASE}/ciclos/:id`, ({ params }) => {
    const { id } = params as { id: string };
    const index = cyclesFixtures.findIndex((c) => c.id === id);
    if (index === -1) return HttpResponse.json({ message: "Ciclo não encontrado." }, { status: 404 });
    cyclesFixtures.splice(index, 1);
    for (let i = criteriasFixtures.length - 1; i >= 0; i--) {
      if (criteriasFixtures[i].cycleId === id) criteriasFixtures.splice(i, 1);
    }
    for (let i = evaluationsFixtures.length - 1; i >= 0; i--) {
      if (evaluationsFixtures[i].cycleId === id) evaluationsFixtures.splice(i, 1);
    }
    return new HttpResponse(null, { status: 204 });
  }),

  // ======================= CRITÉRIOS =======================
  // GET /avaliacoes/criterios -> lista paginada + filtrada (por ciclo, ordem)
  http.get(`${BASE}/criterios`, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1") || 1;
    const perPage = Number(url.searchParams.get("per_page") ?? "20") || 20;
    const search = (url.searchParams.get("search") ?? "").trim().toLowerCase();
    const cycleId = url.searchParams.get("cycle_id") ?? "";

    let rows = [...criteriasFixtures].sort((a, b) => a.displayOrder - b.displayOrder);
    if (cycleId) rows = rows.filter((c) => c.cycleId === cycleId);
    if (search) {
      rows = rows.filter(
        (c) => c.name.toLowerCase().includes(search) || (c.description ?? "").toLowerCase().includes(search),
      );
    }

    const total = rows.length;
    const lastPage = Math.max(1, Math.ceil(total / perPage));
    const start = (page - 1) * perPage;
    const body: Paginated<CriteriaDto> = {
      data: rows.slice(start, start + perPage),
      meta: { currentPage: page, perPage, total, lastPage },
    };
    return HttpResponse.json(body);
  }),

  // POST /avaliacoes/criterios -> cria critério
  http.post(`${BASE}/criterios`, async ({ request }) => {
    const payload = (await request.json().catch(() => ({}))) as CriteriaInput;
    const created: CriteriaDto = {
      id: `cri-${Date.now()}`,
      cycleId: payload.cycleId ?? "",
      name: payload.name ?? "Sem nome",
      weight: Number(payload.weight) || 1,
      description: payload.description ?? null,
      displayOrder: Number(payload.displayOrder) || 0,
      createdAt: new Date().toISOString(),
    };
    criteriasFixtures.push(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  // PUT /avaliacoes/criterios/:id -> actualiza critério
  http.put(`${BASE}/criterios/:id`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const index = criteriasFixtures.findIndex((c) => c.id === id);
    if (index === -1) return HttpResponse.json({ message: "Critério não encontrado." }, { status: 404 });
    const payload = (await request.json().catch(() => ({}))) as Partial<CriteriaInput>;
    const updated: CriteriaDto = {
      ...criteriasFixtures[index],
      ...payload,
      weight: payload.weight !== undefined ? Number(payload.weight) : criteriasFixtures[index].weight,
      displayOrder:
        payload.displayOrder !== undefined ? Number(payload.displayOrder) : criteriasFixtures[index].displayOrder,
      id: criteriasFixtures[index].id,
      createdAt: criteriasFixtures[index].createdAt,
    };
    criteriasFixtures[index] = updated;
    return HttpResponse.json(updated);
  }),

  // DELETE /avaliacoes/criterios/:id -> remove critério
  http.delete(`${BASE}/criterios/:id`, ({ params }) => {
    const { id } = params as { id: string };
    const index = criteriasFixtures.findIndex((c) => c.id === id);
    if (index === -1) return HttpResponse.json({ message: "Critério não encontrado." }, { status: 404 });
    criteriasFixtures.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // ======================= AVALIAÇÕES: sub-recursos e stats =======================
  // GET /avaliacoes/stats -> KPIs agregados
  http.get(`${BASE}/stats`, () => {
    const pending = evaluationsFixtures.filter((e) => e.status === "submetida").length;
    const scored = evaluationsFixtures.filter((e) => e.globalScore != null);
    const avg =
      scored.length > 0
        ? Math.round((scored.reduce((s, e) => s + Number(e.globalScore), 0) / scored.length) * 10) / 10
        : null;
    const activeCycle = cyclesFixtures.find((c) => c.status === "aberto") ?? null;
    const body: EvaluationStats = {
      total: evaluationsFixtures.length,
      pending,
      avgScore: avg,
      activeCycleName: activeCycle?.name ?? null,
    };
    return HttpResponse.json(body);
  }),

  // GET /avaliacoes/:id/pontuacoes -> pontuações por critério
  http.get(`${BASE}/:id/pontuacoes`, ({ params }) => {
    const { id } = params as { id: string };
    const rows = scoresFixtures.filter((s) => s.evaluationId === id);
    return HttpResponse.json(rows);
  }),

  // GET /avaliacoes/:id/historico -> histórico de transições (mais recente primeiro)
  http.get(`${BASE}/:id/historico`, ({ params }) => {
    const { id } = params as { id: string };
    const rows = historyFixtures
      .filter((h) => h.evaluationId === id)
      .map((h) => ({ ...h, actorName: userName(h.actorId) }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return HttpResponse.json(rows);
  }),

  // ======================= WORKFLOW =======================
  // POST /avaliacoes/:id/submeter -> rascunho|rejeitada -> submetida
  http.post(`${BASE}/:id/submeter`, ({ params, request }) => {
    const { id } = params as { id: string };
    return applyTransition(id, request, ["rascunho", "rejeitada"], "submeteu", "submetida", () => ({
      submittedAt: new Date().toISOString(),
      rejectionReason: null,
    }));
  }),

  // POST /avaliacoes/:id/aprovar -> submetida -> aprovada
  http.post(`${BASE}/:id/aprovar`, ({ params, request }) => {
    const { id } = params as { id: string };
    return applyTransition(id, request, ["submetida"], "aprovou", "aprovada", (_e, actorId) => ({
      approvedAt: new Date().toISOString(),
      approvedBy: actorId,
      rejectionReason: null,
    }));
  }),

  // POST /avaliacoes/:id/rejeitar -> submetida -> rejeitada (motivo obrigatório)
  http.post(`${BASE}/:id/rejeitar`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const body = (await request.clone().json().catch(() => ({}))) as EvaluationTransitionInput;
    if (!body.reason || !String(body.reason).trim()) {
      return HttpResponse.json({ message: "O motivo da rejeição é obrigatório." }, { status: 422 });
    }
    return applyTransition(id, request, ["submetida"], "rejeitou", "rejeitada", (_e, _actorId, reason) => ({
      rejectionReason: reason,
    }));
  }),

  // POST /avaliacoes/:id/validar -> aprovada -> validada (reconhecimento)
  http.post(`${BASE}/:id/validar`, ({ params, request }) => {
    const { id } = params as { id: string };
    return applyTransition(id, request, ["aprovada"], "validou", "validada", () => ({
      acknowledgedAt: new Date().toISOString(),
    }));
  }),

  // POST /avaliacoes/:id/reabrir -> aprovada|validada|rejeitada -> rascunho
  http.post(`${BASE}/:id/reabrir`, ({ params, request }) => {
    const { id } = params as { id: string };
    return applyTransition(
      id,
      request,
      ["aprovada", "validada", "rejeitada"],
      "reabriu",
      "rascunho",
      () => ({
        submittedAt: null,
        approvedAt: null,
        approvedBy: null,
        rejectionReason: null,
        acknowledgedAt: null,
      }),
    );
  }),

  // ======================= AVALIAÇÕES: CRUD =======================
  // GET /avaliacoes/:id -> detalhe (com nomes resolvidos)
  http.get(`${BASE}/:id`, ({ params }) => {
    const { id } = params as { id: string };
    const found = evaluationsFixtures.find((e) => e.id === id);
    if (!found) return HttpResponse.json({ message: "Avaliação não encontrada." }, { status: 404 });
    return HttpResponse.json(withNames(found));
  }),

  // GET /avaliacoes -> lista paginada + filtrada (mais recente primeiro)
  http.get(BASE, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1") || 1;
    const perPage = Number(url.searchParams.get("per_page") ?? "20") || 20;
    const search = (url.searchParams.get("search") ?? "").trim().toLowerCase();
    const status = url.searchParams.get("status") ?? "";
    const cycleId = url.searchParams.get("cycle_id") ?? "";
    const employeeId = url.searchParams.get("employee_id") ?? "";

    let rows = evaluationsFixtures.map(withNames).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (status) rows = rows.filter((e) => e.status === status);
    if (cycleId) rows = rows.filter((e) => e.cycleId === cycleId);
    if (employeeId) rows = rows.filter((e) => e.employeeId === employeeId);
    if (search) {
      rows = rows.filter(
        (e) =>
          (e.employeeName ?? "").toLowerCase().includes(search) ||
          (e.evaluatorName ?? "").toLowerCase().includes(search) ||
          (e.cycleName ?? "").toLowerCase().includes(search),
      );
    }

    const total = rows.length;
    const lastPage = Math.max(1, Math.ceil(total / perPage));
    const start = (page - 1) * perPage;
    const body: Paginated<EvaluationDto> = {
      data: rows.slice(start, start + perPage),
      meta: { currentPage: page, perPage, total, lastPage },
    };
    return HttpResponse.json(body);
  }),

  // POST /avaliacoes -> cria avaliação (nasce em rascunho) + regista histórico
  http.post(BASE, async ({ request }) => {
    const payload = (await request.json().catch(() => ({}))) as EvaluationInput & { evaluatorId?: string | null };
    const now = new Date().toISOString();
    const created: EvaluationDto = {
      id: `ava-${Date.now()}`,
      cycleId: payload.cycleId ?? "",
      cycleName: null,
      employeeId: payload.employeeId ?? "",
      employeeName: null,
      evaluatorId: payload.evaluatorId ?? null,
      evaluatorName: null,
      evaluationDate: payload.evaluationDate ?? null,
      globalScore: payload.globalScore ?? null,
      strengths: payload.strengths ?? null,
      improvements: payload.improvements ?? null,
      generalComments: payload.generalComments ?? null,
      status: "rascunho",
      submittedAt: null,
      approvedAt: null,
      approvedBy: null,
      approvedByName: null,
      rejectionReason: null,
      acknowledgedAt: null,
      createdAt: now,
    };
    evaluationsFixtures.unshift(created);
    pushHistory(created.id, created.evaluatorId, "criou", null, "rascunho", null);
    return HttpResponse.json(withNames(created), { status: 201 });
  }),

  // PUT /avaliacoes/:id -> actualiza campos editáveis da avaliação
  http.put(`${BASE}/:id`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const index = evaluationsFixtures.findIndex((e) => e.id === id);
    if (index === -1) return HttpResponse.json({ message: "Avaliação não encontrada." }, { status: 404 });
    const payload = (await request.json().catch(() => ({}))) as Partial<EvaluationInput>;
    const updated: EvaluationDto = {
      ...evaluationsFixtures[index],
      cycleId: payload.cycleId ?? evaluationsFixtures[index].cycleId,
      employeeId: payload.employeeId ?? evaluationsFixtures[index].employeeId,
      evaluatorId: payload.evaluatorId !== undefined ? payload.evaluatorId : evaluationsFixtures[index].evaluatorId,
      evaluationDate:
        payload.evaluationDate !== undefined ? payload.evaluationDate : evaluationsFixtures[index].evaluationDate,
      globalScore: payload.globalScore !== undefined ? payload.globalScore : evaluationsFixtures[index].globalScore,
      strengths: payload.strengths !== undefined ? payload.strengths : evaluationsFixtures[index].strengths,
      improvements: payload.improvements !== undefined ? payload.improvements : evaluationsFixtures[index].improvements,
      generalComments:
        payload.generalComments !== undefined
          ? payload.generalComments
          : evaluationsFixtures[index].generalComments,
    };
    evaluationsFixtures[index] = updated;
    return HttpResponse.json(withNames(updated));
  }),

  // DELETE /avaliacoes/:id -> remove avaliação + pontuações + histórico
  http.delete(`${BASE}/:id`, ({ params }) => {
    const { id } = params as { id: string };
    const index = evaluationsFixtures.findIndex((e) => e.id === id);
    if (index === -1) return HttpResponse.json({ message: "Avaliação não encontrada." }, { status: 404 });
    evaluationsFixtures.splice(index, 1);
    for (let i = scoresFixtures.length - 1; i >= 0; i--) {
      if (scoresFixtures[i].evaluationId === id) scoresFixtures.splice(i, 1);
    }
    for (let i = historyFixtures.length - 1; i >= 0; i--) {
      if (historyFixtures[i].evaluationId === id) historyFixtures.splice(i, 1);
    }
    return new HttpResponse(null, { status: 204 });
  }),
];

export default avaliacoesHandlers;
