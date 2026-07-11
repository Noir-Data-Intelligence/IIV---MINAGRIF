import { http, HttpResponse } from "msw";
import {
  expensesFixtures,
  guidesFixtures,
  missionsFixtures,
  participantsFixtures,
  reportsFixtures,
} from "@/mocks/fixtures/missoes";
import { usersFixtures } from "@/mocks/fixtures/users";
import type {
  ExpenseDto,
  ExpenseInput,
  GuideDto,
  GuideInput,
  MissionDto,
  MissionStats,
  MissionStatus,
  MissionTransitionInput,
  ParticipantDto,
  ParticipantInput,
  ReportDto,
  ReportInput,
} from "@/types/dto/missoes";
import type { Paginated } from "@/types/dto/paginated";

/**
 * Handlers MSW do módulo Missões (+ sub-recursos guia, participantes, despesas,
 * relatório e transições de workflow).
 *
 * As rotas mais específicas (`/missoes/stats`, `/missoes/:id/participantes`, …)
 * são registadas ANTES de `/missoes/:id` para a especificidade ser respeitada
 * (senão "stats" seria capturado como um :id). Todos operam sobre os arrays
 * mutáveis em memória de `fixtures/missoes.ts`.
 *
 * Workflow de aprovação (self-contained, sem criar processos BPM — ver nota na
 * página): `submeter` planeada->submetida, `aprovar` submetida->aprovada,
 * `rejeitar` submetida->planeada. Modelado como POSTs dedicados, à semelhança de
 * `/processos/:id/avancar`.
 */
const BASE = "*/api/missoes";

/** Resolve o nome do utilizador (eager-load simulado) para um participante. */
function withFullName(p: ParticipantDto): ParticipantDto {
  const user = usersFixtures.find((u) => u.id === p.userId);
  return { ...p, fullName: user?.fullName ?? p.fullName ?? null };
}

export const missoesHandlers = [
  // GET /missoes/stats -> KPIs agregados
  http.get(`${BASE}/stats`, () => {
    const active = missionsFixtures.filter((m) => m.status === "em_curso").length;
    const pending = missionsFixtures.filter(
      (m) => m.status === "submetida" || m.status === "planeada" || m.status === "aprovada",
    ).length;
    const budget = missionsFixtures
      .filter((m) => m.status !== "cancelada")
      .reduce((sum, m) => sum + Number(m.budget || 0), 0);
    const body: MissionStats = {
      total: missionsFixtures.length,
      emCurso: active,
      pendentes: pending,
      totalBudget: budget,
    };
    return HttpResponse.json(body);
  }),

  // GET /missoes/:id/participantes -> lista de participantes (com nome resolvido)
  http.get(`${BASE}/:id/participantes`, ({ params }) => {
    const { id } = params as { id: string };
    const rows = participantsFixtures
      .filter((p) => p.missionId === id)
      .map(withFullName);
    return HttpResponse.json(rows);
  }),

  // GET /missoes/:id/guia -> guia de marcha (ou null)
  http.get(`${BASE}/:id/guia`, ({ params }) => {
    const { id } = params as { id: string };
    const guide = guidesFixtures.find((g) => g.missionId === id) ?? null;
    return HttpResponse.json(guide);
  }),

  // GET /missoes/:id/despesas -> lista de despesas (mais recente primeiro)
  http.get(`${BASE}/:id/despesas`, ({ params }) => {
    const { id } = params as { id: string };
    const rows = expensesFixtures
      .filter((e) => e.missionId === id)
      .sort((a, b) => b.expenseDate.localeCompare(a.expenseDate));
    return HttpResponse.json(rows);
  }),

  // GET /missoes/:id/relatorio -> relatório final (ou null)
  http.get(`${BASE}/:id/relatorio`, ({ params }) => {
    const { id } = params as { id: string };
    const report = reportsFixtures.find((r) => r.missionId === id) ?? null;
    return HttpResponse.json(report);
  }),

  // GET /missoes/:id -> detalhe de uma missão
  http.get(`${BASE}/:id`, ({ params }) => {
    const { id } = params as { id: string };
    const found = missionsFixtures.find((m) => m.id === id);
    if (!found) {
      return HttpResponse.json({ message: "Missão não encontrada." }, { status: 404 });
    }
    return HttpResponse.json(found);
  }),

  // GET /missoes -> lista paginada + filtrada, ordenada por data de início desc
  http.get(BASE, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1") || 1;
    const perPage = Number(url.searchParams.get("per_page") ?? "20") || 20;
    const search = (url.searchParams.get("search") ?? "").trim().toLowerCase();
    const status = url.searchParams.get("status") ?? "";

    let rows = [...missionsFixtures].sort((a, b) => b.startDate.localeCompare(a.startDate));

    if (status) rows = rows.filter((m) => m.status === status);
    if (search) {
      rows = rows.filter(
        (m) =>
          m.title.toLowerCase().includes(search) ||
          m.destination.toLowerCase().includes(search) ||
          (m.purpose ?? "").toLowerCase().includes(search),
      );
    }

    const total = rows.length;
    const lastPage = Math.max(1, Math.ceil(total / perPage));
    const start = (page - 1) * perPage;
    const data = rows.slice(start, start + perPage);

    const body: Paginated<MissionDto> = {
      data,
      meta: { currentPage: page, perPage, total, lastPage },
    };
    return HttpResponse.json(body);
  }),

  // POST /missoes/:id/submeter -> planeada -> submetida
  http.post(`${BASE}/:id/submeter`, async ({ params }) => {
    const { id } = params as { id: string };
    const index = missionsFixtures.findIndex((m) => m.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Missão não encontrada." }, { status: 404 });
    }
    if (missionsFixtures[index].status !== "planeada") {
      return HttpResponse.json({ message: "Só missões planeadas podem ser submetidas." }, { status: 409 });
    }
    missionsFixtures[index] = { ...missionsFixtures[index], status: "submetida" };
    return HttpResponse.json(missionsFixtures[index]);
  }),

  // POST /missoes/:id/aprovar -> submetida -> aprovada
  http.post(`${BASE}/:id/aprovar`, async ({ params }) => {
    const { id } = params as { id: string };
    const index = missionsFixtures.findIndex((m) => m.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Missão não encontrada." }, { status: 404 });
    }
    if (missionsFixtures[index].status !== "submetida") {
      return HttpResponse.json({ message: "Só missões submetidas podem ser aprovadas." }, { status: 409 });
    }
    missionsFixtures[index] = { ...missionsFixtures[index], status: "aprovada" };
    return HttpResponse.json(missionsFixtures[index]);
  }),

  // POST /missoes/:id/rejeitar -> submetida -> planeada (devolve para revisão)
  http.post(`${BASE}/:id/rejeitar`, async ({ params }) => {
    const { id } = params as { id: string };
    const index = missionsFixtures.findIndex((m) => m.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Missão não encontrada." }, { status: 404 });
    }
    if (missionsFixtures[index].status !== "submetida") {
      return HttpResponse.json({ message: "Só missões submetidas podem ser rejeitadas." }, { status: 409 });
    }
    missionsFixtures[index] = { ...missionsFixtures[index], status: "planeada" };
    return HttpResponse.json(missionsFixtures[index]);
  }),

  // POST /missoes/:id/participantes -> adiciona participante
  http.post(`${BASE}/:id/participantes`, async ({ params, request }) => {
    const { id } = params as { id: string };
    if (!missionsFixtures.some((m) => m.id === id)) {
      return HttpResponse.json({ message: "Missão não encontrada." }, { status: 404 });
    }
    const payload = (await request.json().catch(() => ({}))) as ParticipantInput;
    const created: ParticipantDto = {
      id: `par-${Date.now()}`,
      missionId: id,
      userId: payload.userId ?? "",
      fullName: null,
      role: payload.role?.trim() || "Participante",
      perDiem: Number(payload.perDiem) || 0,
      createdAt: new Date().toISOString(),
    };
    participantsFixtures.push(created);
    return HttpResponse.json(withFullName(created), { status: 201 });
  }),

  // DELETE /missoes/:id/participantes/:pid -> remove participante
  http.delete(`${BASE}/:id/participantes/:pid`, ({ params }) => {
    const { pid } = params as { id: string; pid: string };
    const index = participantsFixtures.findIndex((p) => p.id === pid);
    if (index === -1) {
      return HttpResponse.json({ message: "Participante não encontrado." }, { status: 404 });
    }
    participantsFixtures.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // PUT /missoes/:id/guia -> upsert da guia única
  http.put(`${BASE}/:id/guia`, async ({ params, request }) => {
    const { id } = params as { id: string };
    if (!missionsFixtures.some((m) => m.id === id)) {
      return HttpResponse.json({ message: "Missão não encontrada." }, { status: 404 });
    }
    const payload = (await request.json().catch(() => ({}))) as GuideInput;
    const index = guidesFixtures.findIndex((g) => g.missionId === id);
    if (index === -1) {
      const created: GuideDto = {
        id: `gui-${Date.now()}`,
        missionId: id,
        guideNumber: payload.guideNumber ?? "",
        issueDate: payload.issueDate ?? new Date().toISOString().slice(0, 10),
        perDiem: Number(payload.perDiem) || 0,
        transport: payload.transport ?? null,
        notes: payload.notes ?? null,
        createdAt: new Date().toISOString(),
      };
      guidesFixtures.push(created);
      return HttpResponse.json(created, { status: 201 });
    }
    const updated: GuideDto = {
      ...guidesFixtures[index],
      guideNumber: payload.guideNumber ?? guidesFixtures[index].guideNumber,
      issueDate: payload.issueDate ?? guidesFixtures[index].issueDate,
      perDiem: payload.perDiem !== undefined ? Number(payload.perDiem) : guidesFixtures[index].perDiem,
      transport: payload.transport ?? null,
      notes: payload.notes ?? null,
    };
    guidesFixtures[index] = updated;
    return HttpResponse.json(updated);
  }),

  // POST /missoes/:id/despesas -> adiciona despesa
  http.post(`${BASE}/:id/despesas`, async ({ params, request }) => {
    const { id } = params as { id: string };
    if (!missionsFixtures.some((m) => m.id === id)) {
      return HttpResponse.json({ message: "Missão não encontrada." }, { status: 404 });
    }
    const payload = (await request.json().catch(() => ({}))) as ExpenseInput;
    const created: ExpenseDto = {
      id: `exp-${Date.now()}`,
      missionId: id,
      category: payload.category ?? "outro",
      description: payload.description ?? null,
      amount: Number(payload.amount) || 0,
      currency: payload.currency ?? "AOA",
      expenseDate: payload.expenseDate ?? new Date().toISOString().slice(0, 10),
      receiptUrl: payload.receiptUrl ?? null,
      createdAt: new Date().toISOString(),
    };
    expensesFixtures.push(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  // DELETE /missoes/:id/despesas/:eid -> remove despesa
  http.delete(`${BASE}/:id/despesas/:eid`, ({ params }) => {
    const { eid } = params as { id: string; eid: string };
    const index = expensesFixtures.findIndex((e) => e.id === eid);
    if (index === -1) {
      return HttpResponse.json({ message: "Despesa não encontrada." }, { status: 404 });
    }
    expensesFixtures.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // POST /missoes/:id/relatorio/aprovar -> aprova o relatório submetido
  http.post(`${BASE}/:id/relatorio/aprovar`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const index = reportsFixtures.findIndex((r) => r.missionId === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Relatório não encontrado." }, { status: 404 });
    }
    const payload = (await request.json().catch(() => ({}))) as MissionTransitionInput;
    const updated: ReportDto = {
      ...reportsFixtures[index],
      status: "aprovado",
      approvedBy: payload.actorId ?? null,
      approvedAt: new Date().toISOString(),
    };
    reportsFixtures[index] = updated;
    return HttpResponse.json(updated);
  }),

  // PUT /missoes/:id/relatorio -> upsert do relatório único
  http.put(`${BASE}/:id/relatorio`, async ({ params, request }) => {
    const { id } = params as { id: string };
    if (!missionsFixtures.some((m) => m.id === id)) {
      return HttpResponse.json({ message: "Missão não encontrada." }, { status: 404 });
    }
    const payload = (await request.json().catch(() => ({}))) as ReportInput;
    const index = reportsFixtures.findIndex((r) => r.missionId === id);
    if (index === -1) {
      const created: ReportDto = {
        id: `rep-${Date.now()}`,
        missionId: id,
        reportDate: payload.reportDate ?? new Date().toISOString().slice(0, 10),
        summary: payload.summary ?? null,
        outcomes: payload.outcomes ?? null,
        status: payload.status ?? "rascunho",
        submittedBy: payload.submittedBy ?? null,
        approvedBy: null,
        approvedAt: null,
        createdAt: new Date().toISOString(),
      };
      reportsFixtures.push(created);
      return HttpResponse.json(created, { status: 201 });
    }
    const updated: ReportDto = {
      ...reportsFixtures[index],
      reportDate: payload.reportDate ?? reportsFixtures[index].reportDate,
      summary: payload.summary ?? null,
      outcomes: payload.outcomes ?? null,
      status: payload.status ?? reportsFixtures[index].status,
      submittedBy: payload.submittedBy ?? reportsFixtures[index].submittedBy,
    };
    reportsFixtures[index] = updated;
    return HttpResponse.json(updated);
  }),

  // POST /missoes -> cria missão
  http.post(BASE, async ({ request }) => {
    const payload = (await request.json().catch(() => ({}))) as Partial<MissionDto>;
    const now = new Date().toISOString();
    const created: MissionDto = {
      id: `mis-${Date.now()}`,
      title: payload.title ?? "Sem título",
      destination: payload.destination ?? "",
      purpose: payload.purpose ?? null,
      startDate: payload.startDate ?? now.slice(0, 10),
      endDate: payload.endDate ?? now.slice(0, 10),
      status: (payload.status as MissionStatus) ?? "planeada",
      budget: Number(payload.budget) || 0,
      currency: payload.currency ?? "AOA",
      notes: payload.notes ?? null,
      createdBy: payload.createdBy ?? null,
      createdAt: now,
    };
    missionsFixtures.unshift(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  // PUT /missoes/:id -> actualiza missão
  http.put(`${BASE}/:id`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const index = missionsFixtures.findIndex((m) => m.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Missão não encontrada." }, { status: 404 });
    }
    const payload = (await request.json().catch(() => ({}))) as Partial<MissionDto>;
    const updated: MissionDto = {
      ...missionsFixtures[index],
      ...payload,
      id: missionsFixtures[index].id,
      createdAt: missionsFixtures[index].createdAt,
    };
    missionsFixtures[index] = updated;
    return HttpResponse.json(updated);
  }),

  // DELETE /missoes/:id -> remove a missão e todas as sub-entidades
  http.delete(`${BASE}/:id`, ({ params }) => {
    const { id } = params as { id: string };
    const index = missionsFixtures.findIndex((m) => m.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Missão não encontrada." }, { status: 404 });
    }
    missionsFixtures.splice(index, 1);
    for (let i = participantsFixtures.length - 1; i >= 0; i--) {
      if (participantsFixtures[i].missionId === id) participantsFixtures.splice(i, 1);
    }
    for (let i = expensesFixtures.length - 1; i >= 0; i--) {
      if (expensesFixtures[i].missionId === id) expensesFixtures.splice(i, 1);
    }
    for (let i = guidesFixtures.length - 1; i >= 0; i--) {
      if (guidesFixtures[i].missionId === id) guidesFixtures.splice(i, 1);
    }
    for (let i = reportsFixtures.length - 1; i >= 0; i--) {
      if (reportsFixtures[i].missionId === id) reportsFixtures.splice(i, 1);
    }
    return new HttpResponse(null, { status: 204 });
  }),
];

export default missoesHandlers;
