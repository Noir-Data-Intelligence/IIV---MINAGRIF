import { apiDelete, apiGet, apiPost, apiPut } from "@/services/api/client";
import type { Paginated } from "@/types/dto/paginated";
import type { ProdutoDto, ProdutoListParams } from "@/types/dto/produto";

/**
 * Serviço de dados do módulo Produtos.
 *
 * Replica o ficheiro-padrão `departamentos.ts`: assenta nos helpers de
 * `client.ts` e nunca conhece o axios nem o MSW directamente.
 *
 * NOTA de integração: as rotas ainda NÃO estão em `src/services/api/endpoints.ts`
 * (esse ficheiro está a ser editado por outro processo em paralelo). Definimo-las
 * aqui como constante local `PRODUTOS_ROUTES` para manter o módulo autónomo e o
 * `tsc` limpo; quando a entrada `produtos` existir em `endpoints`, basta trocar
 * as referências abaixo.
 */
const PRODUTOS_ROUTES = {
  list: "/produtos",
  detail: (id: string) => `/produtos/${id}`,
  archive: (id: string) => `/produtos/${id}/archive`,
  restore: (id: string) => `/produtos/${id}/restore`,
} as const;

/** Converte `ProdutoListParams` em query params REST (snake_case p/ Laravel). */
function toQuery(params: ProdutoListParams): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {
    page: params.page ?? 1,
    per_page: params.perPage ?? 20,
  };
  if (params.search) query.search = params.search;
  if (params.archived !== undefined) query.archived = params.archived;
  return query;
}

export function listProdutos(params: ProdutoListParams): Promise<Paginated<ProdutoDto>> {
  return apiGet<Paginated<ProdutoDto>>(PRODUTOS_ROUTES.list, { params: toQuery(params) });
}

export function createProduto(payload: Partial<ProdutoDto>): Promise<ProdutoDto> {
  return apiPost<ProdutoDto>(PRODUTOS_ROUTES.list, payload);
}

export function updateProduto(id: string, payload: Partial<ProdutoDto>): Promise<ProdutoDto> {
  return apiPut<ProdutoDto>(PRODUTOS_ROUTES.detail(id), payload);
}

export function deleteProduto(id: string): Promise<void> {
  return apiDelete<void>(PRODUTOS_ROUTES.detail(id));
}

/** Arquiva um produto (isArchived -> true) sem o eliminar. */
export function archiveProduto(id: string): Promise<ProdutoDto> {
  return apiPost<ProdutoDto>(PRODUTOS_ROUTES.archive(id));
}

/** Restaura um produto arquivado (isArchived -> false). */
export function restoreProduto(id: string): Promise<ProdutoDto> {
  return apiPost<ProdutoDto>(PRODUTOS_ROUTES.restore(id));
}
