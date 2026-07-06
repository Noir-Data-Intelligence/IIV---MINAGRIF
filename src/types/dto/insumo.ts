/**
 * DTO de Insumo/Reagente laboratorial — contrato REST do recurso `insumos`.
 *
 * Espelha a tabela Supabase `lab_supplies` em camelCase (laboratory_id -> laboratoryId,
 * min_stock -> minStock, expiry_date -> expiryDate). Depende de `laboratorios` via
 * `laboratoryId`.
 */
export interface InsumoDto {
  id: string;
  laboratoryId: string;
  name: string;
  quantity: number;
  unit: string;
  minStock: number;
  expiryDate: string | null;
}

/** Parâmetros de listagem paginada/filtrada de insumos. */
export interface InsumoListParams {
  page?: number;
  perPage?: number;
  search?: string;
  /** Filtro opcional por laboratório. */
  laboratoryId?: string;
}
