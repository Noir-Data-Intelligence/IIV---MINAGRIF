/**
 * DTO de "silenciar alerta" — contrato REST do recurso `dashboard-alert-acks`.
 *
 * Espelha a tabela Supabase `dashboard_alert_acks` (snooze por métrica com
 * expiração). Registo simples por métrica para a sessão simulada actual: quando
 * um alerta é "marcado como visto" por N horas, guarda-se `acknowledgedUntil`;
 * o GET só devolve os acks ainda dentro da validade.
 */
export interface AlertAckDto {
  metricKey: string;
  acknowledgedUntil: string;
}

/** Payload de criação/upsert de um ack (snooze por `hours` a partir de agora). */
export interface CreateAlertAckPayload {
  metricKey: string;
  hours: number;
}
