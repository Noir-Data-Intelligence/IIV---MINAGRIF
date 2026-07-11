import { apiGet, apiPut } from "@/services/api/client";
import type { DashboardPrefsDto, DashboardPrefsUpdatePayload } from "@/types/dto/dashboardPrefs";

/**
 * Serviço de dados do recurso singular "Preferências de Painel".
 *
 * Rotas locais `/dashboard-prefs/me` (GET/PUT), à semelhança de `perfil.ts` —
 * não faz parte do mapa central `endpoints.ts` (ver relatório para consolidação).
 */
const ROUTES = {
  me: "/dashboard-prefs/me",
};

export function getDashboardPrefs(): Promise<DashboardPrefsDto> {
  return apiGet<DashboardPrefsDto>(ROUTES.me);
}

export function updateDashboardPrefs(
  payload: DashboardPrefsUpdatePayload,
): Promise<DashboardPrefsDto> {
  return apiPut<DashboardPrefsDto>(ROUTES.me, payload);
}
