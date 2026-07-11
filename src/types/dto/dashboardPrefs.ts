/**
 * DTO de Preferências de Painel — contrato REST do recurso singular
 * `dashboard-prefs` (rota `/dashboard-prefs/me`).
 *
 * Espelha a tabela Supabase `user_dashboard_prefs` (kpis/charts/thresholds),
 * mas — tal como o recurso `perfil` — é um registo ÚNICO por sessão simulada,
 * independente da conta demo autenticada via Supabase Auth (não há forma de
 * cruzar o UUID real da sessão com IDs fictícios). Ver nota em
 * `types/dto/perfil.ts`.
 *
 * `kpis`/`charts` vazios significam "usar as predefinições do papel" — a página
 * aplica a mesma regra `arr.length ? arr : roleDefaults` da versão Supabase.
 */
export interface DashboardPrefsDto {
  id: string;
  kpis: string[];
  charts: string[];
  thresholds: Record<string, number>;
  updatedAt: string;
}

/** Payload de actualização (PUT parcial). */
export interface DashboardPrefsUpdatePayload {
  kpis?: string[];
  charts?: string[];
  thresholds?: Record<string, number>;
}
