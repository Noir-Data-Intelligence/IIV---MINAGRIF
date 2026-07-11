import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  approveEvaluation,
  createCriteria,
  createCycle,
  createEvaluation,
  deleteCriteria,
  deleteCycle,
  deleteEvaluation,
  getEvaluation,
  getEvaluationStats,
  listCriterias,
  listCycles,
  listEvaluations,
  listHistory,
  listScores,
  rejectEvaluation,
  reopenEvaluation,
  submitEvaluation,
  updateCriteria,
  updateCycle,
  updateEvaluation,
  validateEvaluation,
} from "@/services/api/avaliacoes";
import type {
  CriteriaInput,
  CriteriaListParams,
  CycleInput,
  CycleListParams,
  EvaluationInput,
  EvaluationListParams,
  EvaluationTransitionInput,
} from "@/types/dto/avaliacoes";

/**
 * Hooks react-query do módulo Avaliações de Desempenho.
 *
 * Mantém fábricas de query keys hierárquicas SEPARADAS por entidade (ciclos /
 * critérios / avaliações), com sub-chaves `scores(id)`/`history(id)` para o
 * detalhe da avaliação e uma chave `stats` para os KPIs.
 *
 * As transições de workflow (submeter/aprovar/rejeitar/validar/reabrir) mudam o
 * estado da avaliação e, logo, os KPIs, a posição nas listas e o histórico:
 * invalidam detalhe + listas + stats + history.
 */

export const cycleKeys = {
  all: ["avaliacoes", "ciclos"] as const,
  lists: () => [...cycleKeys.all, "list"] as const,
  list: (params: CycleListParams) => [...cycleKeys.lists(), params] as const,
};

export const criteriaKeys = {
  all: ["avaliacoes", "criterios"] as const,
  lists: () => [...criteriaKeys.all, "list"] as const,
  list: (params: CriteriaListParams) => [...criteriaKeys.lists(), params] as const,
};

export const evaluationKeys = {
  all: ["avaliacoes", "avaliacoes"] as const,
  lists: () => [...evaluationKeys.all, "list"] as const,
  list: (params: EvaluationListParams) => [...evaluationKeys.lists(), params] as const,
  details: () => [...evaluationKeys.all, "detail"] as const,
  detail: (id: string) => [...evaluationKeys.details(), id] as const,
  stats: () => [...evaluationKeys.all, "stats"] as const,
  scores: (id: string) => [...evaluationKeys.detail(id), "pontuacoes"] as const,
  history: (id: string) => [...evaluationKeys.detail(id), "historico"] as const,
};

// --- Ciclos -----------------------------------------------------------------

export function useCyclesList(params: CycleListParams) {
  return useQuery({
    queryKey: cycleKeys.list(params),
    queryFn: () => listCycles(params),
  });
}

export function useCreateCycle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CycleInput) => createCycle(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cycleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: evaluationKeys.stats() });
    },
  });
}

export function useUpdateCycle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CycleInput> }) =>
      updateCycle(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cycleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: evaluationKeys.stats() });
    },
  });
}

export function useDeleteCycle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCycle(id),
    onSuccess: () => {
      // Remover um ciclo arrasta critérios e avaliações dependentes.
      queryClient.invalidateQueries({ queryKey: cycleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: criteriaKeys.lists() });
      queryClient.invalidateQueries({ queryKey: evaluationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: evaluationKeys.stats() });
    },
  });
}

// --- Critérios --------------------------------------------------------------

export function useCriteriasList(params: CriteriaListParams) {
  return useQuery({
    queryKey: criteriaKeys.list(params),
    queryFn: () => listCriterias(params),
  });
}

export function useCreateCriteria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CriteriaInput) => createCriteria(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: criteriaKeys.lists() });
    },
  });
}

export function useUpdateCriteria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CriteriaInput> }) =>
      updateCriteria(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: criteriaKeys.lists() });
    },
  });
}

export function useDeleteCriteria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCriteria(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: criteriaKeys.lists() });
    },
  });
}

// --- Avaliações -------------------------------------------------------------

export function useEvaluationsList(params: EvaluationListParams) {
  return useQuery({
    queryKey: evaluationKeys.list(params),
    queryFn: () => listEvaluations(params),
  });
}

export function useEvaluationStats() {
  return useQuery({
    queryKey: evaluationKeys.stats(),
    queryFn: () => getEvaluationStats(),
  });
}

export function useEvaluation(id: string | null) {
  return useQuery({
    queryKey: evaluationKeys.detail(id ?? "none"),
    queryFn: () => getEvaluation(id as string),
    enabled: !!id,
  });
}

export function useCreateEvaluation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: EvaluationInput) => createEvaluation(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: evaluationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: evaluationKeys.stats() });
    },
  });
}

export function useUpdateEvaluation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<EvaluationInput> }) =>
      updateEvaluation(id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: evaluationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: evaluationKeys.stats() });
      queryClient.invalidateQueries({ queryKey: evaluationKeys.detail(updated.id) });
    },
  });
}

export function useDeleteEvaluation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteEvaluation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: evaluationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: evaluationKeys.stats() });
    },
  });
}

// --- Pontuações / Histórico -------------------------------------------------

export function useScores(evaluationId: string | null) {
  return useQuery({
    queryKey: evaluationKeys.scores(evaluationId ?? "none"),
    queryFn: () => listScores(evaluationId as string),
    enabled: !!evaluationId,
  });
}

export function useHistory(evaluationId: string | null) {
  return useQuery({
    queryKey: evaluationKeys.history(evaluationId ?? "none"),
    queryFn: () => listHistory(evaluationId as string),
    enabled: !!evaluationId,
  });
}

// --- Workflow de aprovação --------------------------------------------------

/**
 * Uma transição altera o estado da avaliação (e regista uma linha de histórico
 * no servidor): invalida detalhe + listas + stats + histórico dessa avaliação.
 */
function useEvaluationWorkflowInvalidator(evaluationId: string) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: evaluationKeys.detail(evaluationId) });
    queryClient.invalidateQueries({ queryKey: evaluationKeys.lists() });
    queryClient.invalidateQueries({ queryKey: evaluationKeys.stats() });
    queryClient.invalidateQueries({ queryKey: evaluationKeys.history(evaluationId) });
  };
}

export function useSubmitEvaluation(evaluationId: string) {
  const invalidate = useEvaluationWorkflowInvalidator(evaluationId);
  return useMutation({
    mutationFn: (payload: EvaluationTransitionInput) => submitEvaluation(evaluationId, payload),
    onSuccess: invalidate,
  });
}

export function useApproveEvaluation(evaluationId: string) {
  const invalidate = useEvaluationWorkflowInvalidator(evaluationId);
  return useMutation({
    mutationFn: (payload: EvaluationTransitionInput) => approveEvaluation(evaluationId, payload),
    onSuccess: invalidate,
  });
}

export function useRejectEvaluation(evaluationId: string) {
  const invalidate = useEvaluationWorkflowInvalidator(evaluationId);
  return useMutation({
    mutationFn: (payload: EvaluationTransitionInput) => rejectEvaluation(evaluationId, payload),
    onSuccess: invalidate,
  });
}

export function useValidateEvaluation(evaluationId: string) {
  const invalidate = useEvaluationWorkflowInvalidator(evaluationId);
  return useMutation({
    mutationFn: (payload: EvaluationTransitionInput) => validateEvaluation(evaluationId, payload),
    onSuccess: invalidate,
  });
}

export function useReopenEvaluation(evaluationId: string) {
  const invalidate = useEvaluationWorkflowInvalidator(evaluationId);
  return useMutation({
    mutationFn: (payload: EvaluationTransitionInput) => reopenEvaluation(evaluationId, payload),
    onSuccess: invalidate,
  });
}
