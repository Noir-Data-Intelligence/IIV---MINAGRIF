/**
 * Equipas de Técnicos por laboratório (pedido do cliente: "gestão de
 * equipas"). Chave = `laboratorioId` (ver `mocks/fixtures/laboratorios.ts`),
 * valor = lista de `{ userId, funcao }` — os nomes/emails são resolvidos
 * pelo handler a partir de `mocks/fixtures/users.ts` (join simulado, tal
 * como uma API Resource faria com `whenLoaded`).
 *
 * NOTA: exportado como `let` para ser MUTÁVEL — os handlers add/remove
 * operam sobre este objecto em memória (perde-se no refresh).
 */
export let laboratorioTecnicosFixtures: Record<string, Array<{ userId: string; funcao: string | null }>> = {
  // Bacteriologia (lab-0002) — mesmos utilizadores já usados em `validadoresNomeados`.
  "lab-0002": [
    { userId: "usr-0005", funcao: "Técnico de bancada" },
    { userId: "usr-0003", funcao: "Chefe de Secção" },
  ],
};

export function setLaboratorioTecnicosFixtures(next: Record<string, Array<{ userId: string; funcao: string | null }>>) {
  laboratorioTecnicosFixtures = next;
}
