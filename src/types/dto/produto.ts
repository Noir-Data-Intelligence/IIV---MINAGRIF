/**
 * DTO de Produto — contrato exacto do JSON REST para o recurso `produtos`.
 *
 * Espelha o catálogo de vacinas/soros/reagentes veterinários do IIV (tabela
 * Supabase `products`), com os nomes de campo já em camelCase tal como o backend
 * Laravel os devolverá (via API Resources). A noção de "arquivado" (tabs
 * Activo/Arquivado da página) é preservada em `isArchived` — a migração
 * Supabase -> Laravel troca `is_active` (boolean invertido) por `isArchived`.
 */
export type ProdutoType = "vacina" | "soro" | "reagente";

export interface ProdutoDto {
  id: string;
  name: string;
  productType: ProdutoType;
  description: string | null;
  unit: string;
  isArchived: boolean;
  createdAt: string;
}

/** Parâmetros de listagem paginada/filtrada de produtos. */
export interface ProdutoListParams {
  page?: number;
  perPage?: number;
  search?: string;
  /**
   * Filtro por estado de arquivo:
   *  - `false` -> só produtos activos (tab "Activos");
   *  - `true`  -> só produtos arquivados (tab "Arquivados");
   *  - omitido -> todos (usado para agregar KPIs).
   */
  archived?: boolean;
}
