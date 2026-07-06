import i18n from "@/i18n";

/**
 * Helpers centralizados de formatação (data, número, Kwanza), preparados para variar consoante
 * o idioma activo da app (i18next, PT/EN). Substituem os `new Date(x).toLocaleDateString("pt-AO")`
 * hoje espalhados por várias páginas (ex: src/pages/Noticias.tsx, src/pages/admin/Missoes.tsx),
 * que assumem sempre "pt-AO" independentemente do idioma escolhido pelo utilizador.
 */

/** Mapeia o idioma da app ("pt"/"en") para o locale BCP-47 a usar nas Intl APIs. */
function resolveLocale(locale?: string): string {
  const lang = locale ?? i18n.language ?? "pt";
  if (lang.startsWith("en")) return "en-GB";
  if (lang.startsWith("pt")) return "pt-AO";
  return "pt-AO";
}

/** Formata uma data (string ISO ou Date) segundo o locale resolvido. */
export function formatDate(date: string | Date, locale?: string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(resolveLocale(locale));
}

/** Formata um número segundo o locale resolvido. */
export function formatNumber(value: number, locale?: string): string {
  return new Intl.NumberFormat(resolveLocale(locale)).format(value);
}

/** Formata um valor monetário em Kwanza (AOA) segundo o locale resolvido. */
export function formatKwanza(value: number, locale?: string): string {
  return new Intl.NumberFormat(resolveLocale(locale), {
    style: "currency",
    currency: "AOA",
  }).format(value);
}
