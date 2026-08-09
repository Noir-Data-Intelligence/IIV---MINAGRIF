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

/** Serviço de dados do RH Laboratorial — `/rh-laboratorio/*`, esquema separado do RH Transversal. */
const ROUTES = {
  colaboradores: "/rh-laboratorio/colaboradores",
  colaborador: (id: string) => `/rh-laboratorio/colaboradores/${id}`,
  contratos: "/rh-laboratorio/contratos",
  contrato: (id: string) => `/rh-laboratorio/contratos/${id}`,
  ausencias: "/rh-laboratorio/ausencias",
  ausencia: (id: string) => `/rh-laboratorio/ausencias/${id}`,
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

export function listEmployeesLaboratorio(params: EmployeeListParams): Promise<Paginated<EmployeeDto>> {
  return apiGet<Paginated<EmployeeDto>>(ROUTES.colaboradores, { params: employeesToQuery(params) });
}

export function createEmployeeLaboratorio(payload: Partial<EmployeeDto>): Promise<EmployeeDto> {
  return apiPost<EmployeeDto>(ROUTES.colaboradores, payload);
}

export function updateEmployeeLaboratorio(id: string, payload: Partial<EmployeeDto>): Promise<EmployeeDto> {
  return apiPut<EmployeeDto>(ROUTES.colaborador(id), payload);
}

export function deleteEmployeeLaboratorio(id: string): Promise<void> {
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

export function listContractsLaboratorio(params: ContractListParams): Promise<Paginated<ContractDto>> {
  return apiGet<Paginated<ContractDto>>(ROUTES.contratos, { params: contractsToQuery(params) });
}

export function createContractLaboratorio(payload: Partial<ContractDto>): Promise<ContractDto> {
  return apiPost<ContractDto>(ROUTES.contratos, payload);
}

export function updateContractLaboratorio(id: string, payload: Partial<ContractDto>): Promise<ContractDto> {
  return apiPut<ContractDto>(ROUTES.contrato(id), payload);
}

export function deleteContractLaboratorio(id: string): Promise<void> {
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

export function listLeavesLaboratorio(params: LeaveListParams): Promise<Paginated<LeaveDto>> {
  return apiGet<Paginated<LeaveDto>>(ROUTES.ausencias, { params: leavesToQuery(params) });
}

export function createLeaveLaboratorio(payload: Partial<LeaveDto>): Promise<LeaveDto> {
  return apiPost<LeaveDto>(ROUTES.ausencias, payload);
}

export function updateLeaveLaboratorio(id: string, payload: Partial<LeaveDto>): Promise<LeaveDto> {
  return apiPut<LeaveDto>(ROUTES.ausencia(id), payload);
}

export function deleteLeaveLaboratorio(id: string): Promise<void> {
  return apiDelete<void>(ROUTES.ausencia(id));
}
