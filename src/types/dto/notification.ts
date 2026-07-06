/**
 * DTO de Notificação — contrato exacto do JSON REST para o recurso `notifications`.
 *
 * Espelha a tabela Supabase `notifications` (usada pela página `Notificacoes.tsx`
 * e pelo dropdown `NotificationCenter.tsx`), em camelCase tal como o backend
 * Laravel os devolverá (via API Resources). `created_at` -> `createdAt`.
 */
export type NotificationType = "info" | "sucesso" | "aviso" | "erro";

export interface NotificationDto {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  link: string | null;
  read: boolean;
  createdAt: string;
}
