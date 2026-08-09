/**
 * DTOs do Património Central (DG/Laboratório) — esquema separado do
 * Património de Estação (dualidade obrigatória, ver
 * SIG-IIV-MEMORIA-PROJETO.md secção 6). Espelha
 * `App\Http\Resources\PatrimonioCentralResource`/`PatrimonioCentralManutencaoResource`
 * do backend real (`/patrimonio-central`, `/patrimonio-central/manutencoes`).
 *
 * Divergência deliberada do contrato anterior (`AssetDto`/`/activos`, único):
 * este recurso NUNCA tem `stationId` — um activo de estação vive em
 * `patrimonioEstacao.ts`, nunca aqui.
 */

export type AssetStatus = "activo" | "em_manutencao" | "avariado" | "abatido" | "reservado";

export type AssetCategory =
  | "equipamento_laboratorio" | "viatura" | "energia" | "refrigeracao"
  | "informatica" | "mobiliario" | "outros";

export type MaintenanceType = "preventiva" | "correctiva" | "inspeccao" | "calibracao";

export interface AssetCentralDto {
  id: string;
  code: string;
  name: string;
  category: AssetCategory;
  description: string | null;
  location: string | null;
  departmentId: string | null;
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

export interface MaintenanceCentralDto {
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

export interface AssetCentralListParams {
  page?: number;
  perPage?: number;
  search?: string;
  status?: string;
  category?: string;
}

export interface MaintenanceCentralListParams {
  page?: number;
  perPage?: number;
  search?: string;
  assetId?: string;
  type?: string;
}
