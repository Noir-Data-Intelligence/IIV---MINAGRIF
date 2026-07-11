import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAccount,
  createBudget,
  createTransaction,
  deleteAccount,
  deleteBudget,
  deleteTransaction,
  listAccounts,
  listBudgets,
  listTransactions,
  updateAccount,
  updateBudget,
  updateTransaction,
} from "@/services/api/financeiro";
import type {
  AccountDto,
  AccountListParams,
  BudgetDto,
  BudgetListParams,
  TransactionDto,
  TransactionListParams,
} from "@/types/dto/financeiro";

/**
 * Hooks react-query do módulo Financeiro.
 *
 * Segue o padrão de `useDepartamentos.ts`, mantendo uma fábrica de query keys
 * hierárquicas SEPARADA por entidade (contas / lançamentos / orçamentos) para
 * invalidação precisa. Como as três entidades se influenciam (um novo
 * lançamento altera KPIs e execução orçamental), as mutations de lançamentos
 * invalidam também as listas de orçamentos, e a remoção de uma conta invalida
 * lançamentos e orçamentos dependentes.
 */

export const accountKeys = {
  all: ["contas"] as const,
  lists: () => [...accountKeys.all, "list"] as const,
  list: (params: AccountListParams) => [...accountKeys.lists(), params] as const,
  details: () => [...accountKeys.all, "detail"] as const,
  detail: (id: string) => [...accountKeys.details(), id] as const,
};

export const transactionKeys = {
  all: ["lancamentos"] as const,
  lists: () => [...transactionKeys.all, "list"] as const,
  list: (params: TransactionListParams) => [...transactionKeys.lists(), params] as const,
  details: () => [...transactionKeys.all, "detail"] as const,
  detail: (id: string) => [...transactionKeys.details(), id] as const,
};

export const budgetKeys = {
  all: ["orcamentos"] as const,
  lists: () => [...budgetKeys.all, "list"] as const,
  list: (params: BudgetListParams) => [...budgetKeys.lists(), params] as const,
  details: () => [...budgetKeys.all, "detail"] as const,
  detail: (id: string) => [...budgetKeys.details(), id] as const,
};

// --- Contas ----------------------------------------------------------------

export function useAccountsList(params: AccountListParams) {
  return useQuery({
    queryKey: accountKeys.list(params),
    queryFn: () => listAccounts(params),
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<AccountDto>) => createAccount(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() });
    },
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<AccountDto> }) =>
      updateAccount(id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() });
      queryClient.invalidateQueries({ queryKey: accountKeys.detail(updated.id) });
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAccount(id),
    onSuccess: () => {
      // A remoção de uma conta arrasta lançamentos e orçamentos dependentes.
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() });
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: budgetKeys.lists() });
    },
  });
}

// --- Lançamentos -----------------------------------------------------------

export function useTransactionsList(params: TransactionListParams) {
  return useQuery({
    queryKey: transactionKeys.list(params),
    queryFn: () => listTransactions(params),
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<TransactionDto>) => createTransaction(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() });
      // Afecta KPIs e execução orçamental.
      queryClient.invalidateQueries({ queryKey: budgetKeys.lists() });
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<TransactionDto> }) =>
      updateTransaction(id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: transactionKeys.detail(updated.id) });
      queryClient.invalidateQueries({ queryKey: budgetKeys.lists() });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: budgetKeys.lists() });
    },
  });
}

// --- Orçamentos ------------------------------------------------------------

export function useBudgetsList(params: BudgetListParams) {
  return useQuery({
    queryKey: budgetKeys.list(params),
    queryFn: () => listBudgets(params),
  });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<BudgetDto>) => createBudget(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.lists() });
    },
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<BudgetDto> }) =>
      updateBudget(id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: budgetKeys.detail(updated.id) });
    },
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBudget(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.lists() });
    },
  });
}
