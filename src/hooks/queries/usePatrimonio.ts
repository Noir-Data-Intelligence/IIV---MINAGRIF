import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAsset,
  createMaintenance,
  deleteAsset,
  deleteMaintenance,
  listAssets,
  listMaintenances,
  updateAsset,
  updateMaintenance,
} from "@/services/api/patrimonio";
import type {
  AssetDto,
  AssetListParams,
  MaintenanceDto,
  MaintenanceListParams,
} from "@/types/dto/patrimonio";

/**
 * Hooks react-query do módulo Património.
 *
 * Segue o padrão de `useDepartamentos.ts`, com fábricas de query keys
 * hierárquicas por recurso (activos, manutenções) para invalidação precisa.
 * As mutações de manutenção invalidam também as listas de activos, porque uma
 * intervenção pode alterar o estado do activo (ver handler).
 */

export const assetKeys = {
  all: ["activos"] as const,
  lists: () => [...assetKeys.all, "list"] as const,
  list: (params: AssetListParams) => [...assetKeys.lists(), params] as const,
  details: () => [...assetKeys.all, "detail"] as const,
  detail: (id: string) => [...assetKeys.details(), id] as const,
};

export const maintenanceKeys = {
  all: ["manutencoes"] as const,
  lists: () => [...maintenanceKeys.all, "list"] as const,
  list: (params: MaintenanceListParams) => [...maintenanceKeys.lists(), params] as const,
};

// --- Activos ---------------------------------------------------------------

export function useAssetsList(params: AssetListParams) {
  return useQuery({
    queryKey: assetKeys.list(params),
    queryFn: () => listAssets(params),
  });
}

export function useCreateAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<AssetDto>) => createAsset(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
    },
  });
}

export function useUpdateAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<AssetDto> }) =>
      updateAsset(id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: assetKeys.detail(updated.id) });
    },
  });
}

export function useDeleteAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAsset(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
      // Apagar um activo remove em cascata as suas manutenções (ver handler).
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.lists() });
    },
  });
}

// --- Manutenções -----------------------------------------------------------

export function useMaintenancesList(params: MaintenanceListParams) {
  return useQuery({
    queryKey: maintenanceKeys.list(params),
    queryFn: () => listMaintenances(params),
  });
}

export function useCreateMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<MaintenanceDto>) => createMaintenance(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.lists() });
      // Uma intervenção pode alterar o estado do activo.
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
    },
  });
}

export function useUpdateMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<MaintenanceDto> }) =>
      updateMaintenance(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.lists() });
    },
  });
}

export function useDeleteMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMaintenance(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.lists() });
    },
  });
}
