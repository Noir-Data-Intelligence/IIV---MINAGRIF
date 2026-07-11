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

/**
 * Serviço de dados do módulo Recursos Humanos.
 *
 * Cobre 3 recursos relacionados: `colaboradores` (fichas de pessoal),
 * `contratos` (vínculos) e `ausencias` (férias/faltas). Assenta nos helpers de
 * `client.ts` e nunca conhece o axios nem o MSW directamente — os hooks só
 * falam com estas funções.
 *
 * Rotas declaradas localmente (ver nota em `financeiro.ts`) — consolidar em
 * `endpoints.ts` (entrada `rh`) no final.
 */
const ROUTES = {
  colaboradores: "/rh/colaboradores",
  colaborador: (id: string) => `/rh/colaboradores/${id}`,
  contratos: "/rh/contratos",
  contrato: (id: string) => `/rh/contratos/${id}`,
  ausencias: "/rh/ausencias",
  ausencia: (id: string) => `/rh/ausencias/${id}`,
};

// --- Colaboradores ---------------------------------------------------------

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

export function listEmployees(params: EmployeeListParams): Promise<Paginated<EmployeeDto>> {
  return apiGet<Paginated<EmployeeDto>>(ROUTES.colaboradores, { params: employeesToQuery(params) });
}

export function createEmployee(payload: Partial<EmployeeDto>): Promise<EmployeeDto> {
  return apiPost<EmployeeDto>(ROUTES.colaboradores, payload);
}

export function updateEmployee(id: string, payload: Partial<EmployeeDto>): Promise<EmployeeDto> {
  return apiPut<EmployeeDto>(ROUTES.colaborador(id), payload);
}

export function deleteEmployee(id: string): Promise<void> {
  return apiDelete<void>(ROUTES.colaborador(id));
}

// --- Contratos -------------------------------------------------------------

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

export function listContracts(params: ContractListParams): Promise<Paginated<ContractDto>> {
  return apiGet<Paginated<ContractDto>>(ROUTES.contratos, { params: contractsToQuery(params) });
}

export function createContract(payload: Partial<ContractDto>): Promise<ContractDto> {
  return apiPost<ContractDto>(ROUTES.contratos, payload);
}

export function updateContract(id: string, payload: Partial<ContractDto>): Promise<ContractDto> {
  return apiPut<ContractDto>(ROUTES.contrato(id), payload);
}

export function deleteContract(id: string): Promise<void> {
  return apiDelete<void>(ROUTES.contrato(id));
}

// --- Ausências -------------------------------------------------------------

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

export function listLeaves(params: LeaveListParams): Promise<Paginated<LeaveDto>> {
  return apiGet<Paginated<LeaveDto>>(ROUTES.ausencias, { params: leavesToQuery(params) });
}

export function createLeave(payload: Partial<LeaveDto>): Promise<LeaveDto> {
  return apiPost<LeaveDto>(ROUTES.ausencias, payload);
}

export function updateLeave(id: string, payload: Partial<LeaveDto>): Promise<LeaveDto> {
  return apiPut<LeaveDto>(ROUTES.ausencia(id), payload);
}

export function deleteLeave(id: string): Promise<void> {
  return apiDelete<void>(ROUTES.ausencia(id));
}
