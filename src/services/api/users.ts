import { apiDelete, apiGet, apiPut } from "@/services/api/client";
import { endpoints } from "@/services/api/endpoints";
import type { UpdateUserPayload, UserDto, UserListParams } from "@/types/dto/user";

/**
 * Serviço de dados do módulo Utilizadores.
 *
 * Replica o padrão de `departamentos.ts`. Ao contrário desse módulo, `listUsers`
 * devolve um array simples (sem envelope `Paginated<T>`) — o endpoint mock não
 * pagina no servidor, ver nota em `mocks/handlers/users.ts`.
 */

export function listUsers(params: UserListParams): Promise<UserDto[]> {
  const query: Record<string, string> = {};
  if (params.search) query.search = params.search;
  if (params.role) query.role = params.role;
  if (params.departmentId) query.departmentId = params.departmentId;
  return apiGet<UserDto[]>(endpoints.users.list, { params: query });
}

export function updateUser(id: string, payload: UpdateUserPayload): Promise<UserDto> {
  return apiPut<UserDto>(endpoints.users.detail(id), payload);
}

export function deleteUser(id: string): Promise<void> {
  return apiDelete<void>(endpoints.users.detail(id));
}
