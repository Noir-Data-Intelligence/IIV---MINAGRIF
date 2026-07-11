import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createAlertAck, deleteAlertAck, listAlertAcks } from "@/services/api/dashboardAlertAcks";
import type { CreateAlertAckPayload } from "@/types/dto/dashboardAlertAck";

/**
 * Hooks react-query do recurso "silenciar alerta" (`dashboard-alert-acks`).
 * Uma query key única (`all`) — a lista é sempre completa (acks válidos). As
 * mutations de snooze/reactivar invalidam-na.
 */
export const alertAcksKeys = {
  all: ["dashboardAlertAcks"] as const,
};

export function useAlertAcksList() {
  return useQuery({
    queryKey: alertAcksKeys.all,
    queryFn: () => listAlertAcks(),
  });
}

export function useCreateAlertAck() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAlertAckPayload) => createAlertAck(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: alertAcksKeys.all });
    },
  });
}

export function useDeleteAlertAck() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (metricKey: string) => deleteAlertAck(metricKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: alertAcksKeys.all });
    },
  });
}
