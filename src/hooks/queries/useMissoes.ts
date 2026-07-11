import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  approveMission,
  approveReport,
  createExpense,
  createMission,
  createParticipant,
  deleteExpense,
  deleteMission,
  deleteParticipant,
  getGuide,
  getMission,
  getMissionStats,
  getReport,
  listExpenses,
  listMissions,
  listParticipants,
  rejectMission,
  submitMission,
  updateMission,
  upsertGuide,
  upsertReport,
} from "@/services/api/missoes";
import type {
  ExpenseInput,
  GuideInput,
  MissionDto,
  MissionListParams,
  MissionTransitionInput,
  ParticipantInput,
  ReportInput,
} from "@/types/dto/missoes";

/**
 * Hooks react-query do módulo Missões.
 *
 * `missionKeys` inclui list/detail, uma chave `stats` (KPIs) e sub-chaves
 * `participants(id)`/`guide(id)`/`expenses(id)`/`report(id)` para as 4
 * sub-entidades geridas dentro do detalhe. As mutations de sub-entidades e as
 * transições de workflow invalidam o que é afectado (detalhe + sub-lista +
 * listas/KPIs globais, quando o estado/orçamento pode mudar).
 */
export const missionKeys = {
  all: ["missoes"] as const,
  lists: () => [...missionKeys.all, "list"] as const,
  list: (params: MissionListParams) => [...missionKeys.lists(), params] as const,
  details: () => [...missionKeys.all, "detail"] as const,
  detail: (id: string) => [...missionKeys.details(), id] as const,
  stats: () => [...missionKeys.all, "stats"] as const,
  participants: (id: string) => [...missionKeys.detail(id), "participantes"] as const,
  guide: (id: string) => [...missionKeys.detail(id), "guia"] as const,
  expenses: (id: string) => [...missionKeys.detail(id), "despesas"] as const,
  report: (id: string) => [...missionKeys.detail(id), "relatorio"] as const,
};

// --- Missões ----------------------------------------------------------------

export function useMissionsList(params: MissionListParams) {
  return useQuery({
    queryKey: missionKeys.list(params),
    queryFn: () => listMissions(params),
  });
}

export function useMissionStats() {
  return useQuery({
    queryKey: missionKeys.stats(),
    queryFn: () => getMissionStats(),
  });
}

export function useMission(id: string | null) {
  return useQuery({
    queryKey: missionKeys.detail(id ?? "none"),
    queryFn: () => getMission(id as string),
    enabled: !!id,
  });
}

export function useCreateMission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<MissionDto>) => createMission(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: missionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: missionKeys.stats() });
    },
  });
}

export function useUpdateMission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<MissionDto> }) =>
      updateMission(id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: missionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: missionKeys.stats() });
      queryClient.invalidateQueries({ queryKey: missionKeys.detail(updated.id) });
    },
  });
}

export function useDeleteMission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMission(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: missionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: missionKeys.stats() });
    },
  });
}

// --- Workflow de aprovação --------------------------------------------------

/**
 * Uma transição de workflow altera o estado da missão e, logo, os KPIs e a
 * posição nas listas: invalida detalhe + listas + stats.
 */
function useMissionWorkflowInvalidator(missionId: string) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: missionKeys.detail(missionId) });
    queryClient.invalidateQueries({ queryKey: missionKeys.lists() });
    queryClient.invalidateQueries({ queryKey: missionKeys.stats() });
  };
}

export function useSubmitMission(missionId: string) {
  const invalidate = useMissionWorkflowInvalidator(missionId);
  return useMutation({
    mutationFn: (payload: MissionTransitionInput) => submitMission(missionId, payload),
    onSuccess: invalidate,
  });
}

export function useApproveMission(missionId: string) {
  const invalidate = useMissionWorkflowInvalidator(missionId);
  return useMutation({
    mutationFn: (payload: MissionTransitionInput) => approveMission(missionId, payload),
    onSuccess: invalidate,
  });
}

export function useRejectMission(missionId: string) {
  const invalidate = useMissionWorkflowInvalidator(missionId);
  return useMutation({
    mutationFn: (payload: MissionTransitionInput) => rejectMission(missionId, payload),
    onSuccess: invalidate,
  });
}

// --- Participantes ----------------------------------------------------------

export function useParticipants(missionId: string | null) {
  return useQuery({
    queryKey: missionKeys.participants(missionId ?? "none"),
    queryFn: () => listParticipants(missionId as string),
    enabled: !!missionId,
  });
}

export function useCreateParticipant(missionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ParticipantInput) => createParticipant(missionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: missionKeys.participants(missionId) });
    },
  });
}

export function useDeleteParticipant(missionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (participantId: string) => deleteParticipant(missionId, participantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: missionKeys.participants(missionId) });
    },
  });
}

// --- Guia de marcha ---------------------------------------------------------

export function useGuide(missionId: string | null) {
  return useQuery({
    queryKey: missionKeys.guide(missionId ?? "none"),
    queryFn: () => getGuide(missionId as string),
    enabled: !!missionId,
  });
}

export function useUpsertGuide(missionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: GuideInput) => upsertGuide(missionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: missionKeys.guide(missionId) });
    },
  });
}

// --- Despesas ---------------------------------------------------------------

export function useExpenses(missionId: string | null) {
  return useQuery({
    queryKey: missionKeys.expenses(missionId ?? "none"),
    queryFn: () => listExpenses(missionId as string),
    enabled: !!missionId,
  });
}

export function useCreateExpense(missionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ExpenseInput) => createExpense(missionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: missionKeys.expenses(missionId) });
    },
  });
}

export function useDeleteExpense(missionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (expenseId: string) => deleteExpense(missionId, expenseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: missionKeys.expenses(missionId) });
    },
  });
}

// --- Relatório final --------------------------------------------------------

export function useReport(missionId: string | null) {
  return useQuery({
    queryKey: missionKeys.report(missionId ?? "none"),
    queryFn: () => getReport(missionId as string),
    enabled: !!missionId,
  });
}

export function useUpsertReport(missionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ReportInput) => upsertReport(missionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: missionKeys.report(missionId) });
    },
  });
}

export function useApproveReport(missionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: MissionTransitionInput) => approveReport(missionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: missionKeys.report(missionId) });
    },
  });
}
