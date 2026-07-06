import { apiDelete, apiGet, apiPost, apiPut } from "@/services/api/client";
import { endpoints } from "@/services/api/endpoints";
import type { Paginated } from "@/types/dto/paginated";
import type { NoticiaDto, NoticiaListParams } from "@/types/dto/noticia";

/**
 * Serviço de dados do módulo Notícias.
 *
 * Este é o ficheiro-padrão que ~40 outros módulos vão replicar: assenta nos
 * helpers de `client.ts` e nas rotas de `endpoints.ts`, e nunca conhece o
 * axios nem o MSW directamente. Os componentes/hooks só falam com estas funções.
 */

/** Converte `NoticiaListParams` em query params REST (snake_case p/ Laravel). */
function toQuery(params: NoticiaListParams): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {
    page: params.page,
    per_page: params.perPage,
  };
  if (params.search) query.search = params.search;
  if (params.categoria) query.categoria = params.categoria;
  if (typeof params.published === "boolean") query.published = params.published;
  return query;
}

export function listNoticias(params: NoticiaListParams): Promise<Paginated<NoticiaDto>> {
  return apiGet<Paginated<NoticiaDto>>(endpoints.noticias.list, {
    params: toQuery(params),
  });
}

export function getNoticia(id: string): Promise<NoticiaDto> {
  return apiGet<NoticiaDto>(endpoints.noticias.detail(id));
}

export function createNoticia(payload: Partial<NoticiaDto>): Promise<NoticiaDto> {
  return apiPost<NoticiaDto>(endpoints.noticias.list, payload);
}

export function updateNoticia(id: string, payload: Partial<NoticiaDto>): Promise<NoticiaDto> {
  return apiPut<NoticiaDto>(endpoints.noticias.detail(id), payload);
}

export function deleteNoticia(id: string): Promise<void> {
  return apiDelete<void>(endpoints.noticias.detail(id));
}
