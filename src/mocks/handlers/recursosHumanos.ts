import { http, HttpResponse } from "msw";
import {
  contractsFixtures,
  employeesFixtures,
  leavesFixtures,
} from "@/mocks/fixtures/recursosHumanos";
import type {
  ContractDto,
  EmployeeDto,
  LeaveDto,
} from "@/types/dto/recursosHumanos";
import type { Paginated } from "@/types/dto/paginated";

/**
 * Handlers MSW do módulo Recursos Humanos — recursos `colaboradores` (fichas de
 * pessoal), `contratos` (vínculos) e `ausencias` (férias/faltas/licenças).
 *
 * Operam sobre os arrays mutáveis de `fixtures/recursosHumanos.ts`, pelo que as
 * escritas PERSISTEM durante a sessão do browser (reset no refresh). Segue a
 * lógica de paginação/filtragem de `handlers/financeiro.ts`.
 *
 * A remoção de um colaborador arrasta (em cascata) os contratos e ausências que
 * o referem, mantendo a coerência do mock.
 */

const COLABORADORES = "*/api/rh/colaboradores";
const CONTRATOS = "*/api/rh/contratos";
const AUSENCIAS = "*/api/rh/ausencias";

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

/** Calcula o nº de dias (inclusivo) entre duas datas ISO (yyyy-mm-dd). */
function daysBetween(start: string, end: string): number {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (Number.isNaN(s) || Number.isNaN(e)) return 1;
  return Math.max(1, Math.round((e - s) / 86400000) + 1);
}

export const recursosHumanosHandlers = [
  // ======================= COLABORADORES =======================

  // GET /api/rh/colaboradores -> lista paginada + filtrada, ordenada por nome
  http.get(COLABORADORES, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1") || 1;
    const perPage = Number(url.searchParams.get("per_page") ?? "20") || 20;
    const search = (url.searchParams.get("search") ?? "").trim().toLowerCase();
    const departmentId = url.searchParams.get("department_id") ?? "";
    const isActive = url.searchParams.get("is_active");

    let rows = [...employeesFixtures].sort((a, b) => a.fullName.localeCompare(b.fullName));

    if (search) {
      rows = rows.filter(
        (e) =>
          e.fullName.toLowerCase().includes(search) ||
          e.employeeNumber.toLowerCase().includes(search) ||
          (e.email ?? "").toLowerCase().includes(search) ||
          (e.nationalId ?? "").toLowerCase().includes(search),
      );
    }
    if (departmentId) rows = rows.filter((e) => e.departmentId === departmentId);
    if (isActive !== null) rows = rows.filter((e) => e.isActive === (isActive === "true"));

    return HttpResponse.json(paginate(rows, page, perPage));
  }),

  // POST /api/rh/colaboradores -> cria em memória
  http.post(COLABORADORES, async ({ request }) => {
    const payload = (await request.json().catch(() => ({}))) as Partial<EmployeeDto>;
    const created: EmployeeDto = {
      id: `emp-${Date.now()}`,
      employeeNumber: payload.employeeNumber ?? "IIV-0000",
      fullName: payload.fullName ?? "Sem nome",
      nationalId: payload.nationalId ?? null,
      phone: payload.phone ?? null,
      email: payload.email ?? null,
      departmentId: payload.departmentId ?? null,
      hireDate: payload.hireDate ?? null,
      isActive: payload.isActive ?? true,
      qualifications: payload.qualifications ?? null,
      notes: payload.notes ?? null,
      createdAt: new Date().toISOString(),
    };
    employeesFixtures.unshift(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  // PUT /api/rh/colaboradores/:id -> actualiza em memória
  http.put(`${COLABORADORES}/:id`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const index = employeesFixtures.findIndex((e) => e.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Colaborador não encontrado." }, { status: 404 });
    }
    const payload = (await request.json().catch(() => ({}))) as Partial<EmployeeDto>;
    const updated: EmployeeDto = {
      ...employeesFixtures[index],
      ...payload,
      id: employeesFixtures[index].id,
      createdAt: employeesFixtures[index].createdAt,
    };
    employeesFixtures[index] = updated;
    return HttpResponse.json(updated);
  }),

  // DELETE /api/rh/colaboradores/:id -> remove colaborador + contratos/ausências dependentes
  http.delete(`${COLABORADORES}/:id`, ({ params }) => {
    const { id } = params as { id: string };
    const index = employeesFixtures.findIndex((e) => e.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Colaborador não encontrado." }, { status: 404 });
    }
    employeesFixtures.splice(index, 1);
    removeWhere(contractsFixtures, (c) => c.employeeId === id);
    removeWhere(leavesFixtures, (l) => l.employeeId === id);
    return new HttpResponse(null, { status: 204 });
  }),

  // ======================= CONTRATOS =======================

  // GET /api/rh/contratos -> lista paginada + filtrada, ordenada por início (desc)
  http.get(CONTRATOS, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1") || 1;
    const perPage = Number(url.searchParams.get("per_page") ?? "20") || 20;
    const search = (url.searchParams.get("search") ?? "").trim().toLowerCase();
    const employeeId = url.searchParams.get("employee_id") ?? "";
    const contractType = url.searchParams.get("contract_type") ?? "";
    const isActive = url.searchParams.get("is_active");

    let rows = [...contractsFixtures].sort((a, b) => b.startDate.localeCompare(a.startDate));

    if (search) {
      rows = rows.filter(
        (c) =>
          c.position.toLowerCase().includes(search) ||
          (c.notes ?? "").toLowerCase().includes(search),
      );
    }
    if (employeeId) rows = rows.filter((c) => c.employeeId === employeeId);
    if (contractType) rows = rows.filter((c) => c.contractType === contractType);
    if (isActive !== null) rows = rows.filter((c) => c.isActive === (isActive === "true"));

    return HttpResponse.json(paginate(rows, page, perPage));
  }),

  // POST /api/rh/contratos -> cria em memória
  http.post(CONTRATOS, async ({ request }) => {
    const payload = (await request.json().catch(() => ({}))) as Partial<ContractDto>;
    const created: ContractDto = {
      id: `con-${Date.now()}`,
      employeeId: payload.employeeId ?? "",
      contractType: payload.contractType ?? "efectivo",
      position: payload.position ?? "Sem cargo",
      startDate: payload.startDate ?? new Date().toISOString().slice(0, 10),
      endDate: payload.endDate ?? null,
      salary: Number(payload.salary ?? 0),
      currency: payload.currency ?? "AOA",
      isActive: payload.isActive ?? true,
      notes: payload.notes ?? null,
      createdAt: new Date().toISOString(),
    };
    contractsFixtures.unshift(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  // PUT /api/rh/contratos/:id -> actualiza em memória
  http.put(`${CONTRATOS}/:id`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const index = contractsFixtures.findIndex((c) => c.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Contrato não encontrado." }, { status: 404 });
    }
    const payload = (await request.json().catch(() => ({}))) as Partial<ContractDto>;
    const updated: ContractDto = {
      ...contractsFixtures[index],
      ...payload,
      salary: payload.salary !== undefined ? Number(payload.salary) : contractsFixtures[index].salary,
      id: contractsFixtures[index].id,
      createdAt: contractsFixtures[index].createdAt,
    };
    contractsFixtures[index] = updated;
    return HttpResponse.json(updated);
  }),

  // DELETE /api/rh/contratos/:id -> remove em memória
  http.delete(`${CONTRATOS}/:id`, ({ params }) => {
    const { id } = params as { id: string };
    const index = contractsFixtures.findIndex((c) => c.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Contrato não encontrado." }, { status: 404 });
    }
    contractsFixtures.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // ======================= AUSÊNCIAS =======================

  // GET /api/rh/ausencias -> lista paginada + filtrada, ordenada por início (desc)
  http.get(AUSENCIAS, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1") || 1;
    const perPage = Number(url.searchParams.get("per_page") ?? "20") || 20;
    const search = (url.searchParams.get("search") ?? "").trim().toLowerCase();
    const employeeId = url.searchParams.get("employee_id") ?? "";
    const leaveType = url.searchParams.get("leave_type") ?? "";
    const status = url.searchParams.get("status") ?? "";

    let rows = [...leavesFixtures].sort((a, b) => b.startDate.localeCompare(a.startDate));

    if (search) {
      rows = rows.filter((l) => (l.reason ?? "").toLowerCase().includes(search));
    }
    if (employeeId) rows = rows.filter((l) => l.employeeId === employeeId);
    if (leaveType) rows = rows.filter((l) => l.leaveType === leaveType);
    if (status) rows = rows.filter((l) => l.status === status);

    return HttpResponse.json(paginate(rows, page, perPage));
  }),

  // POST /api/rh/ausencias -> cria em memória (recalcula dias se não vier)
  http.post(AUSENCIAS, async ({ request }) => {
    const payload = (await request.json().catch(() => ({}))) as Partial<LeaveDto>;
    const startDate = payload.startDate ?? new Date().toISOString().slice(0, 10);
    const endDate = payload.endDate ?? startDate;
    const created: LeaveDto = {
      id: `lea-${Date.now()}`,
      employeeId: payload.employeeId ?? "",
      leaveType: payload.leaveType ?? "ferias",
      startDate,
      endDate,
      days: payload.days !== undefined ? Number(payload.days) : daysBetween(startDate, endDate),
      status: payload.status ?? "pendente",
      reason: payload.reason ?? null,
      createdAt: new Date().toISOString(),
    };
    leavesFixtures.unshift(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  // PUT /api/rh/ausencias/:id -> actualiza em memória (recalcula dias)
  http.put(`${AUSENCIAS}/:id`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const index = leavesFixtures.findIndex((l) => l.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Ausência não encontrada." }, { status: 404 });
    }
    const payload = (await request.json().catch(() => ({}))) as Partial<LeaveDto>;
    const startDate = payload.startDate ?? leavesFixtures[index].startDate;
    const endDate = payload.endDate ?? leavesFixtures[index].endDate;
    const updated: LeaveDto = {
      ...leavesFixtures[index],
      ...payload,
      startDate,
      endDate,
      days:
        payload.days !== undefined
          ? Number(payload.days)
          : daysBetween(startDate, endDate),
      id: leavesFixtures[index].id,
      createdAt: leavesFixtures[index].createdAt,
    };
    leavesFixtures[index] = updated;
    return HttpResponse.json(updated);
  }),

  // DELETE /api/rh/ausencias/:id -> remove em memória
  http.delete(`${AUSENCIAS}/:id`, ({ params }) => {
    const { id } = params as { id: string };
    const index = leavesFixtures.findIndex((l) => l.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Ausência não encontrada." }, { status: 404 });
    }
    leavesFixtures.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];

export default recursosHumanosHandlers;
