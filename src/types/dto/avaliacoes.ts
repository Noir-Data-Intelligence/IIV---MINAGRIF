/**
 * DTOs do módulo Avaliações de Desempenho — domínio coeso de 5 recursos
 * relacionados que gravitam em torno da avaliação individual:
 *
 *  - `CycleDto`       — ciclo de avaliação (anual); agrupa critérios e avaliações
 *  - `CriteriaDto`    — critério de avaliação (FK `cycleId`)
 *  - `EvaluationDto`  — avaliação individual de um colaborador (workflow de
 *                       aprovação: rascunho -> submetida -> aprovada -> validada)
 *  - `ScoreDto`       — pontuação por critério de uma avaliação (FK `evaluationId`,
 *                       `criteriaId`)
 *  - `HistoryDto`     — histórico de transições de uma avaliação (auditoria)
 *
 * Espelham as tabelas Supabase originais (`evaluation_cycles`,
 * `evaluation_criteria`, `employee_evaluations`, `evaluation_scores`,
 * `evaluation_history`) já convertidas para camelCase, tal como o backend
 * Laravel as devolverá via API Resources (cycle_id -> cycleId, global_score ->
 * globalScore, submitted_at -> submittedAt, etc).
 *
 * Por serem fortemente relacionados (o detalhe da avaliação gere pontuações e
 * histórico inline), agrupam-se num único ficheiro por camada — mantendo, ainda
 * assim, tipos/params separados por entidade.
 */

/** Estado de um ciclo de avaliação. */
export type CycleStatus = "planeado" | "aberto" | "fechado";

/** Estado de uma avaliação no seu workflow de aprovação. */
export type EvaluationStatus =
  | "rascunho"
  | "submetida"
  | "aprovada"
  | "rejeitada"
  | "validada";

// --- Ciclo ------------------------------------------------------------------

export interface CycleDto {
  id: string;
  name: string;
  year: number;
  startDate: string;
  endDate: string;
  status: CycleStatus;
  description: string | null;
  createdAt: string;
}

// --- Critério ---------------------------------------------------------------

export interface CriteriaDto {
  id: string;
  cycleId: string;
  name: string;
  weight: number;
  description: string | null;
  displayOrder: number;
  createdAt: string;
}

// --- Avaliação --------------------------------------------------------------

export interface EvaluationDto {
  id: string;
  cycleId: string;
  /** Nome do ciclo resolvido pelo servidor (eager-load), só-leitura. */
  cycleName: string | null;
  employeeId: string;
  /** Nome do colaborador avaliado resolvido contra `colaboradores`, só-leitura. */
  employeeName: string | null;
  evaluatorId: string | null;
  /** Nome do avaliador resolvido contra `users`, só-leitura. */
  evaluatorName: string | null;
  evaluationDate: string | null;
  globalScore: number | null;
  strengths: string | null;
  improvements: string | null;
  generalComments: string | null;
  status: EvaluationStatus;
  submittedAt: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
  /** Nome de quem aprovou, resolvido contra `users`, só-leitura. */
  approvedByName: string | null;
  rejectionReason: string | null;
  acknowledgedAt: string | null;
  createdAt: string;
}

// --- Pontuação por critério -------------------------------------------------

export interface ScoreDto {
  id: string;
  evaluationId: string;
  criteriaId: string;
  score: number;
  comment: string | null;
}

// --- Histórico de transições ------------------------------------------------

export interface HistoryDto {
  id: string;
  evaluationId: string;
  actorId: string | null;
  /** Nome do actor resolvido contra `users`, só-leitura. */
  actorName: string | null;
  action: string;
  fromStatus: EvaluationStatus | null;
  toStatus: EvaluationStatus | null;
  comment: string | null;
  changes: Record<string, unknown> | null;
  createdAt: string;
}

// --- KPIs -------------------------------------------------------------------

/** Agregados devolvidos por `GET /avaliacoes/stats`. */
export interface EvaluationStats {
  total: number;
  /** Avaliações submetidas a aguardar aprovação. */
  pending: number;
  /** Média das pontuações globais (avaliações com nota atribuída), ou null. */
  avgScore: number | null;
  /** Nome do ciclo activo (estado "aberto"), ou null. */
  activeCycleName: string | null;
  /** Total de ciclos cadastrados, independentemente do estado. */
  totalCycles: number;
}

// --- Parâmetros de listagem / inputs ---------------------------------------

export interface CycleListParams {
  page?: number;
  perPage?: number;
  search?: string;
  status?: CycleStatus;
}

export interface CriteriaListParams {
  page?: number;
  perPage?: number;
  search?: string;
  cycleId?: string;
}

export interface EvaluationListParams {
  page?: number;
  perPage?: number;
  search?: string;
  status?: EvaluationStatus;
  cycleId?: string;
  employeeId?: string;
}

/** Payload das transições de workflow (submeter / aprovar / rejeitar / validar / reabrir). */
export interface EvaluationTransitionInput {
  actorId?: string | null;
  /** Motivo (obrigatório na rejeição) ou comentário livre da transição. */
  reason?: string | null;
}

/** Payload de criação/actualização de um ciclo. */
export interface CycleInput {
  name: string;
  year: number;
  startDate: string;
  endDate: string;
  status: CycleStatus;
  description?: string | null;
}

/** Payload de criação/actualização de um critério. */
export interface CriteriaInput {
  cycleId: string;
  name: string;
  weight: number;
  description?: string | null;
  displayOrder?: number;
}

/** Payload de criação/actualização de uma avaliação. */
export interface EvaluationInput {
  cycleId: string;
  employeeId: string;
  evaluatorId?: string | null;
  evaluationDate?: string | null;
  globalScore?: number | null;
  strengths?: string | null;
  improvements?: string | null;
  generalComments?: string | null;
}
