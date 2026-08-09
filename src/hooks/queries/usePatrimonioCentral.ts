import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAssetCentral,
  createMaintenanceCentral,
  deleteAssetCentral,
  deleteMaintenanceCentral,
  listAssetsCentral,
  listMaintenancesCentral,
  updateAssetCentral,
  updateMaintenanceCentral,
} from "@/services/api/patrimonioCentral";
import type {
  AssetCentralDto,
  AssetCentralListParams,
  MaintenanceCentralDto,
  MaintenanceCentralListParams,
} from "@/types/dto/patrimonioCentral";

/** Hooks react-query do Património Central — esquema separado do de Estação. */

export const assetCentralKeys = {
  all: ["patrimonio-central"] as const,
  lists: () => [...assetCentralKeys.all, "list"] as const,
  list: (params: AssetCentralListParams) => [...assetCentralKeys.lists(), params] as const,
  details: () => [...assetCentralKeys.all, "detail"] as const,
  detail: (id: string) => [...assetCentralKeys.details(), id] as const,
};

export const maintenanceCentralKeys = {
  all: ["patrimonio-central-manutencoes"] as const,
  lists: () => [...maintenanceCentralKeys.all, "list"] as const,
  list: (params: MaintenanceCentralListParams) => [...maintenanceCentralKeys.lists(), params] as const,
};

export function useAssetsCentralList(params: AssetCentralListParams) {
  return useQuery({
    queryKey: assetCentralKeys.list(params),
    queryFn: () => listAssetsCentral(params),
  });
}

export function useCreateAssetCentral() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<AssetCentralDto>) => createAssetCentral(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: assetCentralKeys.lists() }),
  });
}

export function useUpdateAssetCentral() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<AssetCentralDto> }) =>
      updateAssetCentral(id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: assetCentralKeys.lists() });
      queryClient.invalidateQueries({ queryKey: assetCentralKeys.detail(updated.id) });
    },
  });
}

export function useDeleteAssetCentral() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAssetCentral(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetCentralKeys.lists() });
      queryClient.invalidateQueries({ queryKey: maintenanceCentralKeys.lists() });
    },
  });
}

export function useMaintenancesCentralList(params: MaintenanceCentralListParams) {
  return useQuery({
    queryKey: maintenanceCentralKeys.list(params),
    queryFn: () => listMaintenancesCentral(params),
  });
}

export function useCreateMaintenanceCentral() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<MaintenanceCentralDto>) => createMaintenanceCentral(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: maintenanceCentralKeys.lists() });
      queryClient.invalidateQueries({ queryKey: assetCentralKeys.lists() });
    },
  });
}

export function useUpdateMaintenanceCentral() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<MaintenanceCentralDto> }) =>
      updateMaintenanceCentral(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: maintenanceCentralKeys.lists() }),
  });
}

export function useDeleteMaintenanceCentral() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMaintenanceCentral(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: maintenanceCentralKeys.lists() }),
  });
}
