import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createStockItem,
  createStockLocation,
  createStockMovement,
  deleteStockItem,
  deleteStockLocation,
  deleteStockMovement,
  listStockItems,
  listStockLocations,
  listStockMovements,
  updateStockItem,
  updateStockLocation,
} from "@/services/api/stock";
import type {
  StockItemDto,
  StockItemListParams,
  StockLocationDto,
  StockLocationListParams,
  StockMovementDto,
  StockMovementListParams,
} from "@/types/dto/stock";

/**
 * Hooks react-query do módulo Stock Integrado.
 *
 * Segue o padrão de `useFinanceiro.ts`, mantendo uma fábrica de query keys
 * hierárquicas SEPARADA por entidade (itens / localizações / movimentos) para
 * invalidação precisa. Como as entidades se influenciam:
 *  - registar um movimento altera a quantidade do item (regra no servidor), pelo
 *    que as mutations de movimentos invalidam também as listas de itens;
 *  - remover uma localização/item arrasta as suas referências (ver handlers),
 *    pelo que as respectivas mutations invalidam as listas dependentes.
 *
 * `useStockItemsList` é o hook de lista de itens — reutilizado pelo alerta
 * "Stock Crítico" do Dashboard (ver `isBelowMinStock` em `types/dto/stock.ts`).
 */

export const stockItemKeys = {
  all: ["stock-itens"] as const,
  lists: () => [...stockItemKeys.all, "list"] as const,
  list: (params: StockItemListParams) => [...stockItemKeys.lists(), params] as const,
  details: () => [...stockItemKeys.all, "detail"] as const,
  detail: (id: string) => [...stockItemKeys.details(), id] as const,
};

export const stockLocationKeys = {
  all: ["stock-localizacoes"] as const,
  lists: () => [...stockLocationKeys.all, "list"] as const,
  list: (params: StockLocationListParams) => [...stockLocationKeys.lists(), params] as const,
  details: () => [...stockLocationKeys.all, "detail"] as const,
  detail: (id: string) => [...stockLocationKeys.details(), id] as const,
};

export const stockMovementKeys = {
  all: ["stock-movimentos"] as const,
  lists: () => [...stockMovementKeys.all, "list"] as const,
  list: (params: StockMovementListParams) => [...stockMovementKeys.lists(), params] as const,
};

// --- Itens ------------------------------------------------------------------

export function useStockItemsList(params: StockItemListParams) {
  return useQuery({
    queryKey: stockItemKeys.list(params),
    queryFn: () => listStockItems(params),
  });
}

export function useCreateStockItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<StockItemDto>) => createStockItem(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockItemKeys.lists() });
    },
  });
}

export function useUpdateStockItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<StockItemDto> }) =>
      updateStockItem(id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: stockItemKeys.lists() });
      queryClient.invalidateQueries({ queryKey: stockItemKeys.detail(updated.id) });
    },
  });
}

export function useDeleteStockItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteStockItem(id),
    onSuccess: () => {
      // A remoção de um item arrasta os seus movimentos.
      queryClient.invalidateQueries({ queryKey: stockItemKeys.lists() });
      queryClient.invalidateQueries({ queryKey: stockMovementKeys.lists() });
    },
  });
}

// --- Localizações -----------------------------------------------------------

export function useStockLocationsList(params: StockLocationListParams) {
  return useQuery({
    queryKey: stockLocationKeys.list(params),
    queryFn: () => listStockLocations(params),
  });
}

export function useCreateStockLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<StockLocationDto>) => createStockLocation(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockLocationKeys.lists() });
    },
  });
}

export function useUpdateStockLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<StockLocationDto> }) =>
      updateStockLocation(id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: stockLocationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: stockLocationKeys.detail(updated.id) });
    },
  });
}

export function useDeleteStockLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteStockLocation(id),
    onSuccess: () => {
      // Itens podem referir a localização (limpa para null no servidor).
      queryClient.invalidateQueries({ queryKey: stockLocationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: stockItemKeys.lists() });
    },
  });
}

// --- Movimentos -------------------------------------------------------------

export function useStockMovementsList(params: StockMovementListParams) {
  return useQuery({
    queryKey: stockMovementKeys.list(params),
    queryFn: () => listStockMovements(params),
  });
}

export function useCreateStockMovement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<StockMovementDto>) => createStockMovement(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockMovementKeys.lists() });
      // O movimento altera a quantidade do item (regra no servidor) -> KPIs/lista.
      queryClient.invalidateQueries({ queryKey: stockItemKeys.lists() });
    },
  });
}

export function useDeleteStockMovement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteStockMovement(id),
    onSuccess: () => {
      // Apagar um movimento reverte o efeito na quantidade do item (servidor).
      queryClient.invalidateQueries({ queryKey: stockMovementKeys.lists() });
      queryClient.invalidateQueries({ queryKey: stockItemKeys.lists() });
    },
  });
}
