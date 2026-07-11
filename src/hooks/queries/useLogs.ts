import { useQuery } from "@tanstack/react-query";
import { listLogs } from "@/services/api/logs";
import type { LogListParams } from "@/types/dto/log";

/**
 * Hook react-query do módulo Logs de Actividade.
 *
 * Replica o padrão de `useDepartamentos.ts`, mas só com a query de listagem —
 * página de auditoria, sem mutations.
 */
export const logKeys = {
  all: ["logs"] as const,
  lists: () => [...logKeys.all, "list"] as const,
  list: (params: LogListParams) => [...logKeys.lists(), params] as const,
};

export function useLogsList(params: LogListParams) {
  return useQuery({
    queryKey: logKeys.list(params),
    queryFn: () => listLogs(params),
  });
}
