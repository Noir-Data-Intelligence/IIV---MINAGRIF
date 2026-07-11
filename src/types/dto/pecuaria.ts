/**
 * DTO do módulo Produção Pecuária — contrato REST do recurso `producao-pecuaria`.
 *
 * Espelha a tabela Supabase original (`livestock_production`) já convertida para
 * camelCase, tal como o backend Laravel a devolverá via API Resources
 * (station_id -> stationId, product_type -> productType, production_date ->
 * productionDate, recorded_by -> recordedBy). Módulo independente e de entidade
 * única.
 */

/** Tipo de produto registado numa produção pecuária. */
export type ProductType = "Leite" | "Ovos" | "Carne" | "Mel" | "Outro";

export const PRODUCT_TYPES: ProductType[] = ["Leite", "Ovos", "Carne", "Mel", "Outro"];

/** Registo de produção pecuária. */
export interface ProdDto {
  id: string;
  stationId: string;
  productType: ProductType;
  productionDate: string;
  quantity: number;
  unit: string;
  recordedBy: string | null;
  notes: string | null;
  createdAt: string;
}

/** Parâmetros de listagem paginada/filtrada de produções. */
export interface ProdListParams {
  page?: number;
  perPage?: number;
  search?: string;
  stationId?: string;
  productType?: ProductType;
}
