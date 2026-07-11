import { apiGet } from "@/services/api/client";
import type { Paginated } from "@/types/dto/paginated";
import type { LogDto, LogListParams } from "@/types/dto/log";

/**
 * Serviço de dados do módulo Logs de Actividade.
 *
 * Replica o padrão de `departamentos.ts`, mas só-leitura (visualizador de
 * auditoria: sem create/update/delete). Como `src/services/api/endpoints.ts`
 * está a ser editado em paralelo por outro processo, este módulo declara as
 * suas próprias rotas relativas em `ROUTES` — quando o mapa central for
 * actualizado, isto pode passar a `endpoints.logs.list` sem mais alterações.
 */
const ROUTES = {
  list: "/logs",
} as const;

/** Converte `LogListParams` em query params REST (snake_case p/ Laravel). */
function toQuery(params: LogListParams): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {
    page: params.page ?? 1,
    per_page: params.perPage ?? 20,
  };
  if (params.action) query.action = params.action;
  if (params.entityType) query.entity_type = params.entityType;
  if (params.dateFrom) query.date_from = params.dateFrom;
  if (params.dateTo) query.date_to = params.dateTo;
  return query;
}

export function listLogs(params: LogListParams): Promise<Paginated<LogDto>> {
  return apiGet<Paginated<LogDto>>(ROUTES.list, { params: toQuery(params) });
}
