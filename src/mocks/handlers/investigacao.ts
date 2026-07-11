import { http, HttpResponse } from "msw";
import {
  linesFixtures,
  projectsFixtures,
  publicationsFixtures,
} from "@/mocks/fixtures/investigacao";
import type {
  InvestigacaoStats,
  LineDto,
  LineStatus,
  ProjectDto,
  ProjectStatus,
  PublicationDto,
  PublicationType,
} from "@/types/dto/investigacao";
import type { Paginated } from "@/types/dto/paginated";

/**
 * Handlers MSW do módulo Investigação (linhas de investigação, projectos de I&D
 * e publicações + KPIs agregados em `/stats`).
 *
 * Cada recurso replica a lógica de paginação/filtragem de `handlers/missoes.ts`
 * e opera sobre os arrays mutáveis em memória de `fixtures/investigacao.ts`, pelo
 * que create/update/delete PERSISTEM durante a sessão do browser (reset no
 * refresh). As rotas mais específicas (`/stats`) são registadas antes das listas.
 *
 * Paths com wildcard `*` inicial (padrão MSW) para casar independentemente da
 * baseURL exacta configurada em http.ts.
 */
const BASE = "*/api/investigacao";

// --- Helpers ----------------------------------------------------------------

function paginate<T>(rows: T[], page: number, perPage: number): Paginated<T> {
  const total = rows.length;
  const lastPage = Math.max(1, Math.ceil(total / perPage));
  const start = (page - 1) * perPage;
  return {
    data: rows.slice(start, start + perPage),
    meta: { currentPage: page, perPage, total, lastPage },
  };
}

export const investigacaoHandlers = [
  // GET /investigacao/stats -> KPIs agregados
  http.get(`${BASE}/stats`, () => {
    const activeProjects = projectsFixtures.filter(
      (p) => p.status === "em_curso" || p.status === "aprovado",
    ).length;
    const totalFunding = projectsFixtures
      .filter((p) => p.status !== "cancelado")
      .reduce((sum, p) => sum + Number(p.fundingAmount || 0), 0);
    const body: InvestigacaoStats = {
      totalLines: linesFixtures.length,
      activeProjects,
      totalPublications: publicationsFixtures.length,
      totalFunding,
    };
    return HttpResponse.json(body);
  }),

  // --- Linhas de investigação ----------------------------------------------

  // GET /investigacao/linhas -> lista paginada + filtrada, ordenada por nome
  http.get(`${BASE}/linhas`, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1") || 1;
    const perPage = Number(url.searchParams.get("per_page") ?? "20") || 20;
    const search = (url.searchParams.get("search") ?? "").trim().toLowerCase();
    const status = url.searchParams.get("status") ?? "";

    let rows = [...linesFixtures].sort((a, b) => a.name.localeCompare(b.name));
    if (status) rows = rows.filter((l) => l.status === status);
    if (search) {
      rows = rows.filter(
        (l) =>
          l.name.toLowerCase().includes(search) ||
          (l.area ?? "").toLowerCase().includes(search) ||
          (l.description ?? "").toLowerCase().includes(search),
      );
    }
    return HttpResponse.json(paginate(rows, page, perPage));
  }),

  // POST /investigacao/linhas -> cria em memória
  http.post(`${BASE}/linhas`, async ({ request }) => {
    const payload = (await request.json().catch(() => ({}))) as Partial<LineDto>;
    const created: LineDto = {
      id: `lin-${Date.now()}`,
      name: payload.name ?? "Sem nome",
      area: payload.area ?? null,
      description: payload.description ?? null,
      status: (payload.status as LineStatus) ?? "activa",
      createdBy: payload.createdBy ?? null,
      createdAt: new Date().toISOString(),
    };
    linesFixtures.unshift(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  // PUT /investigacao/linhas/:id -> actualiza em memória
  http.put(`${BASE}/linhas/:id`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const index = linesFixtures.findIndex((l) => l.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Linha não encontrada." }, { status: 404 });
    }
    const payload = (await request.json().catch(() => ({}))) as Partial<LineDto>;
    const updated: LineDto = {
      ...linesFixtures[index],
      ...payload,
      id: linesFixtures[index].id,
      createdAt: linesFixtures[index].createdAt,
    };
    linesFixtures[index] = updated;
    return HttpResponse.json(updated);
  }),

  // DELETE /investigacao/linhas/:id -> remove e desassocia projectos
  http.delete(`${BASE}/linhas/:id`, ({ params }) => {
    const { id } = params as { id: string };
    const index = linesFixtures.findIndex((l) => l.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Linha não encontrada." }, { status: 404 });
    }
    linesFixtures.splice(index, 1);
    // Desassocia (não apaga) os projectos que apontavam para esta linha.
    for (const p of projectsFixtures) {
      if (p.lineId === id) p.lineId = null;
    }
    return new HttpResponse(null, { status: 204 });
  }),

  // --- Projectos de I&D ----------------------------------------------------

  // GET /investigacao/projectos -> lista paginada + filtrada, mais recente primeiro
  http.get(`${BASE}/projectos`, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1") || 1;
    const perPage = Number(url.searchParams.get("per_page") ?? "20") || 20;
    const search = (url.searchParams.get("search") ?? "").trim().toLowerCase();
    const status = url.searchParams.get("status") ?? "";
    const lineId = url.searchParams.get("line_id") ?? "";

    let rows = [...projectsFixtures].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (status) rows = rows.filter((p) => p.status === status);
    if (lineId) rows = rows.filter((p) => p.lineId === lineId);
    if (search) {
      rows = rows.filter(
        (p) =>
          p.title.toLowerCase().includes(search) ||
          (p.objectives ?? "").toLowerCase().includes(search) ||
          (p.fundingSource ?? "").toLowerCase().includes(search) ||
          (p.partners ?? "").toLowerCase().includes(search),
      );
    }
    return HttpResponse.json(paginate(rows, page, perPage));
  }),

  // POST /investigacao/projectos -> cria em memória
  http.post(`${BASE}/projectos`, async ({ request }) => {
    const payload = (await request.json().catch(() => ({}))) as Partial<ProjectDto>;
    const created: ProjectDto = {
      id: `prj-${Date.now()}`,
      lineId: payload.lineId ?? null,
      title: payload.title ?? "Sem título",
      objectives: payload.objectives ?? null,
      status: (payload.status as ProjectStatus) ?? "proposto",
      startDate: payload.startDate ?? null,
      endDate: payload.endDate ?? null,
      fundingSource: payload.fundingSource ?? null,
      fundingAmount: payload.fundingAmount ?? null,
      currency: payload.currency ?? "AOA",
      partners: payload.partners ?? null,
      createdBy: payload.createdBy ?? null,
      createdAt: new Date().toISOString(),
    };
    projectsFixtures.unshift(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  // PUT /investigacao/projectos/:id -> actualiza em memória
  http.put(`${BASE}/projectos/:id`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const index = projectsFixtures.findIndex((p) => p.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Projecto não encontrado." }, { status: 404 });
    }
    const payload = (await request.json().catch(() => ({}))) as Partial<ProjectDto>;
    const updated: ProjectDto = {
      ...projectsFixtures[index],
      ...payload,
      id: projectsFixtures[index].id,
      createdAt: projectsFixtures[index].createdAt,
    };
    projectsFixtures[index] = updated;
    return HttpResponse.json(updated);
  }),

  // DELETE /investigacao/projectos/:id -> remove e desassocia publicações
  http.delete(`${BASE}/projectos/:id`, ({ params }) => {
    const { id } = params as { id: string };
    const index = projectsFixtures.findIndex((p) => p.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Projecto não encontrado." }, { status: 404 });
    }
    projectsFixtures.splice(index, 1);
    for (const pub of publicationsFixtures) {
      if (pub.projectId === id) pub.projectId = null;
    }
    return new HttpResponse(null, { status: 204 });
  }),

  // --- Publicações ---------------------------------------------------------

  // GET /investigacao/publicacoes -> lista paginada + filtrada, ano desc
  http.get(`${BASE}/publicacoes`, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1") || 1;
    const perPage = Number(url.searchParams.get("per_page") ?? "20") || 20;
    const search = (url.searchParams.get("search") ?? "").trim().toLowerCase();
    const type = url.searchParams.get("type") ?? "";
    const year = url.searchParams.get("year") ?? "";
    const projectId = url.searchParams.get("project_id") ?? "";

    let rows = [...publicationsFixtures].sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
    if (type) rows = rows.filter((p) => p.type === type);
    if (year) rows = rows.filter((p) => p.year === Number(year));
    if (projectId) rows = rows.filter((p) => p.projectId === projectId);
    if (search) {
      rows = rows.filter(
        (p) =>
          p.title.toLowerCase().includes(search) ||
          (p.venue ?? "").toLowerCase().includes(search) ||
          (p.doi ?? "").toLowerCase().includes(search) ||
          p.authors.some((a) => a.toLowerCase().includes(search)),
      );
    }
    return HttpResponse.json(paginate(rows, page, perPage));
  }),

  // POST /investigacao/publicacoes -> cria em memória
  http.post(`${BASE}/publicacoes`, async ({ request }) => {
    const payload = (await request.json().catch(() => ({}))) as Partial<PublicationDto>;
    const created: PublicationDto = {
      id: `pub-${Date.now()}`,
      projectId: payload.projectId ?? null,
      type: (payload.type as PublicationType) ?? "artigo",
      title: payload.title ?? "Sem título",
      authors: Array.isArray(payload.authors) ? payload.authors : [],
      year: payload.year ?? null,
      venue: payload.venue ?? null,
      doi: payload.doi ?? null,
      url: payload.url ?? null,
      createdBy: payload.createdBy ?? null,
      createdAt: new Date().toISOString(),
    };
    publicationsFixtures.unshift(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  // PUT /investigacao/publicacoes/:id -> actualiza em memória
  http.put(`${BASE}/publicacoes/:id`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const index = publicationsFixtures.findIndex((p) => p.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Publicação não encontrada." }, { status: 404 });
    }
    const payload = (await request.json().catch(() => ({}))) as Partial<PublicationDto>;
    const updated: PublicationDto = {
      ...publicationsFixtures[index],
      ...payload,
      authors: Array.isArray(payload.authors) ? payload.authors : publicationsFixtures[index].authors,
      id: publicationsFixtures[index].id,
      createdAt: publicationsFixtures[index].createdAt,
    };
    publicationsFixtures[index] = updated;
    return HttpResponse.json(updated);
  }),

  // DELETE /investigacao/publicacoes/:id -> remove em memória
  http.delete(`${BASE}/publicacoes/:id`, ({ params }) => {
    const { id } = params as { id: string };
    const index = publicationsFixtures.findIndex((p) => p.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Publicação não encontrada." }, { status: 404 });
    }
    publicationsFixtures.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];

export default investigacaoHandlers;
