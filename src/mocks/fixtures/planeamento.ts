import type { PlanoDto } from "@/types/dto/plano";

/**
 * Planos de produção fictícios do IIV, referenciando os produtos de
 * `fixtures/produtos.ts`. Inclui planos concluídos (com `actualQuantity`) e
 * planos em curso/planeados (`actualQuantity` a null), para o gráfico
 * "Planeado vs Real".
 *
 * `let` mutável — os handlers de escrita operam sobre este array em memória.
 */
export let planeamentoFixtures: PlanoDto[] = [
  {
    id: "plano-0001",
    productId: "prod-0001",
    plannedQuantity: 5000,
    actualQuantity: 4800,
    plannedStart: "2026-01-05",
    plannedEnd: "2026-02-05",
    status: "concluida",
    notes: "Produção anual da vacina PPR.",
  },
  {
    id: "plano-0002",
    productId: "prod-0002",
    plannedQuantity: 12000,
    actualQuantity: 12500,
    plannedStart: "2026-01-20",
    plannedEnd: "2026-03-01",
    status: "concluida",
    notes: "Excedeu a meta devido à procura avícola.",
  },
  {
    id: "plano-0003",
    productId: "prod-0008",
    plannedQuantity: 20000,
    actualQuantity: 15000,
    plannedStart: "2026-04-01",
    plannedEnd: "2026-06-30",
    status: "em_producao",
    notes: "Campanha de febre aftosa em curso.",
  },
  {
    id: "plano-0004",
    productId: "prod-0003",
    plannedQuantity: 6000,
    actualQuantity: 3200,
    plannedStart: "2026-03-10",
    plannedEnd: "2026-07-10",
    status: "em_producao",
    notes: null,
  },
  {
    id: "plano-0005",
    productId: "prod-0004",
    plannedQuantity: 1500,
    actualQuantity: null,
    plannedStart: "2026-07-15",
    plannedEnd: "2026-09-15",
    status: "planeada",
    notes: "Aguarda matéria-prima importada.",
  },
  {
    id: "plano-0006",
    productId: "prod-0007",
    plannedQuantity: 500,
    actualQuantity: null,
    plannedStart: "2026-08-01",
    plannedEnd: "2026-09-30",
    status: "planeada",
    notes: "Kits PCR para a época de vigilância.",
  },
  {
    id: "plano-0007",
    productId: "prod-0005",
    plannedQuantity: 1000,
    actualQuantity: 300,
    plannedStart: "2026-02-15",
    plannedEnd: "2026-05-15",
    status: "suspensa",
    notes: "Suspensa por não conformidade no controlo de qualidade.",
  },
  {
    id: "plano-0008",
    productId: "prod-0006",
    plannedQuantity: 800,
    actualQuantity: 820,
    plannedStart: "2026-01-10",
    plannedEnd: "2026-03-20",
    status: "concluida",
    notes: null,
  },
];

/** Substitui o conteúdo do array em memória (usado pelos handlers de escrita). */
export function setPlaneamentoFixtures(next: PlanoDto[]) {
  planeamentoFixtures = next;
}
