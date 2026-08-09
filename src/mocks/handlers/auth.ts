import { http, HttpResponse } from "msw";
import { usersFixtures, setUsersFixtures } from "@/mocks/fixtures/users";
import {
  passwordByEmail,
  setPassword,
  resetTokensByEmail,
  setResetToken,
  clearResetToken,
} from "@/mocks/fixtures/authCredentials";
import type {
  ChangePasswordPayload,
  ForgotPasswordPayload,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
} from "@/types/dto/auth";
import type { UserDto } from "@/types/dto/user";

/**
 * Handlers MSW do módulo de Autenticação (login/registo/recuperação/sessão).
 *
 * Contrato replicado de PLANO-BACKEND-LARAVEL.txt secção 2.2 (Sanctum SPA),
 * adaptado ao padrão mock: sem cookie httpOnly real, a sessão é um token
 * simples (= id do utilizador) devolvido no corpo e reenviado pelo cliente
 * como `Authorization: Bearer <token>` (ver `src/lib/http.ts`). Opera sobre
 * `usersFixtures` (mesma fonte de verdade que `rbac.ts`/`users.ts`) e sobre
 * `authCredentials.ts` para passwords/tokens de reset — tudo em memória,
 * reset no refresh do browser.
 */

const BASE = "*/api";

function userByToken(request: Request) {
  const auth = request.headers.get("Authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return null;
  return usersFixtures.find((u) => u.id === token) ?? null;
}

export const authHandlers = [
  // POST /api/login -> valida email+password, devolve token + UserDto
  http.post(`${BASE}/login`, async ({ request }) => {
    const { email, password } = (await request.json().catch(() => ({}))) as Partial<LoginPayload>;
    const user = usersFixtures.find((u) => u.email === email);
    if (!user || !password || passwordByEmail[user.email] !== password) {
      return HttpResponse.json({ message: "Credenciais inválidas." }, { status: 401 });
    }
    // Espelha o backend real: conta auto-registada (isActive=false) nunca
    // autentica, mesmo com a password certa — fica pendente de aprovação.
    if (!user.isActive) {
      return HttpResponse.json(
        { message: "Esta conta está pendente de aprovação por um administrador." },
        { status: 422 },
      );
    }
    return HttpResponse.json({ token: user.id, user });
  }),

  // POST /api/logout -> sem estado de servidor a limpar (token vive só no cliente)
  http.post(`${BASE}/logout`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // POST /api/register -> cria conta nova (papel "recepcionista" por omissão)
  http.post(`${BASE}/register`, async ({ request }) => {
    const { fullName, email, password } = (await request.json().catch(() => ({}))) as Partial<RegisterPayload>;
    if (!fullName || !email || !password) {
      return HttpResponse.json({ message: "Dados em falta.", errors: {} }, { status: 422 });
    }
    if (usersFixtures.some((u) => u.email === email)) {
      return HttpResponse.json(
        { message: "Email já registado.", errors: { email: ["Email já registado."] } },
        { status: 422 },
      );
    }
    const newUser: UserDto = {
      id: `usr-${Date.now()}`,
      fullName,
      email,
      phone: null,
      createdAt: new Date().toISOString(),
      roles: ["recepcionista"],
      departmentIds: [],
      // Espelha AuthController::register() real: nasce inactiva, só um
      // admin a activa via PUT /users/{id}.
      isActive: false,
    };
    setUsersFixtures([...usersFixtures, newUser]);
    setPassword(email, password);
    return HttpResponse.json(
      { message: "Conta criada. Fica pendente de aprovação por um administrador antes de poder entrar." },
      { status: 202 },
    );
  }),

  // POST /api/forgot-password -> gera token de reset (sem envio de email real)
  http.post(`${BASE}/forgot-password`, async ({ request }) => {
    const { email } = (await request.json().catch(() => ({}))) as Partial<ForgotPasswordPayload>;
    const user = email ? usersFixtures.find((u) => u.email === email) : null;
    // Devolve sempre 204, exista ou não a conta — não revela existência do email.
    if (user) {
      const token = Math.random().toString(36).slice(2);
      setResetToken(user.email, token);
      // Este handler só corre quando VITE_API_MOCK="true" (main.tsx só arranca o
      // MSW nesse caso) — não há envio de email real em nenhum ambiente onde este
      // código executa, por isso o link fica sempre visível na consola.
      const link = `${window.location.origin}/redefinir-senha?token=${token}&email=${encodeURIComponent(user.email)}`;
       
      console.info(`[mock] Link de recuperação de password (${user.email}):`, link);
    }
    return new HttpResponse(null, { status: 204 });
  }),

  // POST /api/reset-password -> valida token + email, define nova password
  http.post(`${BASE}/reset-password`, async ({ request }) => {
    const { token, email, password } = (await request.json().catch(() => ({}))) as Partial<ResetPasswordPayload>;
    if (!token || !email || !password || resetTokensByEmail[email] !== token) {
      return HttpResponse.json({ message: "Token inválido ou expirado." }, { status: 422 });
    }
    setPassword(email, password);
    clearResetToken(email);
    return new HttpResponse(null, { status: 204 });
  }),

  // PATCH /api/user/password -> muda a password do utilizador autenticado
  http.patch(`${BASE}/user/password`, async ({ request }) => {
    const user = userByToken(request);
    if (!user) {
      return HttpResponse.json({ message: "Não autenticado." }, { status: 401 });
    }
    const { currentPassword, password } = (await request.json().catch(() => ({}))) as Partial<ChangePasswordPayload>;
    if (!currentPassword || !password) {
      return HttpResponse.json({ message: "Password em falta." }, { status: 422 });
    }
    if (passwordByEmail[user.email] !== currentPassword) {
      return HttpResponse.json({ message: "Password actual incorrecta." }, { status: 422 });
    }
    setPassword(user.email, password);
    return new HttpResponse(null, { status: 204 });
  }),

  // GET /api/user -> resolve a sessão actual a partir do token Bearer
  http.get(`${BASE}/user`, ({ request }) => {
    const user = userByToken(request);
    if (!user) {
      return HttpResponse.json({ message: "Não autenticado." }, { status: 401 });
    }
    return HttpResponse.json(user);
  }),
];

export default authHandlers;
