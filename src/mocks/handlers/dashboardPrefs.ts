import { http, HttpResponse } from "msw";
import {
  dashboardPrefsFixture,
  setDashboardPrefsFixture,
} from "@/mocks/fixtures/dashboardPrefs";
import type { DashboardPrefsDto, DashboardPrefsUpdatePayload } from "@/types/dto/dashboardPrefs";

/**
 * Handlers MSW do recurso singular "Preferências de Painel".
 * GET/PUT sobre `/dashboard-prefs/me`, operando sobre `dashboardPrefsFixture`
 * (registo único mutável). Mesmo padrão de `mocks/handlers/perfil.ts`.
 */
const BASE = "*/api/dashboard-prefs/me";

export const dashboardPrefsHandlers = [
  http.get(BASE, () => {
    return HttpResponse.json(dashboardPrefsFixture);
  }),

  http.put(BASE, async ({ request }) => {
    const payload = (await request.json().catch(() => ({}))) as DashboardPrefsUpdatePayload;
    const updated: DashboardPrefsDto = {
      ...dashboardPrefsFixture,
      ...payload,
      thresholds: payload.thresholds ?? dashboardPrefsFixture.thresholds,
      id: dashboardPrefsFixture.id,
      updatedAt: new Date().toISOString(),
    };
    setDashboardPrefsFixture(updated);
    return HttpResponse.json(updated);
  }),
];

export default dashboardPrefsHandlers;
