import { apiDelete, apiGet, apiPost, apiPut } from "@/services/api/client";
import type { Paginated } from "@/types/dto/paginated";
import type {
  InvestigacaoStats,
  LineDto,
  LineListParams,
  ProjectDto,
  ProjectListParams,
  PublicationDto,
  PublicationListParams,
} from "@/types/dto/investigacao";

/**
 * Serviço de dados do módulo Investigação.
 *
 * Cobre as 3 entidades do domínio (linhas de investigação, projectos de I&D e
 * publicações) mais um endpoint de KPIs agregados (`/stats`).
 *
 * Rotas declaradas localmente (ver nota em `missoes.ts`/`financeiro.ts`) para
 * não colidir com edições paralelas de `endpoints.ts` — consolidar na entrada
 * `investigacao` desse ficheiro no final. Assenta nos helpers de `client.ts` e
 * nunca conhece o axios nem o MSW directamente.
 */
const ROUTES = {
  stats: "/investigacao/stats",
  lines: "/investigacao/linhas",
  line: (id: string) => `/investigacao/linhas/${id}`,
  projects: "/investigacao/projectos",
  project: (id: string) => `/investigacao/projectos/${id}`,
  publications: "/investigacao/publicacoes",
  publication: (id: string) => `/investigacao/publicacoes/${id}`,
};

// --- KPIs -------------------------------------------------------------------

export function getInvestigacaoStats(): Promise<InvestigacaoStats> {
  return apiGet<InvestigacaoStats>(ROUTES.stats);
}

// --- Linhas de investigação -------------------------------------------------

function lineQuery(params: LineListParams): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {
    page: params.page ?? 1,
    per_page: params.perPage ?? 20,
  };
  if (params.search) query.search = params.search;
  if (params.status) query.status = params.status;
  return query;
}

export function listLines(params: LineListParams): Promise<Paginated<LineDto>> {
  return apiGet<Paginated<LineDto>>(ROUTES.lines, { params: lineQuery(params) });
}

export function createLine(payload: Partial<LineDto>): Promise<LineDto> {
  return apiPost<LineDto>(ROUTES.lines, payload);
}

export function updateLine(id: string, payload: Partial<LineDto>): Promise<LineDto> {
  return apiPut<LineDto>(ROUTES.line(id), payload);
}

export function deleteLine(id: string): Promise<void> {
  return apiDelete<void>(ROUTES.line(id));
}

// --- Projectos de I&D -------------------------------------------------------

function projectQuery(params: ProjectListParams): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {
    page: params.page ?? 1,
    per_page: params.perPage ?? 20,
  };
  if (params.search) query.search = params.search;
  if (params.status) query.status = params.status;
  if (params.lineId) query.line_id = params.lineId;
  return query;
}

export function listProjects(params: ProjectListParams): Promise<Paginated<ProjectDto>> {
  return apiGet<Paginated<ProjectDto>>(ROUTES.projects, { params: projectQuery(params) });
}

export function createProject(payload: Partial<ProjectDto>): Promise<ProjectDto> {
  return apiPost<ProjectDto>(ROUTES.projects, payload);
}

export function updateProject(id: string, payload: Partial<ProjectDto>): Promise<ProjectDto> {
  return apiPut<ProjectDto>(ROUTES.project(id), payload);
}

export function deleteProject(id: string): Promise<void> {
  return apiDelete<void>(ROUTES.project(id));
}

// --- Publicações ------------------------------------------------------------

function publicationQuery(params: PublicationListParams): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {
    page: params.page ?? 1,
    per_page: params.perPage ?? 20,
  };
  if (params.search) query.search = params.search;
  if (params.type) query.type = params.type;
  if (params.year) query.year = params.year;
  if (params.projectId) query.project_id = params.projectId;
  return query;
}

export function listPublications(params: PublicationListParams): Promise<Paginated<PublicationDto>> {
  return apiGet<Paginated<PublicationDto>>(ROUTES.publications, { params: publicationQuery(params) });
}

export function createPublication(payload: Partial<PublicationDto>): Promise<PublicationDto> {
  return apiPost<PublicationDto>(ROUTES.publications, payload);
}

export function updatePublication(id: string, payload: Partial<PublicationDto>): Promise<PublicationDto> {
  return apiPut<PublicationDto>(ROUTES.publication(id), payload);
}

export function deletePublication(id: string): Promise<void> {
  return apiDelete<void>(ROUTES.publication(id));
}
