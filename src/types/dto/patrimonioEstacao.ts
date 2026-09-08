/**
 * DTOs do Património de Estação — esquema separado do Património Central
 * (dualidade obrigatória, ver SIG-IIV-MEMORIA-PROJETO.md secção 6). Espelha
 * `App\Http\Resources\PatrimonioEstacaoResource`/`PatrimonioEstacaoManutencaoResource`
 * do backend real (`/patrimonio-estacao`, `/patrimonio-estacao/manutencoes`).
 *
 * Única diferença estrutural face ao Património Central: `stationId` é
 * obrigatório aqui (cada activo pertence sempre a uma estação zootécnica).
 */

export type AssetStatus = "activo" | "em_manutencao" | "avariado" | "abatido" | "reservado";

export type AssetCategory =
  | "equipamento_laboratorio" | "viatura" | "energia" | "refrigeracao"
  | "informatica" | "mobiliario" | "outros";

export type MaintenanceType = "preventiva" | "correctiva" | "inspeccao" | "calibracao";

export interface AssetEstacaoDto {
  id: string;
  code: string;
  name: string;
  category: AssetCategory;
  /**
   * Obrigatória em Estação (ao contrário de Património Central) — auditoria
   * funcional 01/09/2026, secção 21.
   */
  description: string;
  location: string | null;
  stationId: string;
  departmentId: string | null;
  responsibleUserId: string | null;
  acquisitionDate: string | null;
  acquisitionCost: number;
  currentValue: number | null;
  serialNumber: string | null;
  status: AssetStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceEstacaoDto {
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

export interface AssetEstacaoListParams {
  page?: number;
  perPage?: number;
  search?: string;
  status?: string;
  category?: string;
}

export interface MaintenanceEstacaoListParams {
  page?: number;
  perPage?: number;
  search?: string;
  assetId?: string;
  type?: string;
}
