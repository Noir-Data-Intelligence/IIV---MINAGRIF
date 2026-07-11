import { apiDelete, apiGet, apiPost, apiPut } from "@/services/api/client";
import type { Paginated } from "@/types/dto/paginated";
import type {
  AlertHistoryDto,
  AlertHistoryListParams,
  CreateAlertHistoryPayload,
  UpdateAlertHistoryPayload,
} from "@/types/dto/dashboardAlertHistory";

/**
 * Serviço de dados do recurso Histórico de Alertas do Painel.
 *
 * Recurso partilhado por `Dashboard.tsx` (create no disparo) e
 * `HistoricoAlertas.tsx` (list/update/clear). Assenta nos helpers de `client.ts`
 * e nunca conhece o axios nem o MSW directamente.
 *
 * NOTA: rotas declaradas localmente (`ROUTES`) — a entrada
 * `dashboardAlertHistory` deve ser consolidada em `endpoints.ts` (ver relatório).
 */
const ROUTES = {
  list: "/dashboard-alert-history",
  detail: (id: string) => `/dashboard-alert-history/${id}`,
};

function toQuery(params: AlertHistoryListParams): Record<string, string | number> {
  const query: Record<string, string | number> = {
    page: params.page ?? 1,
    per_page: params.perPage ?? 20,
  };
  if (params.metricKey) query.metric_key = params.metricKey;
  if (params.actionStatus) query.action_status = params.actionStatus;
  if (params.from) query.from = params.from;
  if (params.to) query.to = params.to;
  return query;
}

export function listAlertHistory(
  params: AlertHistoryListParams,
): Promise<Paginated<AlertHistoryDto>> {
  return apiGet<Paginated<AlertHistoryDto>>(ROUTES.list, { params: toQuery(params) });
}

export function createAlertHistory(
  payload: CreateAlertHistoryPayload,
): Promise<AlertHistoryDto | null> {
  return apiPost<AlertHistoryDto | null>(ROUTES.list, payload);
}

export function updateAlertHistory(
  id: string,
  payload: UpdateAlertHistoryPayload,
): Promise<AlertHistoryDto> {
  return apiPut<AlertHistoryDto>(ROUTES.detail(id), payload);
}

/** Limpa todo o histórico da sessão actual (DELETE sobre a colecção). */
export function clearAlertHistory(): Promise<void> {
  return apiDelete<void>(ROUTES.list);
}
