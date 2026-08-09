import { apiDelete, apiGet, apiPost, apiPut } from "@/services/api/client";
import type { Paginated } from "@/types/dto/paginated";
import type {
  ContractDto,
  ContractListParams,
  EmployeeDto,
  EmployeeListParams,
  LeaveDto,
  LeaveListParams,
} from "@/types/dto/recursosHumanos";

/** Serviço de dados do RH Transversal — `/rh-transversal/*`, esquema separado do RH Laboratorial. */
const ROUTES = {
  colaboradores: "/rh-transversal/colaboradores",
  colaborador: (id: string) => `/rh-transversal/colaboradores/${id}`,
  contratos: "/rh-transversal/contratos",
  contrato: (id: string) => `/rh-transversal/contratos/${id}`,
  ausencias: "/rh-transversal/ausencias",
  ausencia: (id: string) => `/rh-transversal/ausencias/${id}`,
};

function employeesToQuery(params: EmployeeListParams): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {
    page: params.page ?? 1,
    per_page: params.perPage ?? 20,
  };
  if (params.search) query.search = params.search;
  if (params.departmentId) query.department_id = params.departmentId;
  if (params.isActive !== undefined) query.is_active = params.isActive;
  return query;
}

export function listEmployeesTransversal(params: EmployeeListParams): Promise<Paginated<EmployeeDto>> {
  return apiGet<Paginated<EmployeeDto>>(ROUTES.colaboradores, { params: employeesToQuery(params) });
}

export function createEmployeeTransversal(payload: Partial<EmployeeDto>): Promise<EmployeeDto> {
  return apiPost<EmployeeDto>(ROUTES.colaboradores, payload);
}

export function updateEmployeeTransversal(id: string, payload: Partial<EmployeeDto>): Promise<EmployeeDto> {
  return apiPut<EmployeeDto>(ROUTES.colaborador(id), payload);
}

export function deleteEmployeeTransversal(id: string): Promise<void> {
  return apiDelete<void>(ROUTES.colaborador(id));
}

function contractsToQuery(params: ContractListParams): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {
    page: params.page ?? 1,
    per_page: params.perPage ?? 20,
  };
  if (params.search) query.search = params.search;
  if (params.employeeId) query.employee_id = params.employeeId;
  if (params.contractType) query.contract_type = params.contractType;
  if (params.isActive !== undefined) query.is_active = params.isActive;
  return query;
}

export function listContractsTransversal(params: ContractListParams): Promise<Paginated<ContractDto>> {
  return apiGet<Paginated<ContractDto>>(ROUTES.contratos, { params: contractsToQuery(params) });
}

export function createContractTransversal(payload: Partial<ContractDto>): Promise<ContractDto> {
  return apiPost<ContractDto>(ROUTES.contratos, payload);
}

export function updateContractTransversal(id: string, payload: Partial<ContractDto>): Promise<ContractDto> {
  return apiPut<ContractDto>(ROUTES.contrato(id), payload);
}

export function deleteContractTransversal(id: string): Promise<void> {
  return apiDelete<void>(ROUTES.contrato(id));
}

function leavesToQuery(params: LeaveListParams): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {
    page: params.page ?? 1,
    per_page: params.perPage ?? 20,
  };
  if (params.search) query.search = params.search;
  if (params.employeeId) query.employee_id = params.employeeId;
  if (params.leaveType) query.leave_type = params.leaveType;
  if (params.status) query.status = params.status;
  return query;
}

export function listLeavesTransversal(params: LeaveListParams): Promise<Paginated<LeaveDto>> {
  return apiGet<Paginated<LeaveDto>>(ROUTES.ausencias, { params: leavesToQuery(params) });
}

export function createLeaveTransversal(payload: Partial<LeaveDto>): Promise<LeaveDto> {
  return apiPost<LeaveDto>(ROUTES.ausencias, payload);
}

export function updateLeaveTransversal(id: string, payload: Partial<LeaveDto>): Promise<LeaveDto> {
  return apiPut<LeaveDto>(ROUTES.ausencia(id), payload);
}

export function deleteLeaveTransversal(id: string): Promise<void> {
  return apiDelete<void>(ROUTES.ausencia(id));
}
