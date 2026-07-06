import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addUserRole,
  getPermissionsMatrix,
  listUserRoleAssignments,
  removeUserRole,
  savePermissionsMatrix,
} from "@/services/api/rbac";
import { refreshPermissionsMatrix } from "@/hooks/useUserRole";
import type { AppRole } from "@/lib/permissions";
import type { PermissionEntryDto } from "@/types/dto/rbac";

/**
 * Hooks react-query do módulo RBAC.
 *
 * - `usePermissionsMatrix` / `useUserRoleAssignments`: leituras da matriz e das
 *   atribuições de papéis.
 * - `useSavePermissionsMatrix`: grava a matriz e, no onSuccess, além de invalidar
 *   a query, chama `refreshPermissionsMatrix()` para forçar o recarregamento da
 *   cache global de permissões — assim toda a app reflecte as novas permissões
 *   imediatamente, sem refresh manual (CRÍTICO).
 * - `useAddUserRole` / `useRemoveUserRole`: mutações de atribuição de papéis.
 */

export const rbacKeys = {
  all: ["rbac"] as const,
  permissions: () => [...rbacKeys.all, "permissions"] as const,
  users: () => [...rbacKeys.all, "users"] as const,
};

export function usePermissionsMatrix() {
  return useQuery({
    queryKey: rbacKeys.permissions(),
    queryFn: getPermissionsMatrix,
  });
}

export function useSavePermissionsMatrix() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entries: PermissionEntryDto[]) => savePermissionsMatrix(entries),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: rbacKeys.permissions() });
      // CRÍTICO: recarrega a cache global de permissões (DYNAMIC_MATRIX) para que
      // toda a app veja as novas permissões sem precisar de refresh manual.
      await refreshPermissionsMatrix();
    },
  });
}

export function useUserRoleAssignments() {
  return useQuery({
    queryKey: rbacKeys.users(),
    queryFn: listUserRoleAssignments,
  });
}

export function useAddUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: AppRole }) =>
      addUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacKeys.users() });
    },
  });
}

export function useRemoveUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: AppRole }) =>
      removeUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacKeys.users() });
    },
  });
}
