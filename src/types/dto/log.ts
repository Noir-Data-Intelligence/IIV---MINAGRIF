/**
 * DTO de Log de Actividade — contrato exacto do JSON REST para o recurso `logs`.
 *
 * Espelha a tabela Supabase `activity_logs`, mas já com o utilizador autor
 * DENORMALIZADO no próprio registo (`userName`), à semelhança do que
 * `UserDto` faz para roles/departments: uma API REST real devolveria isto
 * resolvido num único pedido (via API Resource do Laravel, com eager-loading
 * da relação `user`), evitando o segundo pedido a `profiles` que a versão
 * Supabase original fazia em paralelo (ver `ProfileLite` / `profileMap` na
 * versão antiga da página).
 */
export type LogAction = "create" | "update" | "delete" | "login" | "logout" | "critical";

export interface LogDto {
  id: string;
  action: LogAction | string;
  entityType: string;
  entityId: string | null;
  /** Payload livre (diff de campos, metadata, etc.) — forma exacta definida pelo backend por acção. */
  details: Record<string, unknown> | null;
  createdAt: string;
  userId: string | null;
  /** Nome do utilizador autor da acção; `null` quando a acção é do sistema (ex.: jobs agendados). */
  userName: string | null;
  ipAddress: string | null;
}

/** Parâmetros de listagem paginada/filtrada de logs. */
export interface LogListParams {
  page?: number;
  perPage?: number;
  action?: string;
  entityType?: string;
  /** Data ISO (yyyy-MM-dd) — início do intervalo, inclusive. */
  dateFrom?: string;
  /** Data ISO (yyyy-MM-dd) — fim do intervalo, inclusive (o servidor estende até 23:59:59). */
  dateTo?: string;
}
