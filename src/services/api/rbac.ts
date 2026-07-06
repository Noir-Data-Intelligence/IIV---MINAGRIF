import { apiDelete, apiGet, apiPost, apiPut } from "@/services/api/client";
import { endpoints } from "@/services/api/endpoints";
import type { AppRole } from "@/lib/permissions";
import type { PermissionEntryDto, UserRoleAssignmentDto } from "@/types/dto/rbac";

/**
 * Serviço de dados do módulo RBAC (matriz de permissões + atribuição de papéis).
 *
 * Substitui as 3 chamadas Supabase directas da página (`role_permissions`,
 * `profiles`, `user_roles`) por endpoints REST servidos pela camada mock (MSW).
 * Como os restantes serviços, assenta em `client.ts`/`endpoints.ts` e nunca
 * conhece o axios nem o MSW.
 */

/** Matriz de permissões: só as entradas que existem (overrides ao default). */
export function getPermissionsMatrix(): Promise<PermissionEntryDto[]> {
  return apiGet<PermissionEntryDto[]>(endpoints.rbac.permissions);
}

/** Grava a matriz completa (substitui o conjunto actual pelo enviado). */
export function savePermissionsMatrix(entries: PermissionEntryDto[]): Promise<void> {
  return apiPut<void>(endpoints.rbac.permissions, entries);
}

/** Lista consolidada de utilizadores com os respectivos papéis. */
export function listUserRoleAssignments(): Promise<UserRoleAssignmentDto[]> {
  return apiGet<UserRoleAssignmentDto[]>(endpoints.rbac.users);
}

/** Atribui um papel a um utilizador. */
export function addUserRole(userId: string, role: AppRole): Promise<void> {
  return apiPost<void>(`${endpoints.rbac.users}/${userId}/roles`, { role });
}

/** Remove um papel de um utilizador. */
export function removeUserRole(userId: string, role: AppRole): Promise<void> {
  return apiDelete<void>(endpoints.rbac.userRole(userId, role));
}
