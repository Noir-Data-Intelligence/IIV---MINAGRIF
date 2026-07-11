import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCrop,
  createField,
  createHarvest,
  deleteCrop,
  deleteField,
  deleteHarvest,
  listCrops,
  listFields,
  listHarvests,
  updateCrop,
  updateField,
  updateHarvest,
} from "@/services/api/agricultura";
import type {
  CropDto,
  CropListParams,
  FieldDto,
  FieldListParams,
  HarvestDto,
  HarvestListParams,
} from "@/types/dto/agricultura";

/**
 * Hooks react-query do módulo Agricultura.
 *
 * Segue o padrão de `useFinanceiro.ts`, mantendo uma fábrica de query keys
 * hierárquicas SEPARADA por entidade (culturas / campos / colheitas) para
 * invalidação precisa. Como as três entidades se influenciam (um novo campo
 * altera KPIs; uma nova colheita altera a produção acumulada), as mutations
 * fazem invalidação em cascata quando relevante.
 *
 * NOTA PARA O MÓDULO BI: `useHarvestsList` é o hook público de listagem de
 * colheitas a reutilizar para agregações "colheita por cultura" (usar
 * `{ page: 1, perPage: 1000 }` para obter o dataset completo).
 */

export const cropKeys = {
  all: ["culturas"] as const,
  lists: () => [...cropKeys.all, "list"] as const,
  list: (params: CropListParams) => [...cropKeys.lists(), params] as const,
  details: () => [...cropKeys.all, "detail"] as const,
  detail: (id: string) => [...cropKeys.details(), id] as const,
};

export const fieldKeys = {
  all: ["campos"] as const,
  lists: () => [...fieldKeys.all, "list"] as const,
  list: (params: FieldListParams) => [...fieldKeys.lists(), params] as const,
  details: () => [...fieldKeys.all, "detail"] as const,
  detail: (id: string) => [...fieldKeys.details(), id] as const,
};

export const harvestKeys = {
  all: ["colheitas"] as const,
  lists: () => [...harvestKeys.all, "list"] as const,
  list: (params: HarvestListParams) => [...harvestKeys.lists(), params] as const,
  details: () => [...harvestKeys.all, "detail"] as const,
  detail: (id: string) => [...harvestKeys.details(), id] as const,
};

// --- Culturas --------------------------------------------------------------

export function useCropsList(params: CropListParams) {
  return useQuery({
    queryKey: cropKeys.list(params),
    queryFn: () => listCrops(params),
  });
}

export function useCreateCrop() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<CropDto>) => createCrop(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cropKeys.lists() });
    },
  });
}

export function useUpdateCrop() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CropDto> }) =>
      updateCrop(id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: cropKeys.lists() });
      queryClient.invalidateQueries({ queryKey: cropKeys.detail(updated.id) });
    },
  });
}

export function useDeleteCrop() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCrop(id),
    onSuccess: () => {
      // A remoção de uma cultura arrasta campos e colheitas dependentes.
      queryClient.invalidateQueries({ queryKey: cropKeys.lists() });
      queryClient.invalidateQueries({ queryKey: fieldKeys.lists() });
      queryClient.invalidateQueries({ queryKey: harvestKeys.lists() });
    },
  });
}

// --- Campos ----------------------------------------------------------------

export function useFieldsList(params: FieldListParams) {
  return useQuery({
    queryKey: fieldKeys.list(params),
    queryFn: () => listFields(params),
  });
}

export function useCreateField() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<FieldDto>) => createField(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fieldKeys.lists() });
    },
  });
}

export function useUpdateField() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<FieldDto> }) =>
      updateField(id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: fieldKeys.lists() });
      queryClient.invalidateQueries({ queryKey: fieldKeys.detail(updated.id) });
    },
  });
}

export function useDeleteField() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteField(id),
    onSuccess: () => {
      // A remoção de um campo arrasta as colheitas dependentes.
      queryClient.invalidateQueries({ queryKey: fieldKeys.lists() });
      queryClient.invalidateQueries({ queryKey: harvestKeys.lists() });
    },
  });
}

// --- Colheitas -------------------------------------------------------------

/**
 * Listagem de colheitas. Hook público reutilizado pelo módulo BI para
 * agregações "colheita por cultura".
 */
export function useHarvestsList(params: HarvestListParams) {
  return useQuery({
    queryKey: harvestKeys.list(params),
    queryFn: () => listHarvests(params),
  });
}

export function useCreateHarvest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<HarvestDto>) => createHarvest(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: harvestKeys.lists() });
    },
  });
}

export function useUpdateHarvest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<HarvestDto> }) =>
      updateHarvest(id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: harvestKeys.lists() });
      queryClient.invalidateQueries({ queryKey: harvestKeys.detail(updated.id) });
    },
  });
}

export function useDeleteHarvest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteHarvest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: harvestKeys.lists() });
    },
  });
}
