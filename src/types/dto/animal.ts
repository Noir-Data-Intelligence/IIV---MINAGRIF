/**
 * DTOs do módulo Animais — contrato do JSON REST para o recurso `animais` e as
 * suas sub-entidades (eventos e registos sanitários).
 *
 * Espelham as tabelas Supabase `animals`, `animal_events` e
 * `animal_health_records`, com os campos já em camelCase tal como o backend
 * Laravel os devolverá. FK `stationId` aponta para o módulo Estações.
 */
export type AnimalSex = "macho" | "femea";
export type AnimalStatus = "activo" | "vendido" | "morto" | "abatido" | "transferido";

export interface AnimalDto {
  id: string;
  stationId: string;
  tag: string;
  name: string | null;
  species: string;
  breed: string | null;
  sex: AnimalSex;
  birthDate: string | null;
  motherTag: string | null;
  fatherTag: string | null;
  status: AnimalStatus;
  currentWeightKg: number | null;
  notes: string | null;
  createdAt: string;
}

/** Evento do historial do animal (nascimento, pesagem, transferência, etc). */
export interface AnimalEventDto {
  id: string;
  animalId: string;
  eventType: string;
  eventDate: string;
  notes: string | null;
  createdAt: string;
}

/** Registo sanitário/veterinário do animal (vacina, tratamento, diagnóstico). */
export interface HealthRecordDto {
  id: string;
  animalId: string;
  recordType: string;
  productName: string | null;
  dosage: string | null;
  diagnosis: string | null;
  treatment: string | null;
  veterinarian: string | null;
  recordDate: string;
  nextDueDate: string | null;
  createdAt: string;
}

/** Parâmetros de listagem paginada/filtrada de animais. */
export interface AnimalListParams {
  page?: number;
  perPage?: number;
  search?: string;
  stationId?: string;
  status?: AnimalStatus;
  species?: string;
}
