import { usersFixtures } from "@/mocks/fixtures/users";
import { primaryRole } from "@/lib/permissions";

/**
 * Palavras-passe mock por email (nunca existiu tabela Supabase de origem —
 * ver PLANO-BACKEND-LARAVEL.txt secção 2, "desenhado de raiz").
 *
 * Seed inicial: `<papel principal>123`, o mesmo padrão já usado pelo painel
 * de contas demo em `Login.tsx` (ex. `admin123`, `gestor123`). Mutável para
 * suportar registo/recuperação/alteração de password — persiste durante a
 * sessão do browser, reset no refresh, tal como as restantes fixtures.
 */
export let passwordByEmail: Record<string, string> = Object.fromEntries(
  usersFixtures.map((u) => [u.email, `${primaryRole(u.roles)}123`]),
);

export function setPassword(email: string, password: string) {
  passwordByEmail = { ...passwordByEmail, [email]: password };
}

/** Tokens de recuperação de password em memória: email -> token. */
export let resetTokensByEmail: Record<string, string> = {};

export function setResetToken(email: string, token: string) {
  resetTokensByEmail = { ...resetTokensByEmail, [email]: token };
}

export function clearResetToken(email: string) {
  const next = { ...resetTokensByEmail };
  delete next[email];
  resetTokensByEmail = next;
}
