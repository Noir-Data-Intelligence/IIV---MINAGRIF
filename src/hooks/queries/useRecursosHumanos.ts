import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createContract,
  createEmployee,
  createLeave,
  deleteContract,
  deleteEmployee,
  deleteLeave,
  listContracts,
  listEmployees,
  listLeaves,
  updateContract,
  updateEmployee,
  updateLeave,
} from "@/services/api/recursosHumanos";
import type {
  ContractDto,
  ContractListParams,
  EmployeeDto,
  EmployeeListParams,
  LeaveDto,
  LeaveListParams,
} from "@/types/dto/recursosHumanos";

/**
 * Hooks react-query do módulo Recursos Humanos.
 *
 * Segue o padrão de `useFinanceiro.ts`, mantendo uma fábrica de query keys
 * hierárquicas SEPARADA por entidade (colaboradores / contratos / ausências)
 * para invalidação precisa. Como as três entidades se relacionam por
 * `employeeId` (contratos e ausências dependem de um colaborador), a remoção de
 * um colaborador invalida também contratos e ausências dependentes.
 */

export const employeeKeys = {
  all: ["colaboradores"] as const,
  lists: () => [...employeeKeys.all, "list"] as const,
  list: (params: EmployeeListParams) => [...employeeKeys.lists(), params] as const,
  details: () => [...employeeKeys.all, "detail"] as const,
  detail: (id: string) => [...employeeKeys.details(), id] as const,
};

export const contractKeys = {
  all: ["contratos"] as const,
  lists: () => [...contractKeys.all, "list"] as const,
  list: (params: ContractListParams) => [...contractKeys.lists(), params] as const,
  details: () => [...contractKeys.all, "detail"] as const,
  detail: (id: string) => [...contractKeys.details(), id] as const,
};

export const leaveKeys = {
  all: ["ausencias"] as const,
  lists: () => [...leaveKeys.all, "list"] as const,
  list: (params: LeaveListParams) => [...leaveKeys.lists(), params] as const,
  details: () => [...leaveKeys.all, "detail"] as const,
  detail: (id: string) => [...leaveKeys.details(), id] as const,
};

// --- Colaboradores ---------------------------------------------------------

export function useEmployeesList(params: EmployeeListParams) {
  return useQuery({
    queryKey: employeeKeys.list(params),
    queryFn: () => listEmployees(params),
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<EmployeeDto>) => createEmployee(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<EmployeeDto> }) =>
      updateEmployee(id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: employeeKeys.detail(updated.id) });
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteEmployee(id),
    onSuccess: () => {
      // A remoção de um colaborador arrasta contratos e ausências dependentes.
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: contractKeys.lists() });
      queryClient.invalidateQueries({ queryKey: leaveKeys.lists() });
    },
  });
}

// --- Contratos -------------------------------------------------------------

export function useContractsList(params: ContractListParams) {
  return useQuery({
    queryKey: contractKeys.list(params),
    queryFn: () => listContracts(params),
  });
}

export function useCreateContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<ContractDto>) => createContract(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contractKeys.lists() });
    },
  });
}

export function useUpdateContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ContractDto> }) =>
      updateContract(id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: contractKeys.lists() });
      queryClient.invalidateQueries({ queryKey: contractKeys.detail(updated.id) });
    },
  });
}

export function useDeleteContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteContract(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contractKeys.lists() });
    },
  });
}

// --- Ausências -------------------------------------------------------------

export function useLeavesList(params: LeaveListParams) {
  return useQuery({
    queryKey: leaveKeys.list(params),
    queryFn: () => listLeaves(params),
  });
}

export function useCreateLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<LeaveDto>) => createLeave(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveKeys.lists() });
    },
  });
}

export function useUpdateLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<LeaveDto> }) =>
      updateLeave(id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: leaveKeys.lists() });
      queryClient.invalidateQueries({ queryKey: leaveKeys.detail(updated.id) });
    },
  });
}

export function useDeleteLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteLeave(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveKeys.lists() });
    },
  });
}
