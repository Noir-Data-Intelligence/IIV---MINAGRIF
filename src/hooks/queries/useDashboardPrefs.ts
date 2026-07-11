import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getDashboardPrefs, updateDashboardPrefs } from "@/services/api/dashboardPrefs";
import type { DashboardPrefsUpdatePayload } from "@/types/dto/dashboardPrefs";

/**
 * Hooks react-query do recurso singular "Preferências de Painel".
 * Uma única query key `dashboardPrefsKeys.me`; a mutation invalida-a para
 * reflectir de imediato o registo guardado (padrão de `usePerfil.ts`).
 */
export const dashboardPrefsKeys = {
  me: ["dashboardPrefs", "me"] as const,
};

export function useDashboardPrefsQuery() {
  return useQuery({
    queryKey: dashboardPrefsKeys.me,
    queryFn: () => getDashboardPrefs(),
  });
}

export function useUpdateDashboardPrefs() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: DashboardPrefsUpdatePayload) => updateDashboardPrefs(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dashboardPrefsKeys.me });
    },
  });
}
