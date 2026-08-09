import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createContractTransversal,
  createEmployeeTransversal,
  createLeaveTransversal,
  deleteContractTransversal,
  deleteEmployeeTransversal,
  deleteLeaveTransversal,
  listContractsTransversal,
  listEmployeesTransversal,
  listLeavesTransversal,
  updateContractTransversal,
  updateEmployeeTransversal,
  updateLeaveTransversal,
} from "@/services/api/recursosHumanosTransversal";
import type {
  ContractDto,
  ContractListParams,
  EmployeeDto,
  EmployeeListParams,
  LeaveDto,
  LeaveListParams,
} from "@/types/dto/recursosHumanos";

/** Hooks react-query do RH Transversal — esquema separado do RH Laboratorial. */

export const employeeTransversalKeys = {
  all: ["rh-transversal-colaboradores"] as const,
  lists: () => [...employeeTransversalKeys.all, "list"] as const,
  list: (params: EmployeeListParams) => [...employeeTransversalKeys.lists(), params] as const,
  details: () => [...employeeTransversalKeys.all, "detail"] as const,
  detail: (id: string) => [...employeeTransversalKeys.details(), id] as const,
};

export const contractTransversalKeys = {
  all: ["rh-transversal-contratos"] as const,
  lists: () => [...contractTransversalKeys.all, "list"] as const,
  list: (params: ContractListParams) => [...contractTransversalKeys.lists(), params] as const,
};

export const leaveTransversalKeys = {
  all: ["rh-transversal-ausencias"] as const,
  lists: () => [...leaveTransversalKeys.all, "list"] as const,
  list: (params: LeaveListParams) => [...leaveTransversalKeys.lists(), params] as const,
};

export function useEmployeesTransversalList(params: EmployeeListParams) {
  return useQuery({
    queryKey: employeeTransversalKeys.list(params),
    queryFn: () => listEmployeesTransversal(params),
  });
}

export function useCreateEmployeeTransversal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<EmployeeDto>) => createEmployeeTransversal(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: employeeTransversalKeys.lists() }),
  });
}

export function useUpdateEmployeeTransversal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<EmployeeDto> }) =>
      updateEmployeeTransversal(id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: employeeTransversalKeys.lists() });
      queryClient.invalidateQueries({ queryKey: employeeTransversalKeys.detail(updated.id) });
    },
  });
}

export function useDeleteEmployeeTransversal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteEmployeeTransversal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeTransversalKeys.lists() });
      queryClient.invalidateQueries({ queryKey: contractTransversalKeys.lists() });
      queryClient.invalidateQueries({ queryKey: leaveTransversalKeys.lists() });
    },
  });
}

export function useContractsTransversalList(params: ContractListParams) {
  return useQuery({
    queryKey: contractTransversalKeys.list(params),
    queryFn: () => listContractsTransversal(params),
  });
}

export function useCreateContractTransversal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<ContractDto>) => createContractTransversal(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: contractTransversalKeys.lists() }),
  });
}

export function useUpdateContractTransversal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ContractDto> }) =>
      updateContractTransversal(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: contractTransversalKeys.lists() }),
  });
}

export function useDeleteContractTransversal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteContractTransversal(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: contractTransversalKeys.lists() }),
  });
}

export function useLeavesTransversalList(params: LeaveListParams) {
  return useQuery({
    queryKey: leaveTransversalKeys.list(params),
    queryFn: () => listLeavesTransversal(params),
  });
}

export function useCreateLeaveTransversal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<LeaveDto>) => createLeaveTransversal(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: leaveTransversalKeys.lists() }),
  });
}

export function useUpdateLeaveTransversal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<LeaveDto> }) =>
      updateLeaveTransversal(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: leaveTransversalKeys.lists() }),
  });
}

export function useDeleteLeaveTransversal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteLeaveTransversal(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: leaveTransversalKeys.lists() }),
  });
}
