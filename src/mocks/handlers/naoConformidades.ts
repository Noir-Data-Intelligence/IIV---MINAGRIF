import { http, HttpResponse } from "msw";
import { naoConformidadesFixtures } from "@/mocks/fixtures/naoConformidades";
import { departamentosFixtures } from "@/mocks/fixtures/departamentos";
import { auditoriasFixtures } from "@/mocks/fixtures/auditorias";
import type { NaoConformidadeDto } from "@/types/dto/naoConformidade";
import type { Paginated } from "@/types/dto/paginated";

/**
 * Handlers MSW do módulo Não-Conformidades.
 *
 * Operam sobre `naoConformidadesFixtures` (array mutável em memória) —
 * create/update/delete persistem durante a sessão do browser (reset no refresh).
 * Replica a lógica de paginação/filtragem de `mocks/handlers/auditorias.ts`.
 *
 * Como uma API Resource do Laravel faria um join, o handler resolve
 * `departmentName`/`auditTitle` a partir das fixtures desses módulos e trata a
 * regra de negócio da data de resolução (`resolvedAt` preenchida quando o estado
 * passa a "resolvida"), mantendo a página/serviço a enviarem apenas os ids.
 */
const BASE = "*/api/nao-conformidades";

function departmentName(id: string | null | undefined): string | null {
  if (!id) return null;
  return departamentosFixtures.find((d) => d.id === id)?.name ?? null;
}

function auditTitle(id: string | null | undefined): string | null {
  if (!id) return null;
  return auditoriasFixtures.find((a) => a.id === id)?.title ?? null;
}

export const naoConformidadesHandlers = [
  // GET /api/nao-conformidades -> lista paginada + filtrada (severity/status/department_id/audit_id)
  http.get(BASE, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1") || 1;
    const perPage = Number(url.searchParams.get("per_page") ?? "20") || 20;
    const search = (url.searchParams.get("search") ?? "").trim().toLowerCase();
    const severity = (url.searchParams.get("severity") ?? "").trim();
    const status = (url.searchParams.get("status") ?? "").trim();
    const departmentId = (url.searchParams.get("department_id") ?? "").trim();
    const auditId = (url.searchParams.get("audit_id") ?? "").trim();

    // Ordenação por data de criação (mais recentes primeiro).
    let rows = [...naoConformidadesFixtures].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );

    if (search) {
      rows = rows.filter(
        (nc) =>
          nc.title.toLowerCase().includes(search) ||
          nc.description.toLowerCase().includes(search) ||
          (nc.departmentName ?? "").toLowerCase().includes(search),
      );
    }
    if (severity) rows = rows.filter((nc) => nc.severity === severity);
    if (status) rows = rows.filter((nc) => nc.status === status);
    if (departmentId) rows = rows.filter((nc) => nc.departmentId === departmentId);
    if (auditId) rows = rows.filter((nc) => nc.auditId === auditId);

    const total = rows.length;
    const lastPage = Math.max(1, Math.ceil(total / perPage));
    const start = (page - 1) * perPage;
    const data = rows.slice(start, start + perPage);

    const body: Paginated<NaoConformidadeDto> = {
      data,
      meta: { currentPage: page, perPage, total, lastPage },
    };
    return HttpResponse.json(body);
  }),

  // POST /api/nao-conformidades -> cria em memória
  http.post(BASE, async ({ request }) => {
    const payload = (await request.json().catch(() => ({}))) as Partial<NaoConformidadeDto>;
    const departmentId = payload.departmentId ?? null;
    const auditId = payload.auditId ?? null;
    const status = payload.status ?? "aberta";
    const created: NaoConformidadeDto = {
      id: `nc-${Date.now()}`,
      title: payload.title ?? "Sem título",
      description: payload.description ?? "",
      severity: payload.severity ?? "menor",
      status,
      correctiveAction: payload.correctiveAction ?? null,
      deadline: payload.deadline ?? null,
      resolvedAt: status === "resolvida" ? new Date().toISOString() : null,
      departmentId,
      auditId,
      departmentName: departmentName(departmentId),
      auditTitle: auditTitle(auditId),
      createdAt: new Date().toISOString(),
    };
    naoConformidadesFixtures.unshift(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  // PUT /api/nao-conformidades/:id -> actualiza em memória
  http.put(`${BASE}/:id`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const index = naoConformidadesFixtures.findIndex((nc) => nc.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Não-conformidade não encontrada." }, { status: 404 });
    }
    const existing = naoConformidadesFixtures[index];
    const payload = (await request.json().catch(() => ({}))) as Partial<NaoConformidadeDto>;

    const departmentId =
      payload.departmentId !== undefined ? payload.departmentId : existing.departmentId;
    const auditId = payload.auditId !== undefined ? payload.auditId : existing.auditId;
    const status = payload.status ?? existing.status;

    // Regra de negócio: ao passar para "resolvida" grava a data de resolução.
    let resolvedAt = payload.resolvedAt !== undefined ? payload.resolvedAt : existing.resolvedAt;
    if (status === "resolvida" && existing.status !== "resolvida" && !resolvedAt) {
      resolvedAt = new Date().toISOString();
    }

    const updated: NaoConformidadeDto = {
      ...existing,
      ...payload,
      status,
      resolvedAt,
      departmentId,
      auditId,
      departmentName: departmentName(departmentId),
      auditTitle: auditTitle(auditId),
      // id/createdAt são imutáveis pelo cliente.
      id: existing.id,
      createdAt: existing.createdAt,
    };
    naoConformidadesFixtures[index] = updated;
    return HttpResponse.json(updated);
  }),

  // DELETE /api/nao-conformidades/:id -> remove em memória
  http.delete(`${BASE}/:id`, ({ params }) => {
    const { id } = params as { id: string };
    const index = naoConformidadesFixtures.findIndex((nc) => nc.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Não-conformidade não encontrada." }, { status: 404 });
    }
    naoConformidadesFixtures.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];

export default naoConformidadesHandlers;
