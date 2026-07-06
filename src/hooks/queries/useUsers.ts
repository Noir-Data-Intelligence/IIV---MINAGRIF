import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteUser, listUsers, updateUser } from "@/services/api/users";
import type { UpdateUserPayload, UserListParams } from "@/types/dto/user";

/**
 * Hooks react-query do módulo Utilizadores.
 *
 * Replica o padrão de `useDepartamentos.ts`:
 *  - `userKeys`: fábrica de query keys hierárquicas (all -> lists/details).
 *  - query para list; mutations para update/delete, todas a invalidar as
 *    listas no onSuccess.
 */

export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (params: UserListParams) => [...userKeys.lists(), params] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

export function useUsersList(params: UserListParams) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => listUsers(params),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserPayload }) => updateUser(id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(updated.id) });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}
