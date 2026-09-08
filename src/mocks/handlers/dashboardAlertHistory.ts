import { http, HttpResponse } from "msw";
import {
  dashboardAlertHistoryFixtures,
  ME_USER_ID,
} from "@/mocks/fixtures/dashboardAlertHistory";
import { usersFixtures } from "@/mocks/fixtures/users";
import { departamentosFixtures } from "@/mocks/fixtures/departamentos";
import type {
  AlertHistoryDto,
  CreateAlertHistoryPayload,
  UpdateAlertHistoryPayload,
} from "@/types/dto/dashboardAlertHistory";
import type { Paginated } from "@/types/dto/paginated";

/**
 * Handlers MSW do recurso Histórico de Alertas do Painel.
 *
 * Operam sobre `dashboardAlertHistoryFixtures` (array mutável em memória).
 * Como uma API Resource do Laravel faria um join, o handler resolve
 * `assignedToName`/`assignedDepartmentName` a partir das fixtures de users/
 * departamentos e trata as regras de negócio de `assignedAt`/`resolvedAt`.
 *
 * O POST replica o debounce da versão Supabase: só cria uma nova linha se não
 * existir já um registo da mesma métrica na última hora (devolve 200 + null
 * quando ignora, para o cliente não tratar como erro).
 */
const BASE = "*/api/dashboard-alert-history";

function assigneeName(id: string | null): string | null {
  if (!id) return null;
  return usersFixtures.find((u) => u.id === id)?.fullName ?? null;
}

function departmentName(id: string | null): string | null {
  if (!id) return null;
  return departamentosFixtures.find((d) => d.id === id)?.name ?? null;
}

/** Devolve uma cópia com os nomes resolvidos (join simulado). */
function resolve(row: AlertHistoryDto): AlertHistoryDto {
  return {
    ...row,
    assignedToName: assigneeName(row.assignedTo),
    assignedDepartmentName: departmentName(row.assignedDepartmentId),
  };
}

export const dashboardAlertHistoryHandlers = [
  // GET /api/dashboard-alert-history -> lista paginada + filtrada
  http.get(BASE, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1") || 1;
    const perPage = Number(url.searchParams.get("per_page") ?? "20") || 20;
    const metricKey = (url.searchParams.get("metric_key") ?? "").trim();
    const actionStatus = (url.searchParams.get("action_status") ?? "").trim();
    const from = (url.searchParams.get("from") ?? "").trim();
    const to = (url.searchParams.get("to") ?? "").trim();

    let rows = [...dashboardAlertHistoryFixtures].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );

    if (metricKey) rows = rows.filter((r) => r.metricKey === metricKey);
    if (actionStatus) rows = rows.filter((r) => r.actionStatus === actionStatus);
    if (from) {
      const fromIso = new Date(from).toISOString();
      rows = rows.filter((r) => r.createdAt >= fromIso);
    }
    if (to) {
      const t = new Date(to);
      t.setHours(23, 59, 59, 999);
      const toIso = t.toISOString();
      rows = rows.filter((r) => r.createdAt <= toIso);
    }

    const total = rows.length;
    const lastPage = Math.max(1, Math.ceil(total / perPage));
    const start = (page - 1) * perPage;
    const data = rows.slice(start, start + perPage).map(resolve);

    const body: Paginated<AlertHistoryDto> = {
      data,
      meta: { currentPage: page, perPage, total, lastPage },
    };
    return HttpResponse.json(body);
  }),

  // POST /api/dashboard-alert-history -> cria com debounce de 1h por métrica
  http.post(BASE, async ({ request }) => {
    const payload = (await request.json().catch(() => ({}))) as CreateAlertHistoryPayload;
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const recent = dashboardAlertHistoryFixtures.some(
      (r) =>
        r.userId === ME_USER_ID &&
        r.metricKey === payload.metricKey &&
        r.createdAt >= hourAgo,
    );
    if (recent) {
      // Debounce: já foi registado há menos de 1 hora — ignora silenciosamente.
      return HttpResponse.json(null, { status: 200 });
    }
    const created: AlertHistoryDto = {
      id: `alh-${Date.now()}`,
      metricKey: payload.metricKey,
      label: payload.label ?? payload.metricKey,
      value: payload.value ?? 0,
      threshold: payload.threshold ?? 0,
      tone: payload.tone ?? "warning",
      entityType: null,
      entityId: null,
      origem: "browser",
      createdAt: new Date().toISOString(),
      userId: ME_USER_ID,
      assignedTo: null,
      assignedDepartmentId: null,
      actionStatus: "pendente",
      actionNotes: null,
      assignedAt: null,
      resolvedAt: null,
      assignedToName: null,
      assignedDepartmentName: null,
    };
    dashboardAlertHistoryFixtures.unshift(created);
    return HttpResponse.json(resolve(created), { status: 201 });
  }),

  // PUT /api/dashboard-alert-history/:id -> atribuição/resolução
  http.put(`${BASE}/:id`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const index = dashboardAlertHistoryFixtures.findIndex((r) => r.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Registo não encontrado." }, { status: 404 });
    }
    const existing = dashboardAlertHistoryFixtures[index];
    const payload = (await request.json().catch(() => ({}))) as UpdateAlertHistoryPayload;

    const assignedTo =
      payload.assignedTo !== undefined ? payload.assignedTo : existing.assignedTo;
    const assignedDepartmentId =
      payload.assignedDepartmentId !== undefined
        ? payload.assignedDepartmentId
        : existing.assignedDepartmentId;
    const actionStatus = payload.actionStatus ?? existing.actionStatus;
    const actionNotes =
      payload.actionNotes !== undefined ? payload.actionNotes : existing.actionNotes;

    // Regra: primeira atribuição grava `assignedAt`.
    let assignedAt = existing.assignedAt;
    if (assignedTo && !existing.assignedAt) assignedAt = new Date().toISOString();

    // Regra: ao resolver grava `resolvedAt`; ao reabrir limpa-o.
    let resolvedAt = existing.resolvedAt;
    if (actionStatus === "resolvido" && !existing.resolvedAt) {
      resolvedAt = new Date().toISOString();
    } else if (actionStatus !== "resolvido") {
      resolvedAt = null;
    }

    const updated: AlertHistoryDto = {
      ...existing,
      assignedTo,
      assignedDepartmentId,
      actionStatus,
      actionNotes,
      assignedAt,
      resolvedAt,
    };
    dashboardAlertHistoryFixtures[index] = updated;
    return HttpResponse.json(resolve(updated));
  }),

  // DELETE /api/dashboard-alert-history -> limpa todo o histórico da sessão
  http.delete(BASE, () => {
    const mine = dashboardAlertHistoryFixtures.filter((r) => r.userId === ME_USER_ID);
    mine.forEach((row) => {
      const i = dashboardAlertHistoryFixtures.indexOf(row);
      if (i !== -1) dashboardAlertHistoryFixtures.splice(i, 1);
    });
    return new HttpResponse(null, { status: 204 });
  }),
];

export default dashboardAlertHistoryHandlers;
