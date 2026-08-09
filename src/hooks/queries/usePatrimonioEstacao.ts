import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAssetEstacao,
  createMaintenanceEstacao,
  deleteAssetEstacao,
  deleteMaintenanceEstacao,
  listAssetsEstacao,
  listMaintenancesEstacao,
  updateAssetEstacao,
  updateMaintenanceEstacao,
} from "@/services/api/patrimonioEstacao";
import type {
  AssetEstacaoDto,
  AssetEstacaoListParams,
  MaintenanceEstacaoDto,
  MaintenanceEstacaoListParams,
} from "@/types/dto/patrimonioEstacao";

/** Hooks react-query do Património de Estação — esquema separado do Central. */

export const assetEstacaoKeys = {
  all: ["patrimonio-estacao"] as const,
  lists: () => [...assetEstacaoKeys.all, "list"] as const,
  list: (params: AssetEstacaoListParams) => [...assetEstacaoKeys.lists(), params] as const,
  details: () => [...assetEstacaoKeys.all, "detail"] as const,
  detail: (id: string) => [...assetEstacaoKeys.details(), id] as const,
};

export const maintenanceEstacaoKeys = {
  all: ["patrimonio-estacao-manutencoes"] as const,
  lists: () => [...maintenanceEstacaoKeys.all, "list"] as const,
  list: (params: MaintenanceEstacaoListParams) => [...maintenanceEstacaoKeys.lists(), params] as const,
};

export function useAssetsEstacaoList(params: AssetEstacaoListParams) {
  return useQuery({
    queryKey: assetEstacaoKeys.list(params),
    queryFn: () => listAssetsEstacao(params),
  });
}

export function useCreateAssetEstacao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<AssetEstacaoDto>) => createAssetEstacao(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: assetEstacaoKeys.lists() }),
  });
}

export function useUpdateAssetEstacao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<AssetEstacaoDto> }) =>
      updateAssetEstacao(id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: assetEstacaoKeys.lists() });
      queryClient.invalidateQueries({ queryKey: assetEstacaoKeys.detail(updated.id) });
    },
  });
}

export function useDeleteAssetEstacao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAssetEstacao(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetEstacaoKeys.lists() });
      queryClient.invalidateQueries({ queryKey: maintenanceEstacaoKeys.lists() });
    },
  });
}

export function useMaintenancesEstacaoList(params: MaintenanceEstacaoListParams) {
  return useQuery({
    queryKey: maintenanceEstacaoKeys.list(params),
    queryFn: () => listMaintenancesEstacao(params),
  });
}

export function useCreateMaintenanceEstacao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<MaintenanceEstacaoDto>) => createMaintenanceEstacao(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: maintenanceEstacaoKeys.lists() });
      queryClient.invalidateQueries({ queryKey: assetEstacaoKeys.lists() });
    },
  });
}

export function useUpdateMaintenanceEstacao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<MaintenanceEstacaoDto> }) =>
      updateMaintenanceEstacao(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: maintenanceEstacaoKeys.lists() }),
  });
}

export function useDeleteMaintenanceEstacao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMaintenanceEstacao(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: maintenanceEstacaoKeys.lists() }),
  });
}
