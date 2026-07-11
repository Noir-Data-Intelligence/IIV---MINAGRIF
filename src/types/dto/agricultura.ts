/**
 * DTOs do módulo Agricultura — contrato REST dos recursos `culturas` (Crop),
 * `campos` (Field/talhão) e `colheitas` (Harvest).
 *
 * Espelham as tabelas Supabase originais (`crops`, `crop_fields`, `harvests`)
 * já convertidas para camelCase, tal como o backend Laravel as devolverá via
 * API Resources (scientific_name -> scientificName, cycle_days -> cycleDays,
 * station_id -> stationId, area_ha -> areaHa, planting_date -> plantingDate,
 * expected_harvest -> expectedHarvest, harvest_date -> harvestDate,
 * quality_grade -> qualityGrade, etc). A (de)serialização, quando necessária,
 * faz-se na camada de serviço.
 *
 * Domínio coeso e fortemente relacionado: uma cultura (`CropDto`) é referida por
 * campos; um campo (`FieldDto`) é referido por colheitas; a estação é uma FK do
 * campo. Por isso agrupam-se num único ficheiro por camada.
 */

/** Estado do ciclo de vida de um talhão. */
export type FieldStatus = "planeado" | "plantado" | "em_crescimento" | "colhido" | "abandonado";

/** Cultura (espécie/variedade cultivada). */
export interface CropDto {
  id: string;
  name: string;
  scientificName: string | null;
  cycleDays: number | null;
  notes: string | null;
  createdAt: string;
}

/** Campo/talhão: uma cultura semeada numa estação, com área e calendário. */
export interface FieldDto {
  id: string;
  stationId: string;
  cropId: string;
  fieldCode: string | null;
  areaHa: number;
  plantingDate: string | null;
  expectedHarvest: string | null;
  status: FieldStatus;
  notes: string | null;
  createdAt: string;
}

/** Colheita registada num talhão. */
export interface HarvestDto {
  id: string;
  fieldId: string;
  harvestDate: string;
  quantity: number;
  unit: string;
  qualityGrade: string | null;
  notes: string | null;
  createdAt: string;
}

/** Parâmetros de listagem paginada/filtrada de culturas. */
export interface CropListParams {
  page?: number;
  perPage?: number;
  search?: string;
}

/** Parâmetros de listagem paginada/filtrada de campos. */
export interface FieldListParams {
  page?: number;
  perPage?: number;
  search?: string;
  stationId?: string;
  cropId?: string;
  status?: FieldStatus;
}

/** Parâmetros de listagem paginada/filtrada de colheitas. */
export interface HarvestListParams {
  page?: number;
  perPage?: number;
  search?: string;
  fieldId?: string;
}
