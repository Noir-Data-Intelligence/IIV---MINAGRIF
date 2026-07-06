import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  archiveProduto,
  createProduto,
  deleteProduto,
  listProdutos,
  restoreProduto,
  updateProduto,
} from "@/services/api/produtos";
import type { ProdutoDto, ProdutoListParams } from "@/types/dto/produto";

/**
 * Hooks react-query do módulo Produtos.
 *
 * Replica o padrão de `useDepartamentos.ts`, acrescentando mutations de
 * archive/restore (a página mantém as tabs Activos/Arquivados).
 */

export const produtoKeys = {
  all: ["produtos"] as const,
  lists: () => [...produtoKeys.all, "list"] as const,
  list: (params: ProdutoListParams) => [...produtoKeys.lists(), params] as const,
  details: () => [...produtoKeys.all, "detail"] as const,
  detail: (id: string) => [...produtoKeys.details(), id] as const,
};

export function useProdutosList(params: ProdutoListParams) {
  return useQuery({
    queryKey: produtoKeys.list(params),
    queryFn: () => listProdutos(params),
  });
}

export function useCreateProduto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<ProdutoDto>) => createProduto(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: produtoKeys.lists() });
    },
  });
}

export function useUpdateProduto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ProdutoDto> }) =>
      updateProduto(id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: produtoKeys.lists() });
      queryClient.invalidateQueries({ queryKey: produtoKeys.detail(updated.id) });
    },
  });
}

export function useDeleteProduto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProduto(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: produtoKeys.lists() });
    },
  });
}

/** Arquiva/restaura um produto, invalidando as listas para reflectir a mudança de tab. */
export function useArchiveProduto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, archived }: { id: string; archived: boolean }) =>
      archived ? archiveProduto(id) : restoreProduto(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: produtoKeys.lists() });
    },
  });
}
