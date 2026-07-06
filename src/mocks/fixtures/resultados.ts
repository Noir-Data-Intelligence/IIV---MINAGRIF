import type { ResultadoDto } from "@/types/dto/resultado";

/**
 * Dados fictícios de resultados laboratoriais (lab_results) do IIV. Cada resultado
 * está ligado (1:1) a uma análise com status "concluida" em `fixtures/analises.ts`
 * (ana-0002, 0003, 0004, 0006, 0007, 0008, 0009, 0011, 0014, 0015).
 *
 * NOTA: mutável (`let`) — os handlers create/update/delete operam sobre este array.
 */
export let resultadosFixtures: ResultadoDto[] = [
  {
    id: "res-0001",
    analysisId: "ana-0003",
    resultText:
      "Identificados ovos de Haemonchus contortus em elevada carga parasitária (OPG > 2000). Recomenda-se tratamento anti-helmíntico e reavaliação em 21 dias.",
    concludedAt: "2026-06-22T15:30:00.000Z",
  },
  {
    id: "res-0002",
    analysisId: "ana-0004",
    resultText:
      "PCR negativo para o vírus da Doença de Newcastle. Não foi detectado material genético viral na amostra analisada.",
    concludedAt: "2026-06-20T11:00:00.000Z",
  },
  {
    id: "res-0003",
    analysisId: "ana-0006",
    resultText:
      "Isolado de Escherichia coli com resistência a ampicilina, tetraciclina e sulfametoxazol-trimetoprim. Sensível a gentamicina e enrofloxacina.",
    concludedAt: "2026-06-18T09:45:00.000Z",
  },
  {
    id: "res-0004",
    analysisId: "ana-0008",
    resultText:
      "Exame histopatológico compatível com degenerescência hepática difusa de origem tóxica. Ausência de sinais de neoplasia.",
    concludedAt: "2026-06-25T14:20:00.000Z",
  },
  {
    id: "res-0005",
    analysisId: "ana-0011",
    resultText:
      "Cultura positiva para Salmonella spp. Confirmada por provas bioquímicas. Encaminhado para serotipagem complementar.",
    concludedAt: "2026-06-27T10:10:00.000Z",
  },
  {
    id: "res-0006",
    analysisId: "ana-0014",
    resultText:
      "PCR positivo para Staphylococcus aureus em amostra de leite, compatível com mastite subclínica. Recomenda-se maneio de ordenha e terapêutica dirigida.",
    concludedAt: "2026-06-14T16:00:00.000Z",
  },
  {
    id: "res-0007",
    analysisId: "ana-0002",
    resultText:
      "Cultura bacteriana sem crescimento de agentes patogénicos relevantes após 48 horas de incubação. Flora comensal habitual.",
    concludedAt: "2026-06-26T09:30:00.000Z",
  },
  {
    id: "res-0008",
    analysisId: "ana-0007",
    resultText:
      "Pesquisa de hemoparasitas negativa. Não foram observadas formas parasitárias no esfregaço sanguíneo corado.",
    concludedAt: "2026-06-21T12:00:00.000Z",
  },
  {
    id: "res-0009",
    analysisId: "ana-0009",
    resultText:
      "PCR positivo para o vírus da Peste Suína Africana. Resultado comunicado de imediato às autoridades sanitárias para activação do plano de contingência.",
    concludedAt: "2026-06-23T08:15:00.000Z",
  },
  {
    id: "res-0010",
    analysisId: "ana-0015",
    resultText:
      "Serologia negativa para o vírus da Febre Aftosa. Títulos de anticorpos abaixo do limiar de detecção do ensaio.",
    concludedAt: "2026-06-28T11:45:00.000Z",
  },
];

/** Substitui o conteúdo do array em memória (usado pelos handlers de escrita). */
export function setResultadosFixtures(next: ResultadoDto[]) {
  resultadosFixtures = next;
}
