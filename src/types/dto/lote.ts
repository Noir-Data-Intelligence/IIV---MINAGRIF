/**
 * DTO de Lote de Produção — contrato REST para o recurso `lotes`.
 *
 * Espelha a tabela Supabase `production_batches`, em camelCase (backend Laravel
 * via API Resources). `productId` referencia um `ProdutoDto` (dependência do
 * módulo Produtos). A migração troca `batch_number`/`product_id`/
 * `quantity_produced`/`quantity_distributed`/`production_date`/`expiry_date`/
 * `created_at` (snake_case) pelos equivalentes camelCase.
 */
export type LoteStatus = "planeada" | "em_producao" | "concluida" | "suspensa";

export interface LoteDto {
  id: string;
  batchNumber: string;
  productId: string;
  quantityProduced: number;
  quantityDistributed: number;
  productionDate: string;
  expiryDate: string;
  status: LoteStatus;
  notes: string | null;
  createdAt: string;
}

/** Parâmetros de listagem paginada/filtrada de lotes. */
export interface LoteListParams {
  page?: number;
  perPage?: number;
  search?: string;
  /** Filtro opcional por produto. */
  productId?: string;
}
