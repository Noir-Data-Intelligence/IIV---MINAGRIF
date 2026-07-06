import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  clearAllNotifications,
  deleteNotification,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/services/api/notifications";

/**
 * Hooks react-query do módulo Notificações.
 *
 * Substitui a query Supabase + subscrição Realtime da página
 * `Notificacoes.tsx` por polling: `refetchInterval` de 15s mantém a lista
 * "ao vivo" sem WebSocket, tal como `usePublicStats.ts` fez na Fase 1.
 *
 * `notificationKeys.all` serve de queryKey única (sem params — a lista é
 * sempre completa) e é invalidada por todas as mutations no `onSuccess`.
 */

export const notificationKeys = {
  all: ["notifications"] as const,
};

export function useNotificationsList() {
  return useQuery({
    queryKey: notificationKeys.all,
    queryFn: () => listNotifications(),
    refetchInterval: 15000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useClearAllNotifications() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => clearAllNotifications(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
