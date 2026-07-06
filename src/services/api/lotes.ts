import { apiDelete, apiGet, apiPost, apiPut } from "@/services/api/client";
import type { Paginated } from "@/types/dto/paginated";
import type { LoteDto, LoteListParams } from "@/types/dto/lote";

/**
 * Serviço de dados do módulo Lotes. Segue o padrão de `departamentos.ts`.
 *
 * NOTA de integração: rotas ainda não presentes em `endpoints.ts` (editado em
 * paralelo). Definidas localmente para manter o `tsc` limpo — ver reporte final.
 */
const LOTES_ROUTES = {
  list: "/lotes",
  detail: (id: string) => `/lotes/${id}`,
} as const;

function toQuery(params: LoteListParams): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {
    page: params.page ?? 1,
    per_page: params.perPage ?? 20,
  };
  if (params.search) query.search = params.search;
  if (params.productId) query.product_id = params.productId;
  return query;
}

export function listLotes(params: LoteListParams): Promise<Paginated<LoteDto>> {
  return apiGet<Paginated<LoteDto>>(LOTES_ROUTES.list, { params: toQuery(params) });
}

export function createLote(payload: Partial<LoteDto>): Promise<LoteDto> {
  return apiPost<LoteDto>(LOTES_ROUTES.list, payload);
}

export function updateLote(id: string, payload: Partial<LoteDto>): Promise<LoteDto> {
  return apiPut<LoteDto>(LOTES_ROUTES.detail(id), payload);
}

export function deleteLote(id: string): Promise<void> {
  return apiDelete<void>(LOTES_ROUTES.detail(id));
}
