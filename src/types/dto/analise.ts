/**
 * DTO de Análise Laboratorial — contrato REST do recurso `analises`.
 *
 * Espelha a tabela Supabase `lab_analyses` em camelCase (laboratory_id -> laboratoryId,
 * client_name -> clientName, etc.). Depende de `laboratorios` via `laboratoryId`.
 *
 * `status` usa o enum de domínio `ANALYSIS_STATUS` (ver src/lib/domain-enums.ts).
 */
export type AnaliseStatus = "agendada" | "em_progresso" | "concluida" | "cancelada";

export interface AnaliseDto {
  id: string;
  laboratoryId: string;
  clientName: string;
  animalSpecies: string | null;
  animalId: string | null;
  sampleType: string;
  analysisType: string;
  scheduledDate: string;
  status: AnaliseStatus;
  notes: string | null;
  createdAt: string;
}

/** Parâmetros de listagem paginada/filtrada de análises. */
export interface AnaliseListParams {
  page?: number;
  perPage?: number;
  search?: string;
  /** Filtro opcional por laboratório. */
  laboratoryId?: string;
  /** Filtro opcional por estado. */
  status?: AnaliseStatus;
}
