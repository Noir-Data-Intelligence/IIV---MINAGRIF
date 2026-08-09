import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createContractLaboratorio,
  createEmployeeLaboratorio,
  createLeaveLaboratorio,
  deleteContractLaboratorio,
  deleteEmployeeLaboratorio,
  deleteLeaveLaboratorio,
  listContractsLaboratorio,
  listEmployeesLaboratorio,
  listLeavesLaboratorio,
  updateContractLaboratorio,
  updateEmployeeLaboratorio,
  updateLeaveLaboratorio,
} from "@/services/api/recursosHumanosLaboratorio";
import type {
  ContractDto,
  ContractListParams,
  EmployeeDto,
  EmployeeListParams,
  LeaveDto,
  LeaveListParams,
} from "@/types/dto/recursosHumanos";

/** Hooks react-query do RH Laboratorial — esquema separado do RH Transversal. */

export const employeeLaboratorioKeys = {
  all: ["rh-laboratorio-colaboradores"] as const,
  lists: () => [...employeeLaboratorioKeys.all, "list"] as const,
  list: (params: EmployeeListParams) => [...employeeLaboratorioKeys.lists(), params] as const,
  details: () => [...employeeLaboratorioKeys.all, "detail"] as const,
  detail: (id: string) => [...employeeLaboratorioKeys.details(), id] as const,
};

export const contractLaboratorioKeys = {
  all: ["rh-laboratorio-contratos"] as const,
  lists: () => [...contractLaboratorioKeys.all, "list"] as const,
  list: (params: ContractListParams) => [...contractLaboratorioKeys.lists(), params] as const,
};

export const leaveLaboratorioKeys = {
  all: ["rh-laboratorio-ausencias"] as const,
  lists: () => [...leaveLaboratorioKeys.all, "list"] as const,
  list: (params: LeaveListParams) => [...leaveLaboratorioKeys.lists(), params] as const,
};

export function useEmployeesLaboratorioList(params: EmployeeListParams) {
  return useQuery({
    queryKey: employeeLaboratorioKeys.list(params),
    queryFn: () => listEmployeesLaboratorio(params),
  });
}

export function useCreateEmployeeLaboratorio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<EmployeeDto>) => createEmployeeLaboratorio(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: employeeLaboratorioKeys.lists() }),
  });
}

export function useUpdateEmployeeLaboratorio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<EmployeeDto> }) =>
      updateEmployeeLaboratorio(id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: employeeLaboratorioKeys.lists() });
      queryClient.invalidateQueries({ queryKey: employeeLaboratorioKeys.detail(updated.id) });
    },
  });
}

export function useDeleteEmployeeLaboratorio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteEmployeeLaboratorio(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeLaboratorioKeys.lists() });
      queryClient.invalidateQueries({ queryKey: contractLaboratorioKeys.lists() });
      queryClient.invalidateQueries({ queryKey: leaveLaboratorioKeys.lists() });
    },
  });
}

export function useContractsLaboratorioList(params: ContractListParams) {
  return useQuery({
    queryKey: contractLaboratorioKeys.list(params),
    queryFn: () => listContractsLaboratorio(params),
  });
}

export function useCreateContractLaboratorio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<ContractDto>) => createContractLaboratorio(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: contractLaboratorioKeys.lists() }),
  });
}

export function useUpdateContractLaboratorio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ContractDto> }) =>
      updateContractLaboratorio(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: contractLaboratorioKeys.lists() }),
  });
}

export function useDeleteContractLaboratorio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteContractLaboratorio(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: contractLaboratorioKeys.lists() }),
  });
}

export function useLeavesLaboratorioList(params: LeaveListParams) {
  return useQuery({
    queryKey: leaveLaboratorioKeys.list(params),
    queryFn: () => listLeavesLaboratorio(params),
  });
}

export function useCreateLeaveLaboratorio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<LeaveDto>) => createLeaveLaboratorio(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: leaveLaboratorioKeys.lists() }),
  });
}

export function useUpdateLeaveLaboratorio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<LeaveDto> }) =>
      updateLeaveLaboratorio(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: leaveLaboratorioKeys.lists() }),
  });
}

export function useDeleteLeaveLaboratorio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteLeaveLaboratorio(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: leaveLaboratorioKeys.lists() }),
  });
}
