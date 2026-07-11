/**
 * DTOs do módulo Investigação — contrato REST de um domínio coeso de 3 recursos:
 *
 *  - `LineDto`        — linha de investigação (área temática do instituto)
 *  - `ProjectDto`     — projecto de I&D (`lineId` -> `LineDto`, opcional)
 *  - `PublicationDto` — produção científica (`projectId` -> `ProjectDto`, opcional)
 *
 * Espelham as tabelas Supabase originais (`research_lines`, `research_projects`,
 * `publications`) já convertidas para camelCase, tal como o backend Laravel as
 * devolverá via API Resources (line_id -> lineId, funding_source -> fundingSource,
 * start_date -> startDate, etc.).
 *
 * Por serem um domínio fortemente relacionado e geridos na mesma página (em Tabs),
 * agrupam-se num único ficheiro por camada — mantendo, ainda assim, schemas/params
 * separados por entidade. Segue o padrão de `missoes.ts`/`financeiro.ts`.
 */

/** Estado de uma linha de investigação. */
export type LineStatus = "activa" | "suspensa" | "concluida";

/** Estado de um projecto de I&D no seu ciclo de vida. */
export type ProjectStatus =
  | "proposto"
  | "aprovado"
  | "em_curso"
  | "concluido"
  | "cancelado";

/** Tipologia de uma publicação científica. */
export type PublicationType =
  | "artigo"
  | "comunicacao"
  | "livro"
  | "tese"
  | "relatorio";

// --- Linha de investigação --------------------------------------------------

export interface LineDto {
  id: string;
  name: string;
  area: string | null;
  description: string | null;
  status: LineStatus;
  createdBy: string | null;
  createdAt: string;
}

// --- Projecto de I&D --------------------------------------------------------

export interface ProjectDto {
  id: string;
  lineId: string | null;
  title: string;
  objectives: string | null;
  status: ProjectStatus;
  startDate: string | null;
  endDate: string | null;
  fundingSource: string | null;
  fundingAmount: number | null;
  currency: string;
  partners: string | null;
  createdBy: string | null;
  createdAt: string;
}

// --- Publicação -------------------------------------------------------------

export interface PublicationDto {
  id: string;
  projectId: string | null;
  type: PublicationType;
  title: string;
  /** Lista de autores (array JSON no backend). */
  authors: string[];
  year: number | null;
  venue: string | null;
  doi: string | null;
  url: string | null;
  createdBy: string | null;
  createdAt: string;
}

// --- KPIs -------------------------------------------------------------------

/** Agregados devolvidos por `GET /investigacao/stats`. */
export interface InvestigacaoStats {
  totalLines: number;
  activeProjects: number;
  totalPublications: number;
  totalFunding: number;
}

// --- Parâmetros de listagem -------------------------------------------------

export interface LineListParams {
  page?: number;
  perPage?: number;
  search?: string;
  status?: LineStatus;
}

export interface ProjectListParams {
  page?: number;
  perPage?: number;
  search?: string;
  status?: ProjectStatus;
  lineId?: string;
}

export interface PublicationListParams {
  page?: number;
  perPage?: number;
  search?: string;
  type?: PublicationType;
  year?: number;
  projectId?: string;
}
