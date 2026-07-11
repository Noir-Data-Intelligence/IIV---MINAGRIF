/**
 * DTOs do módulo de Gestão Documental — contrato REST dos recursos `documentos`,
 * `document-categories`, versões, `document-links` e `document-permissions`.
 *
 * Espelham as tabelas Supabase originais (`documents`, `document_categories`,
 * `document_versions`, `document_links`, `document_permissions`) já convertidas
 * para camelCase, tal como o backend Laravel as devolverá via API Resources
 * (owner_id -> ownerId, expiry_date -> expiryDate, etc). A (de)serialização,
 * quando necessária, faz-se na camada de serviço.
 */

/** Estados do workflow de aprovação de um documento. */
export type DocStatus = "rascunho" | "submetido" | "aprovado" | "rejeitado" | "arquivado";

/** Visibilidade de um documento. */
export type DocVisibility = "publico" | "departamento" | "privado";

/** Categoria de documento (taxonomia simples com ícone e ordenação). */
export interface DocCategoryDto {
  id: string;
  name: string;
  icon: string | null;
  sortOrder: number;
}

/** Documento (metadados + estado de workflow). O ficheiro vive nas versões. */
export interface DocumentoDto {
  id: string;
  title: string;
  description: string | null;
  categoryId: string | null;
  ownerId: string;
  status: DocStatus;
  visibility: DocVisibility;
  expiryDate: string | null;
  tags: string[];
  currentVersionId: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Versão de ficheiro de um documento. */
export interface DocVersionDto {
  id: string;
  documentId: string;
  versionNumber: number;
  filePath: string;
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
  changeNotes: string | null;
  uploadedBy: string;
  createdAt: string;
}

/**
 * Ligação de um documento a uma entidade genérica do sistema (auditoria, lote,
 * não-conformidade, resultado, ...). Recurso separado do CRUD de documentos.
 * A resposta embute um resumo do documento ligado, para a UI listar sem N+1.
 */
export interface DocumentLinkDto {
  id: string;
  documentId: string;
  entityType: string;
  entityId: string;
  createdBy: string | null;
  createdAt: string;
  document: { id: string; title: string; currentVersionId: string | null } | null;
}

/**
 * Permissão granular sobre um documento, dirigida a um papel OU a um
 * departamento (mutuamente exclusivos). A resposta embute o nome do
 * departamento quando aplicável.
 */
export interface DocumentPermissionDto {
  id: string;
  documentId: string;
  role: string | null;
  departmentId: string | null;
  canEdit: boolean;
  department: { name: string } | null;
}

/** Parâmetros de listagem paginada/filtrada de documentos. */
export interface DocumentoListParams {
  page?: number;
  perPage?: number;
  search?: string;
  status?: string;
  categoryId?: string;
}

/** Payload de criação de versão (metadados do ficheiro simulado). */
export interface DocVersionPayload {
  filePath: string;
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
  changeNotes?: string | null;
  uploadedBy?: string;
}
