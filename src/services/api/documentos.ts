import { apiDelete, apiGet, apiPost, apiPut } from "@/services/api/client";
import type { Paginated } from "@/types/dto/paginated";
import type {
  DocCategoryDto,
  DocumentoDto,
  DocumentoListParams,
  DocVersionDto,
  DocVersionPayload,
  DocumentLinkDto,
  DocumentPermissionDto,
} from "@/types/dto/documento";

/**
 * Serviço de dados do módulo de Gestão Documental.
 *
 * Cobre 4 recursos relacionados: `documentos` (CRUD + workflow de estado),
 * as suas `versions`, `document-categories`, `document-links` (anexos a
 * entidades genéricas) e `document-permissions` (permissões granulares).
 *
 * Rotas declaradas localmente (ver nota em `resultados.ts`) — consolidar em
 * `endpoints.ts` (entradas `documentos`, `documentCategories`, `documentLinks`,
 * `documentPermissions`).
 */
const ROUTES = {
  list: "/documentos",
  detail: (id: string) => `/documentos/${id}`,
  versions: (id: string) => `/documentos/${id}/versions`,
  categories: "/document-categories",
  links: "/document-links",
  link: (id: string) => `/document-links/${id}`,
  permissions: "/document-permissions",
  permission: (id: string) => `/document-permissions/${id}`,
};

/** Converte `DocumentoListParams` em query params REST (snake_case p/ Laravel). */
function toQuery(params: DocumentoListParams): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {
    page: params.page ?? 1,
    per_page: params.perPage ?? 20,
  };
  if (params.search) query.search = params.search;
  if (params.status) query.status = params.status;
  if (params.categoryId) query.category_id = params.categoryId;
  return query;
}

// --- Documentos (CRUD + workflow) -----------------------------------------

export function listDocumentos(params: DocumentoListParams): Promise<Paginated<DocumentoDto>> {
  return apiGet<Paginated<DocumentoDto>>(ROUTES.list, { params: toQuery(params) });
}

export function getDocumento(id: string): Promise<DocumentoDto> {
  return apiGet<DocumentoDto>(ROUTES.detail(id));
}

export function createDocumento(payload: Partial<DocumentoDto>): Promise<DocumentoDto> {
  return apiPost<DocumentoDto>(ROUTES.list, payload);
}

export function updateDocumento(id: string, payload: Partial<DocumentoDto>): Promise<DocumentoDto> {
  return apiPut<DocumentoDto>(ROUTES.detail(id), payload);
}

export function deleteDocumento(id: string): Promise<void> {
  return apiDelete<void>(ROUTES.detail(id));
}

// --- Categorias ------------------------------------------------------------

export function listDocumentCategories(): Promise<DocCategoryDto[]> {
  return apiGet<DocCategoryDto[]>(ROUTES.categories);
}

// --- Versões ---------------------------------------------------------------

export function listDocVersions(documentId: string): Promise<DocVersionDto[]> {
  return apiGet<DocVersionDto[]>(ROUTES.versions(documentId));
}

export function createDocVersion(documentId: string, payload: DocVersionPayload): Promise<DocVersionDto> {
  return apiPost<DocVersionDto>(ROUTES.versions(documentId), payload);
}

// --- Ligações a entidades (document-links) --------------------------------

export function listDocumentLinks(entityType: string, entityId: string): Promise<DocumentLinkDto[]> {
  return apiGet<DocumentLinkDto[]>(ROUTES.links, {
    params: { entity_type: entityType, entity_id: entityId },
  });
}

export function createDocumentLink(payload: {
  documentId: string;
  entityType: string;
  entityId: string;
}): Promise<DocumentLinkDto> {
  return apiPost<DocumentLinkDto>(ROUTES.links, payload);
}

export function deleteDocumentLink(id: string): Promise<void> {
  return apiDelete<void>(ROUTES.link(id));
}

// --- Permissões granulares (document-permissions) -------------------------

export function listDocumentPermissions(documentId: string): Promise<DocumentPermissionDto[]> {
  return apiGet<DocumentPermissionDto[]>(ROUTES.permissions, {
    params: { document_id: documentId },
  });
}

export function createDocumentPermission(payload: {
  documentId: string;
  role?: string | null;
  departmentId?: string | null;
  canEdit: boolean;
}): Promise<DocumentPermissionDto> {
  return apiPost<DocumentPermissionDto>(ROUTES.permissions, payload);
}

export function deleteDocumentPermission(id: string): Promise<void> {
  return apiDelete<void>(ROUTES.permission(id));
}
