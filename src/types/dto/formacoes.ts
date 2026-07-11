/**
 * DTOs do módulo Formações — contrato REST do recurso `formacoes` (acções de
 * formação, capacitação e workshops do instituto).
 *
 * Espelha a tabela Supabase original (`trainings`) já convertida para camelCase,
 * tal como o backend Laravel a devolverá via API Resources (start_date ->
 * startDate, end_date -> endDate, etc).
 */

/** Estado do ciclo de vida de uma formação. */
export type TrainingStatus = "planeada" | "em_curso" | "concluida" | "cancelada";

/** Acção de formação/capacitação. */
export interface TrainingDto {
  id: string;
  title: string;
  description: string | null;
  trainer: string | null;
  location: string | null;
  startDate: string;
  endDate: string;
  hours: number;
  status: TrainingStatus;
  notes: string | null;
  createdAt: string;
}

/** Parâmetros de listagem paginada/filtrada de formações. */
export interface TrainingListParams {
  page?: number;
  perPage?: number;
  search?: string;
  status?: TrainingStatus;
}
