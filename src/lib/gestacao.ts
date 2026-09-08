/**
 * Períodos médios de gestação por espécie, usados para calcular
 * automaticamente a data prevista do parto de um registo de inseminação
 * (auditoria funcional, secção 16 — o campo deixou de ser preenchido à mão).
 *
 * O domínio não tem (ainda) nenhum campo de "período médio de gestação"
 * configurável — nem em `Animal`, nem em qualquer entidade de espécie —, pelo
 * que estes valores de referência zootécnica ficam centralizados aqui. As
 * espécies acompanham os valores possíveis de `Animal.species` no backend
 * (`AnimalFactory`: bovino, suino, caprino, ovino, avicola).
 */
export const GESTATION_DAYS: Record<string, number> = {
  bovino: 283,
  caprino: 150,
  ovino: 152,
  suino: 114,
  equino: 340,
  coelho: 31,
};

/** Fallback quando a espécie do animal não consta da tabela acima (ex: avícola). */
export const DEFAULT_GESTATION_DAYS = 283;

/** Dias de gestação da espécie indicada (case-insensitive), com fallback. */
export function gestationDaysFor(species: string | null | undefined): number {
  if (!species) return DEFAULT_GESTATION_DAYS;
  return GESTATION_DAYS[species.trim().toLowerCase()] ?? DEFAULT_GESTATION_DAYS;
}

/**
 * Data prevista do parto = data da inseminação + dias de gestação da espécie.
 * Devolve `null` (em vez de uma data inválida) quando falta a data base.
 * Formato ISO `YYYY-MM-DD`, igual ao resto dos campos de data do módulo.
 */
export function calcExpectedBirthDate(
  inseminationDate: string | null | undefined,
  species: string | null | undefined,
): string | null {
  if (!inseminationDate) return null;
  const base = new Date(`${inseminationDate}T00:00:00`);
  if (Number.isNaN(base.getTime())) return null;
  base.setDate(base.getDate() + gestationDaysFor(species));
  return base.toISOString().slice(0, 10);
}

/** true se `expected` cai entre hoje e daqui a `days` dias (por omissão 7). */
export function isBirthUpcoming(expected: string | null | undefined, days = 7): boolean {
  if (!expected) return false;
  const d = new Date(`${expected}T00:00:00`);
  if (Number.isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const limit = new Date(today);
  limit.setDate(limit.getDate() + days);
  return d >= today && d <= limit;
}
