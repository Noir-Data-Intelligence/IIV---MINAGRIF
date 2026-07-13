import { apiGet, apiPatch, apiPost } from "@/services/api/client";
import { endpoints } from "@/services/api/endpoints";
import { AUTH_TOKEN_STORAGE_KEY, http } from "@/lib/http";
import type {
  AuthSessionDto,
  ChangePasswordPayload,
  ForgotPasswordPayload,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
} from "@/types/dto/auth";
import type { UserDto } from "@/types/dto/user";

/**
 * Serviço de dados do módulo de Autenticação.
 *
 * Substitui `supabase.auth.*` (usado hoje por `useAuth.tsx`, `Login.tsx`,
 * `Registar.tsx`, `RecuperarSenha.tsx`, `RedefinirSenha.tsx`, `Perfil.tsx`)
 * por endpoints REST servidos pela camada mock (`mocks/handlers/auth.ts`),
 * seguindo o mesmo padrão dos restantes serviços em `services/api/*.ts`.
 *
 * `login`/`register` persistem o token de sessão em localStorage (ver
 * `AUTH_TOKEN_STORAGE_KEY` em `lib/http.ts`) para que `http.ts` o reenvie
 * automaticamente em pedidos subsequentes.
 */

export async function login(email: string, password: string): Promise<UserDto> {
  const { data } = await http.post<AuthSessionDto>(endpoints.auth.login, {
    email,
    password,
  } satisfies LoginPayload);
  localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, data.token);
  return data.user;
}

export async function logout(): Promise<void> {
  try {
    await apiPost<void>(endpoints.auth.logout);
  } finally {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  }
}

export async function register(fullName: string, email: string, password: string): Promise<UserDto> {
  const { data } = await http.post<{ user: UserDto }>(endpoints.auth.register, {
    fullName,
    email,
    password,
  } satisfies RegisterPayload);
  return data.user;
}

export function forgotPassword(email: string): Promise<void> {
  return apiPost<void>(endpoints.auth.forgotPassword, { email } satisfies ForgotPasswordPayload);
}

export function resetPassword(token: string, email: string, password: string): Promise<void> {
  return apiPost<void>(endpoints.auth.resetPassword, {
    token,
    email,
    password,
  } satisfies ResetPasswordPayload);
}

export function changePassword(password: string): Promise<void> {
  return apiPatch<void>(endpoints.auth.changePassword, { password } satisfies ChangePasswordPayload);
}

/** Devolve o utilizador da sessão actual, ou `null` se não houver token/sessão inválida. */
export async function getCurrentUser(): Promise<UserDto | null> {
  if (!localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)) return null;
  try {
    return await apiGet<UserDto>(endpoints.auth.user);
  } catch {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    return null;
  }
}
