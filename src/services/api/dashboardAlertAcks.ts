import { apiDelete, apiGet, apiPost } from "@/services/api/client";
import type { AlertAckDto, CreateAlertAckPayload } from "@/types/dto/dashboardAlertAck";

/**
 * Serviço de dados do recurso "silenciar alerta" (`dashboard-alert-acks`).
 *
 * Rotas locais (ver relatório para consolidação em `endpoints.ts`):
 *  - GET    /dashboard-alert-acks            -> acks ainda válidos
 *  - POST   /dashboard-alert-acks            -> upsert (snooze por `hours`)
 *  - DELETE /dashboard-alert-acks/:metricKey -> reactivar (remover ack)
 */
const ROUTES = {
  list: "/dashboard-alert-acks",
  detail: (metricKey: string) => `/dashboard-alert-acks/${metricKey}`,
};

export function listAlertAcks(): Promise<AlertAckDto[]> {
  return apiGet<AlertAckDto[]>(ROUTES.list);
}

export function createAlertAck(payload: CreateAlertAckPayload): Promise<AlertAckDto> {
  return apiPost<AlertAckDto>(ROUTES.list, payload);
}

export function deleteAlertAck(metricKey: string): Promise<void> {
  return apiDelete<void>(ROUTES.detail(metricKey));
}
