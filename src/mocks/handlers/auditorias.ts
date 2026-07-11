import { http, HttpResponse } from "msw";
import { auditoriasFixtures } from "@/mocks/fixtures/auditorias";
import { departamentosFixtures } from "@/mocks/fixtures/departamentos";
import { laboratoriosFixtures } from "@/mocks/fixtures/laboratorios";
import type { AuditoriaDto } from "@/types/dto/auditoria";
import type { Paginated } from "@/types/dto/paginated";

/**
 * Handlers MSW do módulo Auditorias.
 *
 * Operam sobre `auditoriasFixtures` (array mutável em memória) — create/update/delete
 * persistem durante a sessão do browser (reset no refresh). Replica a lógica de
 * paginação/filtragem de `mocks/handlers/departamentos.ts`.
 *
 * Como uma API Resource do Laravel faria um join, o handler resolve
 * `departmentName`/`laboratoryName` a partir das fixtures desses módulos e trata a
 * regra de negócio da data de conclusão (preenchida quando o estado passa a
 * "concluida"), mantendo a página/serviço a enviarem apenas os ids.
 */
const BASE = "*/api/auditorias";

function departmentName(id: string | null | undefined): string | null {
  if (!id) return null;
  return departamentosFixtures.find((d) => d.id === id)?.name ?? null;
}

function laboratoryName(id: string | null | undefined): string | null {
  if (!id) return null;
  return laboratoriosFixtures.find((l) => l.id === id)?.name ?? null;
}

export const auditoriasHandlers = [
  // GET /api/auditorias -> lista paginada + filtrada, ordenada por data agendada (desc)
  http.get(BASE, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1") || 1;
    const perPage = Number(url.searchParams.get("per_page") ?? "20") || 20;
    const search = (url.searchParams.get("search") ?? "").trim().toLowerCase();

    let rows = [...auditoriasFixtures].sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate));

    if (search) {
      rows = rows.filter(
        (a) =>
          a.title.toLowerCase().includes(search) ||
          a.auditor.toLowerCase().includes(search) ||
          (a.departmentName ?? "").toLowerCase().includes(search),
      );
    }

    const total = rows.length;
    const lastPage = Math.max(1, Math.ceil(total / perPage));
    const start = (page - 1) * perPage;
    const data = rows.slice(start, start + perPage);

    const body: Paginated<AuditoriaDto> = {
      data,
      meta: { currentPage: page, perPage, total, lastPage },
    };
    return HttpResponse.json(body);
  }),

  // POST /api/auditorias -> cria em memória
  http.post(BASE, async ({ request }) => {
    const payload = (await request.json().catch(() => ({}))) as Partial<AuditoriaDto>;
    const departmentId = payload.departmentId ?? null;
    const laboratoryId = payload.laboratoryId ?? null;
    const status = payload.status ?? "planeada";
    const created: AuditoriaDto = {
      id: `aud-${Date.now()}`,
      title: payload.title ?? "Sem título",
      auditType: payload.auditType ?? "interna",
      auditor: payload.auditor ?? "",
      scheduledDate: payload.scheduledDate ?? new Date().toISOString().split("T")[0],
      completedDate: status === "concluida" ? new Date().toISOString().split("T")[0] : null,
      status,
      findings: payload.findings ?? null,
      recommendations: payload.recommendations ?? null,
      departmentId,
      laboratoryId,
      departmentName: departmentName(departmentId),
      laboratoryName: laboratoryName(laboratoryId),
      createdAt: new Date().toISOString(),
    };
    auditoriasFixtures.unshift(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  // PUT /api/auditorias/:id -> actualiza em memória
  http.put(`${BASE}/:id`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const index = auditoriasFixtures.findIndex((a) => a.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Auditoria não encontrada." }, { status: 404 });
    }
    const existing = auditoriasFixtures[index];
    const payload = (await request.json().catch(() => ({}))) as Partial<AuditoriaDto>;

    const departmentId = payload.departmentId !== undefined ? payload.departmentId : existing.departmentId;
    const laboratoryId = payload.laboratoryId !== undefined ? payload.laboratoryId : existing.laboratoryId;
    const status = payload.status ?? existing.status;

    // Regra de negócio: ao passar para "concluida" grava a data de conclusão.
    let completedDate = payload.completedDate !== undefined ? payload.completedDate : existing.completedDate;
    if (status === "concluida" && existing.status !== "concluida" && !completedDate) {
      completedDate = new Date().toISOString().split("T")[0];
    }

    const updated: AuditoriaDto = {
      ...existing,
      ...payload,
      status,
      completedDate,
      departmentId,
      laboratoryId,
      departmentName: departmentName(departmentId),
      laboratoryName: laboratoryName(laboratoryId),
      // id/createdAt são imutáveis pelo cliente.
      id: existing.id,
      createdAt: existing.createdAt,
    };
    auditoriasFixtures[index] = updated;
    return HttpResponse.json(updated);
  }),

  // DELETE /api/auditorias/:id -> remove em memória
  http.delete(`${BASE}/:id`, ({ params }) => {
    const { id } = params as { id: string };
    const index = auditoriasFixtures.findIndex((a) => a.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Auditoria não encontrada." }, { status: 404 });
    }
    auditoriasFixtures.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];

export default auditoriasHandlers;
