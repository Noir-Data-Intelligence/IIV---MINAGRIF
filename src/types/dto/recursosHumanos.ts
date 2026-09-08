/**
 * DTOs do módulo Recursos Humanos — contrato REST dos recursos `colaboradores`
 * (fichas de pessoal), `contratos` (vínculos contratuais) e `ausencias`
 * (férias/faltas/licenças).
 *
 * Espelham as tabelas Supabase originais (`employees`, `employee_contracts`,
 * `employee_leaves`) já convertidas para camelCase, tal como o backend Laravel
 * as devolverá via API Resources (employee_number -> employeeNumber,
 * national_id -> nationalId, hire_date -> hireDate, start_date -> startDate,
 * etc). A (de)serialização, quando necessária, faz-se na camada de serviço.
 *
 * Domínio coeso e fortemente relacionado: um colaborador (`EmployeeDto`) é
 * referido tanto por contratos como por ausências (FK `employeeId`). Por isso
 * agrupam-se num único ficheiro por camada.
 */

/** Tipo/natureza do vínculo contratual. */
export type ContractType =
  | "efectivo"
  | "termo_certo"
  | "termo_incerto"
  | "prestacao_servicos"
  | "estagio";

/** Natureza de uma ausência. */
export type LeaveType =
  | "ferias"
  | "doenca"
  | "maternidade"
  | "paternidade"
  | "luto"
  | "sem_vencimento"
  | "outro";

/** Estado de aprovação de uma ausência. */
export type LeaveStatus = "pendente" | "aprovada" | "rejeitada" | "concluida";

/** Ficha de colaborador (pessoal do instituto). */
export interface EmployeeDto {
  id: string;
  employeeNumber: string;
  fullName: string;
  position: string | null;
  nationalId: string | null;
  phone: string | null;
  email: string | null;
  departmentId: string | null;
  hireDate: string | null;
  isActive: boolean;
  qualifications: string | null;
  notes: string | null;
  createdAt: string;
}

/** Vínculo contratual de um colaborador (cargo, período, remuneração). */
export interface ContractDto {
  id: string;
  employeeId: string;
  contractType: ContractType;
  position: string;
  startDate: string;
  endDate: string | null;
  salary: number;
  currency: string;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
}

/** Ausência/férias/licença de um colaborador. */
export interface LeaveDto {
  id: string;
  employeeId: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  status: LeaveStatus;
  reason: string | null;
  createdAt: string;
}

/** Parâmetros de listagem paginada/filtrada de colaboradores. */
export interface EmployeeListParams {
  page?: number;
  perPage?: number;
  search?: string;
  departmentId?: string;
  isActive?: boolean;
}

/** Parâmetros de listagem paginada/filtrada de contratos. */
export interface ContractListParams {
  page?: number;
  perPage?: number;
  search?: string;
  employeeId?: string;
  contractType?: ContractType;
  isActive?: boolean;
}

/** Parâmetros de listagem paginada/filtrada de ausências. */
export interface LeaveListParams {
  page?: number;
  perPage?: number;
  search?: string;
  employeeId?: string;
  leaveType?: LeaveType;
  status?: LeaveStatus;
}
