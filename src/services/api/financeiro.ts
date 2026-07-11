import { apiDelete, apiGet, apiPost, apiPut } from "@/services/api/client";
import type { Paginated } from "@/types/dto/paginated";
import type {
  AccountDto,
  AccountListParams,
  BudgetDto,
  BudgetListParams,
  TransactionDto,
  TransactionListParams,
} from "@/types/dto/financeiro";

/**
 * Serviço de dados do módulo Financeiro.
 *
 * Cobre 3 recursos relacionados: `contas` (plano de contas), `lancamentos`
 * (movimentos) e `orcamentos`. Assenta nos helpers de `client.ts` e nunca
 * conhece o axios nem o MSW directamente — os hooks só falam com estas funções.
 *
 * Rotas declaradas localmente (ver nota em `documentos.ts`) — consolidar em
 * `endpoints.ts` (entradas `contas`, `lancamentos`, `orcamentos`) no final.
 */
const ROUTES = {
  contas: "/contas",
  conta: (id: string) => `/contas/${id}`,
  lancamentos: "/lancamentos",
  lancamento: (id: string) => `/lancamentos/${id}`,
  orcamentos: "/orcamentos",
  orcamento: (id: string) => `/orcamentos/${id}`,
};

// --- Contas ----------------------------------------------------------------

function accountsToQuery(params: AccountListParams): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {
    page: params.page ?? 1,
    per_page: params.perPage ?? 20,
  };
  if (params.search) query.search = params.search;
  if (params.type) query.type = params.type;
  if (params.isActive !== undefined) query.is_active = params.isActive;
  return query;
}

export function listAccounts(params: AccountListParams): Promise<Paginated<AccountDto>> {
  return apiGet<Paginated<AccountDto>>(ROUTES.contas, { params: accountsToQuery(params) });
}

export function createAccount(payload: Partial<AccountDto>): Promise<AccountDto> {
  return apiPost<AccountDto>(ROUTES.contas, payload);
}

export function updateAccount(id: string, payload: Partial<AccountDto>): Promise<AccountDto> {
  return apiPut<AccountDto>(ROUTES.conta(id), payload);
}

export function deleteAccount(id: string): Promise<void> {
  return apiDelete<void>(ROUTES.conta(id));
}

// --- Lançamentos -----------------------------------------------------------

function transactionsToQuery(params: TransactionListParams): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {
    page: params.page ?? 1,
    per_page: params.perPage ?? 20,
  };
  if (params.search) query.search = params.search;
  if (params.type) query.type = params.type;
  if (params.status) query.status = params.status;
  if (params.accountId) query.account_id = params.accountId;
  if (params.departmentId) query.department_id = params.departmentId;
  return query;
}

export function listTransactions(params: TransactionListParams): Promise<Paginated<TransactionDto>> {
  return apiGet<Paginated<TransactionDto>>(ROUTES.lancamentos, { params: transactionsToQuery(params) });
}

export function createTransaction(payload: Partial<TransactionDto>): Promise<TransactionDto> {
  return apiPost<TransactionDto>(ROUTES.lancamentos, payload);
}

export function updateTransaction(id: string, payload: Partial<TransactionDto>): Promise<TransactionDto> {
  return apiPut<TransactionDto>(ROUTES.lancamento(id), payload);
}

export function deleteTransaction(id: string): Promise<void> {
  return apiDelete<void>(ROUTES.lancamento(id));
}

// --- Orçamentos ------------------------------------------------------------

function budgetsToQuery(params: BudgetListParams): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {
    page: params.page ?? 1,
    per_page: params.perPage ?? 20,
  };
  if (params.search) query.search = params.search;
  if (params.year) query.year = params.year;
  if (params.accountId) query.account_id = params.accountId;
  return query;
}

export function listBudgets(params: BudgetListParams): Promise<Paginated<BudgetDto>> {
  return apiGet<Paginated<BudgetDto>>(ROUTES.orcamentos, { params: budgetsToQuery(params) });
}

export function createBudget(payload: Partial<BudgetDto>): Promise<BudgetDto> {
  return apiPost<BudgetDto>(ROUTES.orcamentos, payload);
}

export function updateBudget(id: string, payload: Partial<BudgetDto>): Promise<BudgetDto> {
  return apiPut<BudgetDto>(ROUTES.orcamento(id), payload);
}

export function deleteBudget(id: string): Promise<void> {
  return apiDelete<void>(ROUTES.orcamento(id));
}
