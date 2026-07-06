import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createNoticia,
  deleteNoticia,
  getNoticia,
  listNoticias,
  updateNoticia,
} from "@/services/api/noticias";
import type { NoticiaDto, NoticiaListParams } from "@/types/dto/noticia";

/**
 * Hooks react-query do módulo Notícias.
 *
 * Padrão a replicar por módulo:
 *  - `noticiaKeys`: fábrica de query keys hierárquicas (all -> lists/details),
 *    para invalidação precisa.
 *  - queries para list/detail; mutations para create/update/delete, todas a
 *    invalidar as listas no onSuccess.
 */

export const noticiaKeys = {
  all: ["noticias"] as const,
  lists: () => [...noticiaKeys.all, "list"] as const,
  list: (params: NoticiaListParams) => [...noticiaKeys.lists(), params] as const,
  details: () => [...noticiaKeys.all, "detail"] as const,
  detail: (id: string) => [...noticiaKeys.details(), id] as const,
};

export function useNoticiasList(params: NoticiaListParams) {
  return useQuery({
    queryKey: noticiaKeys.list(params),
    queryFn: () => listNoticias(params),
  });
}

export function useNoticia(id: string) {
  return useQuery({
    queryKey: noticiaKeys.detail(id),
    queryFn: () => getNoticia(id),
    enabled: !!id,
  });
}

export function useCreateNoticia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<NoticiaDto>) => createNoticia(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noticiaKeys.lists() });
    },
  });
}

export function useUpdateNoticia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<NoticiaDto> }) =>
      updateNoticia(id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: noticiaKeys.lists() });
      // Actualiza também o detalhe em cache para leitura imediata.
      queryClient.invalidateQueries({ queryKey: noticiaKeys.detail(updated.id) });
    },
  });
}

export function useDeleteNoticia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteNoticia(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noticiaKeys.lists() });
    },
  });
}
