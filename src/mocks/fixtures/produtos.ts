import type { ProdutoDto } from "@/types/dto/produto";

/**
 * Catálogo fictício mas credível de produtos veterinários do IIV (vacinas, soros
 * e reagentes). Serve os handlers MSW enquanto o backend Laravel não existe.
 *
 * Inclui 2 produtos arquivados (`isArchived: true`) para exercitar a tab
 * "Arquivados" da página.
 *
 * NOTA: exportado como `let` para ser MUTÁVEL — os handlers create/update/delete/
 * archive/restore operam sobre este array em memória, persistindo alterações
 * durante a sessão do browser (perde-se no refresh, comportamento esperado).
 */
export let produtosFixtures: ProdutoDto[] = [
  {
    id: "prod-0001",
    name: "Vacina contra a Peste dos Pequenos Ruminantes (PPR)",
    productType: "vacina",
    description: "Vacina viva atenuada para imunização de caprinos e ovinos contra a PPR.",
    unit: "dose",
    isArchived: false,
    createdAt: "2024-02-11T09:00:00.000Z",
  },
  {
    id: "prod-0002",
    name: "Vacina contra a Doença de Newcastle",
    productType: "vacina",
    description: "Vacina liofilizada para aves, estirpe La Sota, administração ocular ou na água.",
    unit: "dose",
    isArchived: false,
    createdAt: "2024-03-04T10:30:00.000Z",
  },
  {
    id: "prod-0003",
    name: "Vacina contra a Raiva Animal",
    productType: "vacina",
    description: "Vacina inactivada para cães e gado, protecção anti-rábica de longa duração.",
    unit: "dose",
    isArchived: false,
    createdAt: "2024-03-19T08:45:00.000Z",
  },
  {
    id: "prod-0004",
    name: "Soro Antitetânico Veterinário",
    productType: "soro",
    description: "Soro hiperimune para prevenção e tratamento do tétano em equinos e ruminantes.",
    unit: "ml",
    isArchived: false,
    createdAt: "2024-04-22T11:15:00.000Z",
  },
  {
    id: "prod-0005",
    name: "Soro Antiofídico Polivalente",
    productType: "soro",
    description: "Soro para tratamento de envenenamento por picada de serpentes em animais de produção.",
    unit: "ml",
    isArchived: false,
    createdAt: "2024-05-08T14:00:00.000Z",
  },
  {
    id: "prod-0006",
    name: "Reagente para Diagnóstico de Brucelose (Rosa de Bengala)",
    productType: "reagente",
    description: "Antígeno tamponado para despiste serológico de brucelose em bovinos e caprinos.",
    unit: "frasco",
    isArchived: false,
    createdAt: "2024-05-27T09:20:00.000Z",
  },
  {
    id: "prod-0007",
    name: "Reagente PCR para Peste Suína Africana",
    productType: "reagente",
    description: "Kit de reagentes para detecção molecular do vírus da PSA por PCR em tempo real.",
    unit: "frasco",
    isArchived: false,
    createdAt: "2024-06-14T10:00:00.000Z",
  },
  {
    id: "prod-0008",
    name: "Vacina contra a Febre Aftosa (bivalente)",
    productType: "vacina",
    description: "Vacina inactivada bivalente para bovinos, estirpes O e A, adjuvante oleoso.",
    unit: "dose",
    isArchived: false,
    createdAt: "2024-07-01T13:40:00.000Z",
  },
  {
    id: "prod-0009",
    name: "Soro Anticarbunculoso (lote piloto)",
    productType: "soro",
    description: "Soro em fase de descontinuação, substituído pela nova formulação de 2025.",
    unit: "ml",
    isArchived: true,
    createdAt: "2023-09-10T08:30:00.000Z",
  },
  {
    id: "prod-0010",
    name: "Reagente ELISA para Leucose Bovina (formulação antiga)",
    productType: "reagente",
    description: "Kit ELISA descontinuado; mantido no histórico para rastreabilidade dos lotes antigos.",
    unit: "frasco",
    isArchived: true,
    createdAt: "2023-10-02T15:10:00.000Z",
  },
];

/** Substitui o conteúdo do array em memória (usado pelos handlers de escrita). */
export function setProdutosFixtures(next: ProdutoDto[]) {
  produtosFixtures = next;
}
