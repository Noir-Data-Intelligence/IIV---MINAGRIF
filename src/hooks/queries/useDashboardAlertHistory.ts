import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  clearAlertHistory,
  createAlertHistory,
  listAlertHistory,
  updateAlertHistory,
} from "@/services/api/dashboardAlertHistory";
import type {
  AlertHistoryListParams,
  CreateAlertHistoryPayload,
  UpdateAlertHistoryPayload,
} from "@/types/dto/dashboardAlertHistory";

/**
 * Hooks react-query do recurso Histórico de Alertas do Painel.
 * Query keys hierárquicas para invalidação selectiva; partilhado entre
 * Dashboard (create) e HistoricoAlertas (list/update/clear).
 */
export const alertHistoryKeys = {
  all: ["dashboardAlertHistory"] as const,
  lists: () => [...alertHistoryKeys.all, "list"] as const,
  list: (params: AlertHistoryListParams) => [...alertHistoryKeys.lists(), params] as const,
};

export function useAlertHistoryList(params: AlertHistoryListParams) {
  return useQuery({
    queryKey: alertHistoryKeys.list(params),
    queryFn: () => listAlertHistory(params),
  });
}

export function useCreateAlertHistory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAlertHistoryPayload) => createAlertHistory(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: alertHistoryKeys.lists() });
    },
  });
}

export function useUpdateAlertHistory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateAlertHistoryPayload }) =>
      updateAlertHistory(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: alertHistoryKeys.lists() });
    },
  });
}

export function useClearAlertHistory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => clearAlertHistory(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: alertHistoryKeys.lists() });
    },
  });
}
