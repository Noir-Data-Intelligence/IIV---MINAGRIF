/**
 * DTO de Plano de Produção — contrato REST para o recurso `planeamento`.
 *
 * Espelha a tabela Supabase `production_plans`, em camelCase. `productId`
 * referencia um `ProdutoDto` (dependência do módulo Produtos). Partilha o mesmo
 * conjunto de estados dos lotes.
 */
export type PlanoStatus = "planeada" | "em_producao" | "concluida" | "suspensa";

export interface PlanoDto {
  id: string;
  productId: string;
  plannedQuantity: number;
  actualQuantity: number | null;
  plannedStart: string;
  plannedEnd: string;
  status: PlanoStatus;
  notes: string | null;
}

/** Parâmetros de listagem paginada/filtrada de planos. */
export interface PlanoListParams {
  page?: number;
  perPage?: number;
  search?: string;
  /** Filtro opcional por produto. */
  productId?: string;
  /** Filtro opcional por estado (ANL-002 — auditoria funcional). */
  status?: PlanoStatus;
}
