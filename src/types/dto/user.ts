import type { AppRole } from "@/lib/permissions";

/**
 * DTO de Utilizador — contrato exacto do JSON REST para o recurso `users`.
 *
 * Consolida NUM SÓ objecto o que hoje em Supabase são 3 tabelas separadas
 * (`profiles` + `user_roles` + `user_departments`, esta última resolvida
 * contra `departments`). Uma API REST real devolveria os relacionamentos já
 * resolvidos num único endpoint `/api/users` (via API Resources do Laravel,
 * com eager-loading de roles/departments) — o cliente deixa de precisar de
 * fazer 3 pedidos e juntar os dados em memória (ver `rolesByUser`/`deptsByUser`
 * na versão Supabase original).
 */
export interface UserDto {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  createdAt: string;
  roles: AppRole[];
  departmentIds: string[];
}

/** Parâmetros de listagem/filtragem de utilizadores. */
export interface UserListParams {
  search?: string;
  role?: string;
  departmentId?: string;
}

/** Payload de actualização — todos os campos opcionais (PATCH-like via PUT). */
export interface UpdateUserPayload {
  fullName?: string;
  phone?: string | null;
  roles?: AppRole[];
  departmentIds?: string[];
}
