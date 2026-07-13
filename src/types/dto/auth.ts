import type { UserDto } from "@/types/dto/user";

/**
 * DTOs do módulo de Autenticação — contrato REST alinhado com
 * PLANO-BACKEND-LARAVEL.txt secção 2.2 (Sanctum SPA cookie-based).
 *
 * Em modo mock não há cookie httpOnly real: `token` é um valor simples
 * persistido em localStorage pelo cliente (ver `src/lib/http.ts`) e enviado
 * como `Authorization: Bearer <token>` em pedidos subsequentes — o handler
 * `GET /api/user` lê esse header para resolver a sessão.
 */
export interface AuthSessionDto {
  token: string;
  user: UserDto;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  email: string;
  password: string;
}

export interface ChangePasswordPayload {
  password: string;
}
