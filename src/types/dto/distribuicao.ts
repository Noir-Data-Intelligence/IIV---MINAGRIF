/**
 * DTO de Distribuição — contrato REST para o recurso `distribuicao`.
 *
 * Espelha a tabela Supabase `batch_distributions`, em camelCase. `batchId`
 * referencia um `LoteDto` (dependência do módulo Lotes, que por sua vez depende
 * de Produtos). A migração troca `distribution_date`/`batch_id` (snake_case)
 * pelos equivalentes camelCase.
 */
export interface DistribuicaoDto {
  id: string;
  destination: string;
  quantity: number;
  distributionDate: string;
  notes: string | null;
  batchId: string;
}

/** Parâmetros de listagem paginada/filtrada de distribuições. */
export interface DistribuicaoListParams {
  page?: number;
  perPage?: number;
  search?: string;
  /** Filtro opcional por lote. */
  batchId?: string;
}
