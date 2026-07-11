/**
 * DTOs do módulo Missões — contrato REST de um domínio coeso de 5 recursos
 * relacionados por `missionId`:
 *
 *  - `MissionDto`      — a missão de serviço (workflow de aprovação)
 *  - `GuideDto`        — a guia de marcha (0..1 por missão)
 *  - `ParticipantDto`  — participantes (N por missão; `userId` -> `users`)
 *  - `ExpenseDto`      — despesas da prestação de contas (N por missão)
 *  - `ReportDto`       — relatório final de prestação de contas (0..1 por missão)
 *
 * Espelham as tabelas Supabase originais (`missions`, `mission_guides`,
 * `mission_participants`, `mission_expenses`, `mission_reports`) já convertidas
 * para camelCase, tal como o backend Laravel as devolverá via API Resources
 * (mission_id -> missionId, start_date -> startDate, per_diem -> perDiem, etc).
 *
 * Por serem fortemente relacionados (o detalhe da missão gere as 4 sub-entidades
 * inline), agrupam-se num único ficheiro por camada — mantendo, ainda assim,
 * schemas/params separados por entidade.
 */

/** Estado de uma missão no seu workflow de aprovação / execução. */
export type MissionStatus =
  | "planeada"
  | "submetida"
  | "aprovada"
  | "em_curso"
  | "concluida"
  | "cancelada";

/** Categoria de uma despesa da prestação de contas. */
export type ExpenseCategory =
  | "transporte"
  | "alojamento"
  | "alimentacao"
  | "combustivel"
  | "outro";

/** Estado do relatório final de prestação de contas. */
export type ReportStatus = "rascunho" | "submetido" | "aprovado" | "rejeitado";

// --- Missão -----------------------------------------------------------------

export interface MissionDto {
  id: string;
  title: string;
  destination: string;
  purpose: string | null;
  startDate: string;
  endDate: string;
  status: MissionStatus;
  budget: number;
  currency: string;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
}

// --- Guia de marcha ---------------------------------------------------------

export interface GuideDto {
  id: string;
  missionId: string;
  guideNumber: string;
  issueDate: string;
  perDiem: number;
  transport: string | null;
  notes: string | null;
  createdAt: string;
}

// --- Participante -----------------------------------------------------------

export interface ParticipantDto {
  id: string;
  missionId: string;
  userId: string;
  /** Nome resolvido pelo servidor contra `users` (eager-load), só-leitura. */
  fullName: string | null;
  role: string;
  perDiem: number;
  createdAt: string;
}

// --- Despesa ----------------------------------------------------------------

export interface ExpenseDto {
  id: string;
  missionId: string;
  category: ExpenseCategory;
  description: string | null;
  amount: number;
  currency: string;
  expenseDate: string;
  receiptUrl: string | null;
  createdAt: string;
}

// --- Relatório --------------------------------------------------------------

export interface ReportDto {
  id: string;
  missionId: string;
  reportDate: string;
  summary: string | null;
  outcomes: string | null;
  status: ReportStatus;
  submittedBy: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
}

// --- KPIs -------------------------------------------------------------------

/** Agregados devolvidos por `GET /missoes/stats`. */
export interface MissionStats {
  total: number;
  emCurso: number;
  pendentes: number;
  totalBudget: number;
}

// --- Parâmetros de listagem / inputs ---------------------------------------

export interface MissionListParams {
  page?: number;
  perPage?: number;
  search?: string;
  status?: MissionStatus;
}

/** Payload das transições de workflow (submeter / aprovar / rejeitar). */
export interface MissionTransitionInput {
  actorId?: string | null;
  notes?: string | null;
}

/** Payload de criação/actualização de um participante. */
export interface ParticipantInput {
  userId: string;
  role: string;
  perDiem: number;
}

/** Payload de criação de uma despesa. */
export interface ExpenseInput {
  category: ExpenseCategory;
  description?: string | null;
  amount: number;
  currency: string;
  expenseDate: string;
  receiptUrl?: string | null;
}

/** Payload de upsert da guia de marcha. */
export interface GuideInput {
  guideNumber: string;
  issueDate: string;
  perDiem: number;
  transport?: string | null;
  notes?: string | null;
}

/** Payload de upsert do relatório final. */
export interface ReportInput {
  reportDate: string;
  summary?: string | null;
  outcomes?: string | null;
  /** "rascunho" (guardar) ou "submetido" (submeter). */
  status: ReportStatus;
  submittedBy?: string | null;
}
