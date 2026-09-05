import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createDocumento,
  createDocumentCategory,
  createDocumentLink,
  createDocumentPermission,
  createDocVersion,
  deleteDocumento,
  deleteDocumentCategory,
  deleteDocumentLink,
  deleteDocumentPermission,
  listDocumentCategories,
  listDocumentLinks,
  listDocumentPermissions,
  listDocumentos,
  listDocVersions,
  updateDocumento,
  updateDocumentCategory,
} from "@/services/api/documentos";
import type {
  DocCategoryDto,
  DocumentoDto,
  DocumentoListParams,
  DocVersionPayload,
} from "@/types/dto/documento";

/**
 * Hooks react-query do módulo de Gestão Documental.
 *
 * Segue o padrão de `useDepartamentos.ts`, com fábricas de query keys
 * hierárquicas por recurso (documentos, categorias, versões, ligações,
 * permissões) para invalidação precisa.
 */

export const documentoKeys = {
  all: ["documentos"] as const,
  lists: () => [...documentoKeys.all, "list"] as const,
  list: (params: DocumentoListParams) => [...documentoKeys.lists(), params] as const,
  details: () => [...documentoKeys.all, "detail"] as const,
  detail: (id: string) => [...documentoKeys.details(), id] as const,
  categories: () => [...documentoKeys.all, "categories"] as const,
  versions: (documentId: string) => [...documentoKeys.all, "versions", documentId] as const,
};

export const documentLinkKeys = {
  all: ["document-links"] as const,
  list: (entityType: string, entityId: string) =>
    [...documentLinkKeys.all, entityType, entityId] as const,
};

export const documentPermissionKeys = {
  all: ["document-permissions"] as const,
  list: (documentId: string) => [...documentPermissionKeys.all, documentId] as const,
};

// --- Documentos ------------------------------------------------------------

export function useDocumentosList(params: DocumentoListParams) {
  return useQuery({
    queryKey: documentoKeys.list(params),
    queryFn: () => listDocumentos(params),
  });
}

export function useDocumentCategories() {
  return useQuery({
    queryKey: documentoKeys.categories(),
    queryFn: () => listDocumentCategories(),
  });
}

export function useCreateDocumentCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<DocCategoryDto>) => createDocumentCategory(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentoKeys.categories() });
    },
  });
}

export function useUpdateDocumentCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<DocCategoryDto> }) =>
      updateDocumentCategory(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentoKeys.categories() });
    },
  });
}

export function useDeleteDocumentCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDocumentCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentoKeys.categories() });
    },
  });
}

export function useCreateDocumento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<DocumentoDto>) => createDocumento(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentoKeys.lists() });
    },
  });
}

export function useUpdateDocumento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<DocumentoDto> }) =>
      updateDocumento(id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: documentoKeys.lists() });
      queryClient.invalidateQueries({ queryKey: documentoKeys.detail(updated.id) });
    },
  });
}

export function useDeleteDocumento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDocumento(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentoKeys.lists() });
    },
  });
}

// --- Versões ---------------------------------------------------------------

export function useDocVersions(documentId: string | null) {
  return useQuery({
    queryKey: documentoKeys.versions(documentId ?? "none"),
    queryFn: () => listDocVersions(documentId as string),
    enabled: !!documentId,
  });
}

export function useCreateDocVersion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ documentId, payload }: { documentId: string; payload: DocVersionPayload }) =>
      createDocVersion(documentId, payload),
    onSuccess: (_data, { documentId }) => {
      queryClient.invalidateQueries({ queryKey: documentoKeys.versions(documentId) });
      // Uma nova versão altera o documento (currentVersionId/status/updatedAt).
      queryClient.invalidateQueries({ queryKey: documentoKeys.lists() });
    },
  });
}

// --- Ligações a entidades (document-links) --------------------------------

export function useDocumentLinks(entityType: string, entityId: string) {
  return useQuery({
    queryKey: documentLinkKeys.list(entityType, entityId),
    queryFn: () => listDocumentLinks(entityType, entityId),
    enabled: !!entityType && !!entityId,
  });
}

export function useCreateDocumentLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { documentId: string; entityType: string; entityId: string }) =>
      createDocumentLink(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: documentLinkKeys.list(variables.entityType, variables.entityId),
      });
    },
  });
}

export function useDeleteDocumentLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; entityType: string; entityId: string }) =>
      deleteDocumentLink(vars.id),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: documentLinkKeys.list(variables.entityType, variables.entityId),
      });
    },
  });
}

// --- Permissões granulares (document-permissions) -------------------------

export function useDocumentPermissions(documentId: string) {
  return useQuery({
    queryKey: documentPermissionKeys.list(documentId),
    queryFn: () => listDocumentPermissions(documentId),
    enabled: !!documentId,
  });
}

export function useCreateDocumentPermission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      documentId: string;
      role?: string | null;
      departmentId?: string | null;
      canEdit: boolean;
    }) => createDocumentPermission(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: documentPermissionKeys.list(variables.documentId) });
    },
  });
}

export function useDeleteDocumentPermission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; documentId: string }) => deleteDocumentPermission(vars.id),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: documentPermissionKeys.list(variables.documentId) });
    },
  });
}
