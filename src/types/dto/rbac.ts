import type { AppRole, ModuleKey } from "@/lib/permissions";

/**
 * DTOs do módulo RBAC — contrato REST do editor de permissões.
 *
 * `PermissionEntryDto` espelha uma linha da tabela `role_permissions` (override
 * ao default estático de `ROLE_PERMISSIONS`), já em camelCase tal como o backend
 * Laravel devolverá via API Resources (`can_view`/`can_write` -> `canView`/`canWrite`).
 *
 * `UserRoleAssignmentDto` consolida num único objecto o que na origem Supabase
 * eram duas tabelas (`profiles` + `user_roles`): o perfil e os papéis já juntos.
 */
export interface PermissionEntryDto {
  role: AppRole;
  module: ModuleKey;
  canView: boolean;
  canWrite: boolean;
}

export interface UserRoleAssignmentDto {
  userId: string;
  fullName: string;
  roles: AppRole[];
}
