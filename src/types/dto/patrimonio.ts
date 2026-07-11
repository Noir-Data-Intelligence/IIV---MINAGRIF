/**
 * DTOs do módulo de Património — contrato REST dos recursos `activos` (assets) e
 * `manutencoes` (asset maintenance).
 *
 * Espelham as tabelas Supabase originais (`assets`, `asset_maintenance`) já
 * convertidas para camelCase, tal como o backend Laravel as devolverá via API
 * Resources (acquisition_cost -> acquisitionCost, station_id -> stationId, etc.).
 * A (de)serialização, quando necessária, faz-se na camada de serviço.
 *
 * Valores monetários em Kwanzas Angolanos (AOA).
 */

/** Estado de um activo/bem patrimonial. */
export type AssetStatus =
  | "activo"
  | "em_manutencao"
  | "avariado"
  | "abatido"
  | "reservado";

/** Categoria de um activo (taxonomia fixa para filtragem consistente). */
export type AssetCategory =
  | "equipamento_laboratorio"
  | "viatura"
  | "energia"
  | "refrigeracao"
  | "informatica"
  | "mobiliario"
  | "outros";

/** Tipo de intervenção de manutenção. */
export type MaintenanceType = "preventiva" | "correctiva" | "inspeccao" | "calibracao";

/** Activo/bem patrimonial (inventário do instituto). */
export interface AssetDto {
  id: string;
  code: string;
  name: string;
  category: AssetCategory;
  description: string | null;
  location: string | null;
  stationId: string | null;
  departmentId: string | null;
  /** Nome do utilizador/técnico responsável pelo bem (texto livre no mock). */
  responsibleUser: string | null;
  acquisitionDate: string | null;
  acquisitionCost: number;
  currentValue: number | null;
  serialNumber: string | null;
  status: AssetStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Registo de manutenção associado a um activo. */
export interface MaintenanceDto {
  id: string;
  assetId: string;
  date: string;
  type: MaintenanceType;
  description: string;
  cost: number;
  provider: string | null;
  nextDueDate: string | null;
  notes: string | null;
  createdAt: string;
}

/** Parâmetros de listagem paginada/filtrada de activos. */
export interface AssetListParams {
  page?: number;
  perPage?: number;
  search?: string;
  status?: string;
  category?: string;
}

/** Parâmetros de listagem paginada/filtrada de manutenções. */
export interface MaintenanceListParams {
  page?: number;
  perPage?: number;
  search?: string;
  assetId?: string;
  type?: string;
}
