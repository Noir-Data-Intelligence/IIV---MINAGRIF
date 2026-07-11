/**
 * DTOs do módulo Financeiro — contrato REST dos recursos `contas` (plano de
 * contas), `lancamentos` (movimentos/transacções) e `orcamentos`.
 *
 * Espelham as tabelas Supabase originais (`financial_accounts`,
 * `financial_transactions`, `budgets`) já convertidas para camelCase, tal como
 * o backend Laravel as devolverá via API Resources (account_id -> accountId,
 * transaction_date -> transactionDate, planned_amount -> plannedAmount, etc).
 * A (de)serialização, quando necessária, faz-se na camada de serviço.
 *
 * Domínio coeso e fortemente relacionado: uma conta (`AccountDto`) é referida
 * tanto por lançamentos como por orçamentos; o departamento é uma FK opcional
 * partilhada. Por isso agrupam-se num único ficheiro por camada.
 */

/** Natureza de uma conta e, por herança, de um lançamento. */
export type AccountType = "receita" | "despesa";

/** Estado de um lançamento financeiro. */
export type TransactionStatus = "pendente" | "pago" | "cancelado";

/** Conta do plano de contas (código, nome, natureza, activa/inactiva). */
export interface AccountDto {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}

/** Lançamento financeiro (movimento de receita ou despesa). */
export interface TransactionDto {
  id: string;
  accountId: string;
  departmentId: string | null;
  type: AccountType;
  amount: number;
  currency: string;
  transactionDate: string;
  description: string;
  reference: string | null;
  status: TransactionStatus;
  notes: string | null;
  createdAt: string;
}

/** Orçamento anual planeado para uma conta (opcionalmente por departamento). */
export interface BudgetDto {
  id: string;
  year: number;
  accountId: string;
  departmentId: string | null;
  plannedAmount: number;
  notes: string | null;
  createdAt: string;
}

/** Parâmetros de listagem paginada/filtrada de contas. */
export interface AccountListParams {
  page?: number;
  perPage?: number;
  search?: string;
  type?: AccountType;
  isActive?: boolean;
}

/** Parâmetros de listagem paginada/filtrada de lançamentos. */
export interface TransactionListParams {
  page?: number;
  perPage?: number;
  search?: string;
  type?: AccountType;
  status?: TransactionStatus;
  accountId?: string;
  departmentId?: string;
}

/** Parâmetros de listagem paginada/filtrada de orçamentos. */
export interface BudgetListParams {
  page?: number;
  perPage?: number;
  search?: string;
  year?: number;
  accountId?: string;
}
