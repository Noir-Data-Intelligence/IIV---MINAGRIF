import { apiDelete, apiGet, apiPost, apiPut } from "@/services/api/client";
import type { Paginated } from "@/types/dto/paginated";
import type {
  ExpenseDto,
  ExpenseInput,
  GuideDto,
  GuideInput,
  MissionDto,
  MissionListParams,
  MissionStats,
  MissionTransitionInput,
  ParticipantDto,
  ParticipantInput,
  ReportDto,
  ReportInput,
} from "@/types/dto/missoes";

/**
 * Serviço de dados do módulo Missões.
 *
 * Cobre a missão e as suas 4 sub-entidades (guia, participantes, despesas,
 * relatório), além do workflow de aprovação (submeter/aprovar/rejeitar),
 * modelado como mutations dedicadas à semelhança de `advanceProcess`/
 * `returnProcess` do módulo Processos.
 *
 * Rotas declaradas localmente (ver nota em `financeiro.ts`) — consolidar em
 * `endpoints.ts` (entrada `missoes`) no final. Assenta nos helpers de
 * `client.ts` e nunca conhece o axios nem o MSW directamente.
 */
const ROUTES = {
  list: "/missoes",
  detail: (id: string) => `/missoes/${id}`,
  stats: "/missoes/stats",
  submit: (id: string) => `/missoes/${id}/submeter`,
  approve: (id: string) => `/missoes/${id}/aprovar`,
  reject: (id: string) => `/missoes/${id}/rejeitar`,
  participants: (id: string) => `/missoes/${id}/participantes`,
  participant: (id: string, pid: string) => `/missoes/${id}/participantes/${pid}`,
  guide: (id: string) => `/missoes/${id}/guia`,
  expenses: (id: string) => `/missoes/${id}/despesas`,
  expense: (id: string, eid: string) => `/missoes/${id}/despesas/${eid}`,
  report: (id: string) => `/missoes/${id}/relatorio`,
  approveReport: (id: string) => `/missoes/${id}/relatorio/aprovar`,
};

// --- Missões ----------------------------------------------------------------

function toQuery(params: MissionListParams): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {
    page: params.page ?? 1,
    per_page: params.perPage ?? 20,
  };
  if (params.search) query.search = params.search;
  if (params.status) query.status = params.status;
  return query;
}

export function listMissions(params: MissionListParams): Promise<Paginated<MissionDto>> {
  return apiGet<Paginated<MissionDto>>(ROUTES.list, { params: toQuery(params) });
}

export function getMissionStats(): Promise<MissionStats> {
  return apiGet<MissionStats>(ROUTES.stats);
}

export function getMission(id: string): Promise<MissionDto> {
  return apiGet<MissionDto>(ROUTES.detail(id));
}

export function createMission(payload: Partial<MissionDto>): Promise<MissionDto> {
  return apiPost<MissionDto>(ROUTES.list, payload);
}

export function updateMission(id: string, payload: Partial<MissionDto>): Promise<MissionDto> {
  return apiPut<MissionDto>(ROUTES.detail(id), payload);
}

export function deleteMission(id: string): Promise<void> {
  return apiDelete<void>(ROUTES.detail(id));
}

// --- Workflow de aprovação --------------------------------------------------

export function submitMission(id: string, payload: MissionTransitionInput): Promise<MissionDto> {
  return apiPost<MissionDto>(ROUTES.submit(id), payload);
}

export function approveMission(id: string, payload: MissionTransitionInput): Promise<MissionDto> {
  return apiPost<MissionDto>(ROUTES.approve(id), payload);
}

export function rejectMission(id: string, payload: MissionTransitionInput): Promise<MissionDto> {
  return apiPost<MissionDto>(ROUTES.reject(id), payload);
}

// --- Participantes ----------------------------------------------------------

export function listParticipants(missionId: string): Promise<ParticipantDto[]> {
  return apiGet<ParticipantDto[]>(ROUTES.participants(missionId));
}

export function createParticipant(missionId: string, payload: ParticipantInput): Promise<ParticipantDto> {
  return apiPost<ParticipantDto>(ROUTES.participants(missionId), payload);
}

export function deleteParticipant(missionId: string, participantId: string): Promise<void> {
  return apiDelete<void>(ROUTES.participant(missionId, participantId));
}

// --- Guia de marcha (0..1) --------------------------------------------------

export function getGuide(missionId: string): Promise<GuideDto | null> {
  return apiGet<GuideDto | null>(ROUTES.guide(missionId));
}

/** Upsert: cria ou actualiza a guia única da missão. */
export function upsertGuide(missionId: string, payload: GuideInput): Promise<GuideDto> {
  return apiPut<GuideDto>(ROUTES.guide(missionId), payload);
}

// --- Despesas ---------------------------------------------------------------

export function listExpenses(missionId: string): Promise<ExpenseDto[]> {
  return apiGet<ExpenseDto[]>(ROUTES.expenses(missionId));
}

export function createExpense(missionId: string, payload: ExpenseInput): Promise<ExpenseDto> {
  return apiPost<ExpenseDto>(ROUTES.expenses(missionId), payload);
}

export function deleteExpense(missionId: string, expenseId: string): Promise<void> {
  return apiDelete<void>(ROUTES.expense(missionId, expenseId));
}

// --- Relatório final (0..1) -------------------------------------------------

export function getReport(missionId: string): Promise<ReportDto | null> {
  return apiGet<ReportDto | null>(ROUTES.report(missionId));
}

/** Upsert: cria ou actualiza o relatório único (guardar rascunho ou submeter). */
export function upsertReport(missionId: string, payload: ReportInput): Promise<ReportDto> {
  return apiPut<ReportDto>(ROUTES.report(missionId), payload);
}

export function approveReport(missionId: string, payload: MissionTransitionInput): Promise<ReportDto> {
  return apiPost<ReportDto>(ROUTES.approveReport(missionId), payload);
}
