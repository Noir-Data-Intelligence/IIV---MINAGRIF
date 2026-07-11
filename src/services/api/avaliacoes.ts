import { apiDelete, apiGet, apiPost, apiPut } from "@/services/api/client";
import type { Paginated } from "@/types/dto/paginated";
import type {
  CriteriaDto,
  CriteriaInput,
  CriteriaListParams,
  CycleDto,
  CycleInput,
  CycleListParams,
  EvaluationDto,
  EvaluationInput,
  EvaluationListParams,
  EvaluationStats,
  EvaluationTransitionInput,
  HistoryDto,
  ScoreDto,
} from "@/types/dto/avaliacoes";

/**
 * Serviço de dados do módulo Avaliações de Desempenho.
 *
 * Cobre as 5 entidades do domínio (ciclos, critérios, avaliações, pontuações,
 * histórico), além do workflow de aprovação (submeter/aprovar/rejeitar/validar/
 * reabrir) modelado como mutations dedicadas à semelhança de `advanceProcess`/
 * `returnProcess` de Processos e `submitMission`/`approveMission` de Missões.
 *
 * Rotas declaradas localmente (ver nota em `financeiro.ts`/`missoes.ts`) —
 * consolidar em `endpoints.ts` (entrada `avaliacoes`) no final. Assenta nos
 * helpers de `client.ts` e nunca conhece o axios nem o MSW directamente.
 */
const ROUTES = {
  cycles: "/avaliacoes/ciclos",
  cycle: (id: string) => `/avaliacoes/ciclos/${id}`,
  criterias: "/avaliacoes/criterios",
  criteria: (id: string) => `/avaliacoes/criterios/${id}`,
  list: "/avaliacoes",
  detail: (id: string) => `/avaliacoes/${id}`,
  stats: "/avaliacoes/stats",
  scores: (id: string) => `/avaliacoes/${id}/pontuacoes`,
  history: (id: string) => `/avaliacoes/${id}/historico`,
  submit: (id: string) => `/avaliacoes/${id}/submeter`,
  approve: (id: string) => `/avaliacoes/${id}/aprovar`,
  reject: (id: string) => `/avaliacoes/${id}/rejeitar`,
  validate: (id: string) => `/avaliacoes/${id}/validar`,
  reopen: (id: string) => `/avaliacoes/${id}/reabrir`,
};

// --- Ciclos -----------------------------------------------------------------

function cyclesToQuery(params: CycleListParams): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {
    page: params.page ?? 1,
    per_page: params.perPage ?? 20,
  };
  if (params.search) query.search = params.search;
  if (params.status) query.status = params.status;
  return query;
}

export function listCycles(params: CycleListParams): Promise<Paginated<CycleDto>> {
  return apiGet<Paginated<CycleDto>>(ROUTES.cycles, { params: cyclesToQuery(params) });
}

export function createCycle(payload: CycleInput): Promise<CycleDto> {
  return apiPost<CycleDto>(ROUTES.cycles, payload);
}

export function updateCycle(id: string, payload: Partial<CycleInput>): Promise<CycleDto> {
  return apiPut<CycleDto>(ROUTES.cycle(id), payload);
}

export function deleteCycle(id: string): Promise<void> {
  return apiDelete<void>(ROUTES.cycle(id));
}

// --- Critérios --------------------------------------------------------------

function criteriasToQuery(params: CriteriaListParams): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {
    page: params.page ?? 1,
    per_page: params.perPage ?? 20,
  };
  if (params.search) query.search = params.search;
  if (params.cycleId) query.cycle_id = params.cycleId;
  return query;
}

export function listCriterias(params: CriteriaListParams): Promise<Paginated<CriteriaDto>> {
  return apiGet<Paginated<CriteriaDto>>(ROUTES.criterias, { params: criteriasToQuery(params) });
}

export function createCriteria(payload: CriteriaInput): Promise<CriteriaDto> {
  return apiPost<CriteriaDto>(ROUTES.criterias, payload);
}

export function updateCriteria(id: string, payload: Partial<CriteriaInput>): Promise<CriteriaDto> {
  return apiPut<CriteriaDto>(ROUTES.criteria(id), payload);
}

export function deleteCriteria(id: string): Promise<void> {
  return apiDelete<void>(ROUTES.criteria(id));
}

// --- Avaliações -------------------------------------------------------------

function evaluationsToQuery(params: EvaluationListParams): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {
    page: params.page ?? 1,
    per_page: params.perPage ?? 20,
  };
  if (params.search) query.search = params.search;
  if (params.status) query.status = params.status;
  if (params.cycleId) query.cycle_id = params.cycleId;
  if (params.employeeId) query.employee_id = params.employeeId;
  return query;
}

export function listEvaluations(params: EvaluationListParams): Promise<Paginated<EvaluationDto>> {
  return apiGet<Paginated<EvaluationDto>>(ROUTES.list, { params: evaluationsToQuery(params) });
}

export function getEvaluationStats(): Promise<EvaluationStats> {
  return apiGet<EvaluationStats>(ROUTES.stats);
}

export function getEvaluation(id: string): Promise<EvaluationDto> {
  return apiGet<EvaluationDto>(ROUTES.detail(id));
}

export function createEvaluation(payload: EvaluationInput): Promise<EvaluationDto> {
  return apiPost<EvaluationDto>(ROUTES.list, payload);
}

export function updateEvaluation(id: string, payload: Partial<EvaluationInput>): Promise<EvaluationDto> {
  return apiPut<EvaluationDto>(ROUTES.detail(id), payload);
}

export function deleteEvaluation(id: string): Promise<void> {
  return apiDelete<void>(ROUTES.detail(id));
}

// --- Pontuações / Histórico (só-leitura) ------------------------------------

export function listScores(evaluationId: string): Promise<ScoreDto[]> {
  return apiGet<ScoreDto[]>(ROUTES.scores(evaluationId));
}

export function listHistory(evaluationId: string): Promise<HistoryDto[]> {
  return apiGet<HistoryDto[]>(ROUTES.history(evaluationId));
}

// --- Workflow de aprovação --------------------------------------------------

export function submitEvaluation(id: string, payload: EvaluationTransitionInput): Promise<EvaluationDto> {
  return apiPost<EvaluationDto>(ROUTES.submit(id), payload);
}

export function approveEvaluation(id: string, payload: EvaluationTransitionInput): Promise<EvaluationDto> {
  return apiPost<EvaluationDto>(ROUTES.approve(id), payload);
}

export function rejectEvaluation(id: string, payload: EvaluationTransitionInput): Promise<EvaluationDto> {
  return apiPost<EvaluationDto>(ROUTES.reject(id), payload);
}

export function validateEvaluation(id: string, payload: EvaluationTransitionInput): Promise<EvaluationDto> {
  return apiPost<EvaluationDto>(ROUTES.validate(id), payload);
}

export function reopenEvaluation(id: string, payload: EvaluationTransitionInput): Promise<EvaluationDto> {
  return apiPost<EvaluationDto>(ROUTES.reopen(id), payload);
}
