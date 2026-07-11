import { http, HttpResponse } from "msw";
import {
  accountsFixtures,
  budgetsFixtures,
  transactionsFixtures,
} from "@/mocks/fixtures/financeiro";
import type {
  AccountDto,
  BudgetDto,
  TransactionDto,
} from "@/types/dto/financeiro";
import type { Paginated } from "@/types/dto/paginated";

/**
 * Handlers MSW do módulo Financeiro — recursos `contas` (plano de contas),
 * `lancamentos` (movimentos) e `orcamentos`.
 *
 * Operam sobre os arrays mutáveis de `fixtures/financeiro.ts`, pelo que as
 * escritas PERSISTEM durante a sessão do browser (reset no refresh). Segue a
 * lógica de paginação/filtragem de `handlers/departamentos.ts`.
 *
 * A remoção de uma conta arrasta (em cascata) os lançamentos e orçamentos que a
 * referem, mantendo a coerência do mock.
 */

const CONTAS = "*/api/contas";
const LANCAMENTOS = "*/api/lancamentos";
const ORCAMENTOS = "*/api/orcamentos";

/** Remove in-place todos os elementos que satisfazem o predicado. */
function removeWhere<T>(arr: T[], pred: (item: T) => boolean) {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (pred(arr[i])) arr.splice(i, 1);
  }
}

function paginate<T>(rows: T[], page: number, perPage: number): Paginated<T> {
  const total = rows.length;
  const lastPage = Math.max(1, Math.ceil(total / perPage));
  const start = (page - 1) * perPage;
  return {
    data: rows.slice(start, start + perPage),
    meta: { currentPage: page, perPage, total, lastPage },
  };
}

export const financeiroHandlers = [
  // ======================= CONTAS =======================

  // GET /api/contas -> lista paginada + filtrada, ordenada por código
  http.get(CONTAS, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1") || 1;
    const perPage = Number(url.searchParams.get("per_page") ?? "20") || 20;
    const search = (url.searchParams.get("search") ?? "").trim().toLowerCase();
    const type = url.searchParams.get("type") ?? "";
    const isActive = url.searchParams.get("is_active");

    let rows = [...accountsFixtures].sort((a, b) => a.code.localeCompare(b.code));

    if (search) {
      rows = rows.filter(
        (a) =>
          a.code.toLowerCase().includes(search) ||
          a.name.toLowerCase().includes(search) ||
          (a.description ?? "").toLowerCase().includes(search),
      );
    }
    if (type) rows = rows.filter((a) => a.type === type);
    if (isActive !== null) rows = rows.filter((a) => a.isActive === (isActive === "true"));

    return HttpResponse.json(paginate(rows, page, perPage));
  }),

  // POST /api/contas -> cria em memória
  http.post(CONTAS, async ({ request }) => {
    const payload = (await request.json().catch(() => ({}))) as Partial<AccountDto>;
    const created: AccountDto = {
      id: `acc-${Date.now()}`,
      code: payload.code ?? "0.0",
      name: payload.name ?? "Sem nome",
      type: payload.type ?? "despesa",
      description: payload.description ?? null,
      isActive: payload.isActive ?? true,
      createdAt: new Date().toISOString(),
    };
    accountsFixtures.unshift(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  // PUT /api/contas/:id -> actualiza em memória
  http.put(`${CONTAS}/:id`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const index = accountsFixtures.findIndex((a) => a.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Conta não encontrada." }, { status: 404 });
    }
    const payload = (await request.json().catch(() => ({}))) as Partial<AccountDto>;
    const updated: AccountDto = {
      ...accountsFixtures[index],
      ...payload,
      id: accountsFixtures[index].id,
      createdAt: accountsFixtures[index].createdAt,
    };
    accountsFixtures[index] = updated;
    return HttpResponse.json(updated);
  }),

  // DELETE /api/contas/:id -> remove conta + lançamentos e orçamentos dependentes
  http.delete(`${CONTAS}/:id`, ({ params }) => {
    const { id } = params as { id: string };
    const index = accountsFixtures.findIndex((a) => a.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Conta não encontrada." }, { status: 404 });
    }
    accountsFixtures.splice(index, 1);
    removeWhere(transactionsFixtures, (t) => t.accountId === id);
    removeWhere(budgetsFixtures, (b) => b.accountId === id);
    return new HttpResponse(null, { status: 204 });
  }),

  // ======================= LANÇAMENTOS =======================

  // GET /api/lancamentos -> lista paginada + filtrada, ordenada por data (desc)
  http.get(LANCAMENTOS, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1") || 1;
    const perPage = Number(url.searchParams.get("per_page") ?? "20") || 20;
    const search = (url.searchParams.get("search") ?? "").trim().toLowerCase();
    const type = url.searchParams.get("type") ?? "";
    const status = url.searchParams.get("status") ?? "";
    const accountId = url.searchParams.get("account_id") ?? "";
    const departmentId = url.searchParams.get("department_id") ?? "";

    let rows = [...transactionsFixtures].sort((a, b) =>
      b.transactionDate.localeCompare(a.transactionDate),
    );

    if (search) {
      rows = rows.filter(
        (t) =>
          t.description.toLowerCase().includes(search) ||
          (t.reference ?? "").toLowerCase().includes(search) ||
          (t.notes ?? "").toLowerCase().includes(search),
      );
    }
    if (type) rows = rows.filter((t) => t.type === type);
    if (status) rows = rows.filter((t) => t.status === status);
    if (accountId) rows = rows.filter((t) => t.accountId === accountId);
    if (departmentId) rows = rows.filter((t) => t.departmentId === departmentId);

    return HttpResponse.json(paginate(rows, page, perPage));
  }),

  // POST /api/lancamentos -> cria em memória
  http.post(LANCAMENTOS, async ({ request }) => {
    const payload = (await request.json().catch(() => ({}))) as Partial<TransactionDto>;
    const created: TransactionDto = {
      id: `tx-${Date.now()}`,
      accountId: payload.accountId ?? "",
      departmentId: payload.departmentId ?? null,
      type: payload.type ?? "despesa",
      amount: Number(payload.amount ?? 0),
      currency: payload.currency ?? "AOA",
      transactionDate: payload.transactionDate ?? new Date().toISOString().slice(0, 10),
      description: payload.description ?? "Sem descrição",
      reference: payload.reference ?? null,
      status: payload.status ?? "pago",
      notes: payload.notes ?? null,
      createdAt: new Date().toISOString(),
    };
    transactionsFixtures.unshift(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  // PUT /api/lancamentos/:id -> actualiza em memória
  http.put(`${LANCAMENTOS}/:id`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const index = transactionsFixtures.findIndex((t) => t.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Lançamento não encontrado." }, { status: 404 });
    }
    const payload = (await request.json().catch(() => ({}))) as Partial<TransactionDto>;
    const updated: TransactionDto = {
      ...transactionsFixtures[index],
      ...payload,
      amount: payload.amount !== undefined ? Number(payload.amount) : transactionsFixtures[index].amount,
      id: transactionsFixtures[index].id,
      createdAt: transactionsFixtures[index].createdAt,
    };
    transactionsFixtures[index] = updated;
    return HttpResponse.json(updated);
  }),

  // DELETE /api/lancamentos/:id -> remove em memória
  http.delete(`${LANCAMENTOS}/:id`, ({ params }) => {
    const { id } = params as { id: string };
    const index = transactionsFixtures.findIndex((t) => t.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Lançamento não encontrado." }, { status: 404 });
    }
    transactionsFixtures.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // ======================= ORÇAMENTOS =======================

  // GET /api/orcamentos -> lista paginada + filtrada, ordenada por ano (desc)
  http.get(ORCAMENTOS, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1") || 1;
    const perPage = Number(url.searchParams.get("per_page") ?? "20") || 20;
    const search = (url.searchParams.get("search") ?? "").trim().toLowerCase();
    const year = url.searchParams.get("year");
    const accountId = url.searchParams.get("account_id") ?? "";

    let rows = [...budgetsFixtures].sort(
      (a, b) => b.year - a.year || a.accountId.localeCompare(b.accountId),
    );

    if (search) {
      rows = rows.filter(
        (b) =>
          String(b.year).includes(search) ||
          (b.notes ?? "").toLowerCase().includes(search),
      );
    }
    if (year) rows = rows.filter((b) => b.year === Number(year));
    if (accountId) rows = rows.filter((b) => b.accountId === accountId);

    return HttpResponse.json(paginate(rows, page, perPage));
  }),

  // POST /api/orcamentos -> cria em memória
  http.post(ORCAMENTOS, async ({ request }) => {
    const payload = (await request.json().catch(() => ({}))) as Partial<BudgetDto>;
    const created: BudgetDto = {
      id: `bud-${Date.now()}`,
      year: Number(payload.year ?? new Date().getFullYear()),
      accountId: payload.accountId ?? "",
      departmentId: payload.departmentId ?? null,
      plannedAmount: Number(payload.plannedAmount ?? 0),
      notes: payload.notes ?? null,
      createdAt: new Date().toISOString(),
    };
    budgetsFixtures.unshift(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  // PUT /api/orcamentos/:id -> actualiza em memória
  http.put(`${ORCAMENTOS}/:id`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const index = budgetsFixtures.findIndex((b) => b.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Orçamento não encontrado." }, { status: 404 });
    }
    const payload = (await request.json().catch(() => ({}))) as Partial<BudgetDto>;
    const updated: BudgetDto = {
      ...budgetsFixtures[index],
      ...payload,
      year: payload.year !== undefined ? Number(payload.year) : budgetsFixtures[index].year,
      plannedAmount:
        payload.plannedAmount !== undefined
          ? Number(payload.plannedAmount)
          : budgetsFixtures[index].plannedAmount,
      id: budgetsFixtures[index].id,
      createdAt: budgetsFixtures[index].createdAt,
    };
    budgetsFixtures[index] = updated;
    return HttpResponse.json(updated);
  }),

  // DELETE /api/orcamentos/:id -> remove em memória
  http.delete(`${ORCAMENTOS}/:id`, ({ params }) => {
    const { id } = params as { id: string };
    const index = budgetsFixtures.findIndex((b) => b.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Orçamento não encontrado." }, { status: 404 });
    }
    budgetsFixtures.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];

export default financeiroHandlers;
