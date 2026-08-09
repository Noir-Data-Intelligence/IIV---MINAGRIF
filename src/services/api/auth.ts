import { apiGet, apiPatch, apiPost } from "@/services/api/client";
import { endpoints } from "@/services/api/endpoints";
import { AUTH_TOKEN_STORAGE_KEY, IS_REAL_BACKEND, ensureCsrfCookie, http } from "@/lib/http";
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
 * por endpoints REST, servidos pela camada mock (`mocks/handlers/auth.ts`,
 * token em localStorage) ou pelo backend Laravel real (Sanctum SPA
 * cookie-based, sem token no corpo — ver `AuthController::login()` no
 * backend). Os dois fluxos coexistem aqui, seleccionados por
 * `IS_REAL_BACKEND`, para que só `VITE_API_URL`/`VITE_API_MOCK` precisem de
 * mudar entre ambientes (nenhum componente/hook conhece a diferença).
 */

export async function login(email: string, password: string): Promise<UserDto> {
  if (IS_REAL_BACKEND) {
    await ensureCsrfCookie();
    await http.post<void>(endpoints.auth.login, { email, password } satisfies LoginPayload);
    return apiGet<UserDto>(endpoints.auth.user);
  }
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
  if (IS_REAL_BACKEND) {
    await ensureCsrfCookie();
    // O formulário de registo (Registar.tsx) só recolhe uma password (sem
    // campo de confirmação) — o backend real exige `password_confirmation`
    // (regra `confirmed` do Laravel). Reenvia o mesmo valor como confirmação
    // em vez de adicionar um segundo campo ao formulário só para satisfazer
    // essa validação.
    return http
      .post<UserDto>(endpoints.auth.register, {
        fullName,
        email,
        password,
        password_confirmation: password,
      })
      .then((res) => res.data);
  }
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
  // Modo mock: sem token em localStorage não há sessão possível — poupa o
  // pedido de rede. Modo real: a cookie de sessão é httpOnly (invisível ao
  // JS), por isso há sempre de tentar e deixar o 401 decidir.
  if (!IS_REAL_BACKEND && !localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)) return null;
  try {
    return await apiGet<UserDto>(endpoints.auth.user);
  } catch {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    return null;
  }
}
