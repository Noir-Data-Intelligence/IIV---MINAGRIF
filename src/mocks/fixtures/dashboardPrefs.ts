import type { DashboardPrefsDto } from "@/types/dto/dashboardPrefs";

/**
 * Registo ÚNICO e MUTÁVEL das preferências de painel da sessão actual
 * (à semelhança de `perfilFixture`). `kpis`/`charts` vazios significam
 * "usar as predefinições do papel" — a página aplica `arr.length ? arr : role`.
 * `thresholds` arranca com os limiares por omissão do Dashboard.
 */
export let dashboardPrefsFixture: DashboardPrefsDto = {
  id: "dashboard-prefs-me",
  kpis: [],
  charts: [],
  thresholds: {
    lowStock: 1,
    expiringSoon: 1,
    ncOpen: 1,
    analysesPending: 20,
  },
  updatedAt: "2024-01-10T09:00:00.000Z",
};

/** Substitui o registo em memória (usado pelo handler PUT). */
export function setDashboardPrefsFixture(next: DashboardPrefsDto) {
  dashboardPrefsFixture = next;
}
