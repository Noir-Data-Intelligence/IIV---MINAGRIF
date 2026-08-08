import type { BoletimAnaliseDto, BoletimInternoDto } from "@/types/dto/boletim";

/**
 * Boletins Internos (BI) + Boletins de Análises (BA) — cobrem os vários
 * estados do workflow (em_analise/resultado_registado/em_validacao/aprovado/
 * comunicado), replicando o `LabWorkflowService` do backend real.
 */
export let boletinsFixtures: BoletimInternoDto[] = [
  {
    id: "bol-0001",
    amostraId: "amo-0002",
    numeroAnalise: "PAT-002-2026",
    exames: { solicitados: ["Cultura bacteriana", "Antibiograma"] },
    entradaEm: "2026-06-16T10:20:00.000Z",
    inicioEm: "2026-06-16T10:20:00.000Z",
    conclusaoEm: "2026-06-18T09:00:00.000Z",
    status: "comunicado",
    boletimAnalise: {
      id: "ba-0001",
      boletimInternoId: "bol-0001",
      resultado: { parametros: { crescimento: "positivo" } },
      validador1Id: "usr-0005",
      validador2Id: "usr-0003",
      validador3Id: "usr-0001",
      validadoEm: "2026-06-18T08:30:00.000Z",
      aprovadoPorId: "usr-0001",
      aprovadoEm: "2026-06-18T08:30:00.000Z",
      comunicadoEm: "2026-06-18T09:00:00.000Z",
    },
  },
  {
    id: "bol-0002",
    amostraId: "amo-0004",
    numeroAnalise: "PAT-003-2026",
    exames: { solicitados: ["PCR Doença de Newcastle"] },
    entradaEm: "2026-06-10T11:10:00.000Z",
    inicioEm: "2026-06-10T11:10:00.000Z",
    conclusaoEm: null,
    status: "em_validacao",
    boletimAnalise: {
      id: "ba-0002",
      boletimInternoId: "bol-0002",
      resultado: { parametros: { ct: 21.4 } },
      validador1Id: "usr-0005",
      validador2Id: null,
      validador3Id: null,
      validadoEm: null,
      aprovadoPorId: null,
      aprovadoEm: null,
      comunicadoEm: null,
    },
  },
  {
    id: "bol-0003",
    amostraId: "amo-0006",
    numeroAnalise: "PAT-004-2026",
    exames: { solicitados: ["Coprologia parasitária"] },
    entradaEm: "2026-06-12T08:40:00.000Z",
    inicioEm: "2026-06-12T08:40:00.000Z",
    conclusaoEm: null,
    status: "em_analise",
    boletimAnalise: null,
  },
];

export function setBoletinsFixtures(next: BoletimInternoDto[]) {
  boletinsFixtures = next;
}

export let boletinsAnalisesFixtures: BoletimAnaliseDto[] =
  boletinsFixtures.flatMap((b) => (b.boletimAnalise ? [b.boletimAnalise] : []));

export function setBoletinsAnalisesFixtures(next: BoletimAnaliseDto[]) {
  boletinsAnalisesFixtures = next;
}

/**
 * `boletinsFixtures[i].boletimAnalise` é só o valor da semente inicial — a
 * fonte de verdade viva é `boletinsAnalisesFixtures` (mutada por
 * `handlers/boletins.ts`). Qualquer handler que devolva um `BoletimInternoDto`
 * (directamente ou aninhado numa amostra/requisição) tem de passar por aqui,
 * ou arrisca servir um `boletimAnalise` desactualizado — foi apanhado ao
 * testar o fluxo de validação no browser (Onda 3 frontend).
 */
export function hydrateBoletim(boletim: BoletimInternoDto): BoletimInternoDto {
  return {
    ...boletim,
    boletimAnalise: boletinsAnalisesFixtures.find((ba) => ba.boletimInternoId === boletim.id) ?? null,
  };
}
