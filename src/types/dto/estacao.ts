/**
 * DTO de Estação — contrato do JSON REST para o recurso `estacoes`.
 *
 * Espelha a tabela Supabase `stations`, com os nomes de campo já em camelCase
 * tal como o backend Laravel os devolverá (via API Resources). A migração
 * Supabase -> Laravel troca `station_type`/`is_active`/`created_at` (snake_case)
 * por `stationType`/`isActive`/`createdAt`.
 */
export type StationType = "zootecnica" | "experimental" | "campo";

export interface EstacaoDto {
  id: string;
  name: string;
  stationType: StationType;
  location: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}

/** Parâmetros de listagem paginada/filtrada de estações. */
export interface EstacaoListParams {
  page?: number;
  perPage?: number;
  search?: string;
}
