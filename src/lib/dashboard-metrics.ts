/**
 * Helpers partilhados de agregação/formatação do Painel de Controlo, usados por
 * `Dashboard.tsx` e `PainelDetalhe.tsx`. Centralizam a lógica de "stock crítico",
 * "a expirar em 30 dias" e "no mês corrente" que antes vivia duplicada em queries
 * Supabase de cada página.
 */

export const fmtDate = (s?: string | null) =>
  s ? new Date(s).toLocaleDateString("pt-PT") : "—";

export const fmtDateTime = (s?: string | null) =>
  s ? new Date(s).toLocaleString("pt-PT", { dateStyle: "short", timeStyle: "short" }) : "—";

/** true se `dateStr` cai no ano/mês indicados (por omissão, o mês corrente). */
export function isInMonth(dateStr: string | null | undefined, year?: number, month?: number): boolean {
  if (!dateStr) return false;
  const now = new Date();
  const y = year ?? now.getFullYear();
  const m = month ?? now.getMonth();
  const d = new Date(dateStr);
  return d.getFullYear() === y && d.getMonth() === m;
}

/** true se a data está no mês corrente. */
export const isCurrentMonth = (dateStr: string | null | undefined) => isInMonth(dateStr);

/** true se `expiry` está entre hoje e daqui a `days` dias (por omissão 30). */
export function isExpiringSoon(expiry: string | null | undefined, days = 30): boolean {
  if (!expiry) return false;
  const now = new Date();
  const limit = new Date(now.getTime() + days * 86_400_000);
  const d = new Date(expiry);
  return d >= now && d <= limit;
}

/**
 * true se `expiry` já passou. Métrica distinta de `isExpiringSoon` — sem
 * esta, um lote deixa de contar para "a expirar" no exacto momento em que
 * expira e nunca chega a gerar alerta (ver auditoria funcional — Histórico
 * de Alertas).
 */
export function isExpired(expiry: string | null | undefined): boolean {
  if (!expiry) return false;
  return new Date(expiry) < new Date();
}
