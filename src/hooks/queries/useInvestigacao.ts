import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createLine,
  createProject,
  createPublication,
  deleteLine,
  deleteProject,
  deletePublication,
  getInvestigacaoStats,
  listLines,
  listProjects,
  listPublications,
  updateLine,
  updateProject,
  updatePublication,
} from "@/services/api/investigacao";
import type {
  LineDto,
  LineListParams,
  ProjectDto,
  ProjectListParams,
  PublicationDto,
  PublicationListParams,
} from "@/types/dto/investigacao";

/**
 * Hooks react-query do módulo Investigação.
 *
 * `investigacaoKeys` organiza query keys hierárquicas por sub-recurso
 * (`linhas`/`projectos`/`publicacoes`) mais uma chave `stats` (KPIs). Cada
 * mutation invalida a sua lista + os `stats` (que dependem das 3 entidades).
 *
 * NOTA (para o módulo BI): `useProjectsList` e `usePublicationsList` são os
 * pontos de entrada de leitura reutilizáveis para agregações — passam um
 * `perPage` grande para trazer o conjunto completo.
 */
export const investigacaoKeys = {
  all: ["investigacao"] as const,
  stats: () => [...investigacaoKeys.all, "stats"] as const,
  lines: {
    all: () => [...investigacaoKeys.all, "linhas"] as const,
    list: (params: LineListParams) => [...investigacaoKeys.all, "linhas", "list", params] as const,
  },
  projects: {
    all: () => [...investigacaoKeys.all, "projectos"] as const,
    list: (params: ProjectListParams) => [...investigacaoKeys.all, "projectos", "list", params] as const,
  },
  publications: {
    all: () => [...investigacaoKeys.all, "publicacoes"] as const,
    list: (params: PublicationListParams) =>
      [...investigacaoKeys.all, "publicacoes", "list", params] as const,
  },
};

// --- KPIs -------------------------------------------------------------------

export function useInvestigacaoStats() {
  return useQuery({
    queryKey: investigacaoKeys.stats(),
    queryFn: () => getInvestigacaoStats(),
  });
}

// --- Linhas de investigação -------------------------------------------------

export function useLinesList(params: LineListParams) {
  return useQuery({
    queryKey: investigacaoKeys.lines.list(params),
    queryFn: () => listLines(params),
  });
}

export function useCreateLine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<LineDto>) => createLine(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: investigacaoKeys.lines.all() });
      queryClient.invalidateQueries({ queryKey: investigacaoKeys.stats() });
    },
  });
}

export function useUpdateLine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<LineDto> }) => updateLine(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: investigacaoKeys.lines.all() });
      queryClient.invalidateQueries({ queryKey: investigacaoKeys.stats() });
    },
  });
}

export function useDeleteLine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteLine(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: investigacaoKeys.lines.all() });
      // Apagar uma linha pode desassociar projectos -> invalida projectos também.
      queryClient.invalidateQueries({ queryKey: investigacaoKeys.projects.all() });
      queryClient.invalidateQueries({ queryKey: investigacaoKeys.stats() });
    },
  });
}

// --- Projectos de I&D -------------------------------------------------------

/** Ponto de leitura reutilizado pelo módulo BI para agregações de projectos. */
export function useProjectsList(params: ProjectListParams) {
  return useQuery({
    queryKey: investigacaoKeys.projects.list(params),
    queryFn: () => listProjects(params),
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<ProjectDto>) => createProject(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: investigacaoKeys.projects.all() });
      queryClient.invalidateQueries({ queryKey: investigacaoKeys.stats() });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ProjectDto> }) => updateProject(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: investigacaoKeys.projects.all() });
      queryClient.invalidateQueries({ queryKey: investigacaoKeys.stats() });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: investigacaoKeys.projects.all() });
      // Apagar um projecto pode desassociar publicações -> invalida-as também.
      queryClient.invalidateQueries({ queryKey: investigacaoKeys.publications.all() });
      queryClient.invalidateQueries({ queryKey: investigacaoKeys.stats() });
    },
  });
}

// --- Publicações ------------------------------------------------------------

/** Ponto de leitura reutilizado pelo módulo BI para agregações de publicações. */
export function usePublicationsList(params: PublicationListParams) {
  return useQuery({
    queryKey: investigacaoKeys.publications.list(params),
    queryFn: () => listPublications(params),
  });
}

export function useCreatePublication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<PublicationDto>) => createPublication(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: investigacaoKeys.publications.all() });
      queryClient.invalidateQueries({ queryKey: investigacaoKeys.stats() });
    },
  });
}

export function useUpdatePublication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<PublicationDto> }) =>
      updatePublication(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: investigacaoKeys.publications.all() });
      queryClient.invalidateQueries({ queryKey: investigacaoKeys.stats() });
    },
  });
}

export function useDeletePublication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePublication(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: investigacaoKeys.publications.all() });
      queryClient.invalidateQueries({ queryKey: investigacaoKeys.stats() });
    },
  });
}
