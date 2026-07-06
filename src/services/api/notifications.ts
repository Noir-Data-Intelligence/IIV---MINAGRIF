import { apiDelete, apiGet, apiPatch, apiPost } from "@/services/api/client";
import { endpoints } from "@/services/api/endpoints";
import type { NotificationDto } from "@/types/dto/notification";

/**
 * Serviço de dados do módulo Notificações.
 *
 * Segue o mesmo padrão de `services/api/departamentos.ts`: assenta nos
 * helpers de `client.ts` e nas rotas de `endpoints.ts`. Sem paginação
 * server-side — devolve a lista completa e a página (`Notificacoes.tsx`)
 * pagina client-side com `useClientPagination`, tal como fazia antes da
 * migração.
 */

export function listNotifications(): Promise<NotificationDto[]> {
  return apiGet<NotificationDto[]>(endpoints.notifications.list);
}

export function markNotificationRead(id: string): Promise<NotificationDto> {
  return apiPatch<NotificationDto>(endpoints.notifications.detail(id), { read: true });
}

export function markAllNotificationsRead(): Promise<void> {
  return apiPost<void>(endpoints.notifications.markAllRead);
}

export function deleteNotification(id: string): Promise<void> {
  return apiDelete<void>(endpoints.notifications.detail(id));
}

export function clearAllNotifications(): Promise<void> {
  return apiDelete<void>(endpoints.notifications.list);
}
