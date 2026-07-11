/**
 * DTOs do módulo Inseminação Artificial — contrato do JSON REST.
 *
 * Agrupa as 5 entidades relacionadas do domínio num único módulo (`inseminacao`),
 * porque partilham a mesma página e formam um agregado coeso:
 *   - IACenterDto  (centros de inseminação)      -> tabela `ia_centers`
 *   - BreederDto   (reprodutores)                -> tabela `breeders`         (FK centerId)
 *   - TankDto      (tanques de azoto líquido)    -> tabela `nitrogen_tanks`   (FK centerId)
 *   - DoseDto      (doses de sémen)              -> tabela `semen_doses`      (FK breederId/tankId)
 *   - InsemDto     (registos de inseminação)     -> tabela `insemination_records` (FK animalId/doseId)
 *
 * Campos já em camelCase tal como o backend Laravel os devolverá. `animalId`
 * aponta para o módulo Animais (já migrado).
 */
export type BreederStatus = "activo" | "inactivo" | "baixado";
export type InseminationResult = "pendente" | "confirmada" | "falhou";
export type SemenQuality = "A" | "B" | "C";

export interface IACenterDto {
  id: string;
  name: string;
  location: string | null;
  responsibleUserId: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface BreederDto {
  id: string;
  centerId: string;
  tag: string;
  name: string | null;
  species: string;
  breed: string | null;
  birthDate: string | null;
  status: BreederStatus;
  notes: string | null;
  createdAt: string;
}

export interface TankDto {
  id: string;
  centerId: string;
  code: string;
  capacityL: number;
  currentLevelL: number;
  minLevelL: number;
  lastRefillDate: string | null;
  notes: string | null;
  createdAt: string;
}

export interface DoseDto {
  id: string;
  breederId: string;
  tankId: string | null;
  collectionDate: string;
  quantity: number;
  availableQuantity: number;
  qualityGrade: SemenQuality | null;
  notes: string | null;
  createdAt: string;
}

export interface InsemDto {
  id: string;
  animalId: string;
  doseId: string | null;
  technicianId: string | null;
  inseminationDate: string;
  result: InseminationResult;
  pregnancyConfirmedAt: string | null;
  expectedBirthDate: string | null;
  notes: string | null;
  createdAt: string;
}
