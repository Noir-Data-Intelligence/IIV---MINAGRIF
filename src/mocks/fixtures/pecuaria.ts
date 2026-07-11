import type { ProdDto } from "@/types/dto/pecuaria";

/**
 * Dados fictícios mas plausíveis dos registos de produção pecuária das estações
 * do IIV (Instituto de Investigação Veterinária de Angola). Servem os handlers
 * MSW enquanto o backend Laravel não existe.
 *
 * Os `stationId` referem estações de `fixtures/estacoes.ts` (est-0001..est-0006).
 *
 * NOTA: exportado como `let` para ser MUTÁVEL — os handlers create/update/delete
 * operam sobre este array em memória, persistindo alterações durante a sessão do
 * browser (perde-se no refresh, comportamento esperado de um mock).
 */
export let producaoFixtures: ProdDto[] = [
  {
    id: "prod-0001",
    stationId: "est-0001", // Humpata
    productType: "Leite",
    productionDate: "2026-07-08",
    quantity: 420,
    unit: "L",
    recordedBy: "Eng. Amílcar Kandingi",
    notes: "Ordenha matinal do efectivo bovino de raça autóctone.",
    createdAt: "2026-07-08T08:30:00.000Z",
  },
  {
    id: "prod-0002",
    stationId: "est-0001", // Humpata
    productType: "Leite",
    productionDate: "2026-07-01",
    quantity: 405,
    unit: "L",
    recordedBy: "Eng. Amílcar Kandingi",
    notes: null,
    createdAt: "2026-07-01T08:30:00.000Z",
  },
  {
    id: "prod-0003",
    stationId: "est-0003", // Malanje
    productType: "Ovos",
    productionDate: "2026-07-06",
    quantity: 1350,
    unit: "unid.",
    recordedBy: "Téc. Ngueve Bumba",
    notes: "Recolha semanal do aviário de postura.",
    createdAt: "2026-07-06T16:00:00.000Z",
  },
  {
    id: "prod-0004",
    stationId: "est-0003", // Malanje
    productType: "Ovos",
    productionDate: "2026-06-29",
    quantity: 1280,
    unit: "unid.",
    recordedBy: "Téc. Ngueve Bumba",
    notes: null,
    createdAt: "2026-06-29T16:00:00.000Z",
  },
  {
    id: "prod-0005",
    stationId: "est-0006", // Cuando Cubango
    productType: "Carne",
    productionDate: "2026-06-20",
    quantity: 680,
    unit: "kg",
    recordedBy: "Dr. Kwame Chivukuvuku",
    notes: "Abate controlado de 3 cabeças de bovino para ensaio de rendimento.",
    createdAt: "2026-06-20T11:00:00.000Z",
  },
  {
    id: "prod-0006",
    stationId: "est-0004", // Mazozo
    productType: "Mel",
    productionDate: "2026-05-15",
    quantity: 95,
    unit: "kg",
    recordedBy: "Téc. Isabel Nzuzi",
    notes: "Colheita de mel do apiário experimental.",
    createdAt: "2026-05-15T09:45:00.000Z",
  },
  {
    id: "prod-0007",
    stationId: "est-0002", // Chianga
    productType: "Leite",
    productionDate: "2026-07-09",
    quantity: 310,
    unit: "L",
    recordedBy: "Eng. Paulo Sacaia",
    notes: "Ensaio de suplementação alimentar; leite para análise bromatológica.",
    createdAt: "2026-07-09T08:15:00.000Z",
  },
  {
    id: "prod-0008",
    stationId: "est-0001", // Humpata
    productType: "Leite",
    productionDate: "2026-06-24",
    quantity: 398,
    unit: "L",
    recordedBy: "Eng. Amílcar Kandingi",
    notes: null,
    createdAt: "2026-06-24T08:30:00.000Z",
  },
  {
    id: "prod-0009",
    stationId: "est-0003", // Malanje
    productType: "Carne",
    productionDate: "2026-06-10",
    quantity: 240,
    unit: "kg",
    recordedBy: "Téc. Ngueve Bumba",
    notes: "Produção caprina para avaliação de carcaça.",
    createdAt: "2026-06-10T10:30:00.000Z",
  },
  {
    id: "prod-0010",
    stationId: "est-0006", // Cuando Cubango
    productType: "Outro",
    productionDate: "2026-05-30",
    quantity: 120,
    unit: "kg",
    recordedBy: "Dr. Kwame Chivukuvuku",
    notes: "Estrume compostado para adubação dos talhões forrageiros.",
    createdAt: "2026-05-30T14:20:00.000Z",
  },
];

/** Substitui o conteúdo do array em memória (usado pelos handlers de escrita). */
export function setProducaoFixtures(next: ProdDto[]) {
  producaoFixtures = next;
}
