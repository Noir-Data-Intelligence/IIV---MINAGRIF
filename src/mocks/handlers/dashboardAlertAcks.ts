import { http, HttpResponse } from "msw";
import { dashboardAlertAcksFixtures } from "@/mocks/fixtures/dashboardAlertAcks";
import type { AlertAckDto, CreateAlertAckPayload } from "@/types/dto/dashboardAlertAck";

/**
 * Handlers MSW do recurso "silenciar alerta" (`dashboard-alert-acks`).
 * Operam sobre `dashboardAlertAcksFixtures` (array mutável). O GET só devolve os
 * acks ainda dentro da validade; o POST faz upsert por métrica calculando
 * `acknowledgedUntil` a partir de `hours`.
 */
const BASE = "*/api/dashboard-alert-acks";

export const dashboardAlertAcksHandlers = [
  // GET -> acks válidos (não expirados)
  http.get(BASE, () => {
    const now = Date.now();
    const valid = dashboardAlertAcksFixtures.filter(
      (a) => new Date(a.acknowledgedUntil).getTime() > now,
    );
    return HttpResponse.json(valid);
  }),

  // POST -> upsert (snooze por `hours`)
  http.post(BASE, async ({ request }) => {
    const payload = (await request.json().catch(() => ({}))) as CreateAlertAckPayload;
    const hours = Number(payload.hours) || 1;
    const ack: AlertAckDto = {
      metricKey: payload.metricKey,
      acknowledgedUntil: new Date(Date.now() + hours * 3600 * 1000).toISOString(),
    };
    const index = dashboardAlertAcksFixtures.findIndex((a) => a.metricKey === ack.metricKey);
    if (index === -1) dashboardAlertAcksFixtures.push(ack);
    else dashboardAlertAcksFixtures[index] = ack;
    return HttpResponse.json(ack, { status: 201 });
  }),

  // DELETE /:metricKey -> reactivar (remover ack)
  http.delete(`${BASE}/:metricKey`, ({ params }) => {
    const { metricKey } = params as { metricKey: string };
    const index = dashboardAlertAcksFixtures.findIndex((a) => a.metricKey === metricKey);
    if (index !== -1) dashboardAlertAcksFixtures.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];

export default dashboardAlertAcksHandlers;
