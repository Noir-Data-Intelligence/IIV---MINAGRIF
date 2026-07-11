import type { NaoConformidadeDto } from "@/types/dto/naoConformidade";

/**
 * Dados fictícios mas realistas de não-conformidades do IIV (Instituto de
 * Investigação Veterinária). Servem os handlers MSW enquanto o backend Laravel
 * não existe.
 *
 * Os `departmentId`/`auditId` apontam para ids reais de `fixtures/departamentos.ts`
 * e `fixtures/auditorias.ts`; os campos `departmentName`/`auditTitle` guardam o
 * nome/título resolvido (como faria uma API Resource do Laravel), para leitura
 * directa na página.
 *
 * Cobrem as várias gravidades (menor/maior/critica) e estados
 * (aberta/em_resolucao/resolvida/encerrada), incluindo prazos vencidos.
 *
 * NOTA: exportado como `let` para ser MUTÁVEL — os handlers create/update/delete
 * operam sobre este array em memória (reset no refresh do browser).
 */
export let naoConformidadesFixtures: NaoConformidadeDto[] = [
  {
    id: "nc-0001",
    title: "Registos de calibração de termocicladores incompletos",
    description:
      "Dois termocicladores do Laboratório de Virologia não possuem registo de calibração actualizado, detectado durante a auditoria interna.",
    severity: "maior",
    status: "em_resolucao",
    correctiveAction:
      "Contratar calibração externa acreditada e associar cada certificado ao equipamento no sistema de gestão.",
    deadline: "2024-04-30",
    resolvedAt: null,
    departmentId: "dep-0002",
    auditId: "aud-0001",
    departmentName: "Virologia",
    auditTitle: "Auditoria interna ao Laboratório de Virologia",
    createdAt: "2024-02-14T15:00:00.000Z",
  },
  {
    id: "nc-0002",
    title: "Falta de contrato com operador de recolha de resíduos certificado",
    description:
      "A recolha de resíduos biológicos está a ser feita sem contrato formal com operador certificado, contrariando o plano de gestão de resíduos.",
    severity: "critica",
    status: "aberta",
    correctiveAction: null,
    deadline: "2024-05-15",
    resolvedAt: null,
    departmentId: "dep-0008",
    auditId: "aud-0004",
    departmentName: "Qualidade e Metrologia",
    auditTitle: "Auditoria externa à gestão de resíduos laboratoriais",
    createdAt: "2024-03-29T11:30:00.000Z",
  },
  {
    id: "nc-0003",
    title: "Rotulagem de estirpes de referência sem data de validade",
    description:
      "Algumas estirpes de referência do Laboratório de Bacteriologia estão rotuladas sem data de validade nem lote de origem.",
    severity: "menor",
    status: "resolvida",
    correctiveAction:
      "Reetiquetagem completa das estirpes com data de validade, lote e responsável, e actualização do procedimento interno.",
    deadline: "2024-06-20",
    resolvedAt: "2024-06-10T09:00:00.000Z",
    departmentId: "dep-0003",
    auditId: "aud-0003",
    departmentName: "Bacteriologia",
    auditTitle: "Auditoria interna ao processo de antibiogramas",
    createdAt: "2024-06-06T08:00:00.000Z",
  },
  {
    id: "nc-0004",
    title: "Temperatura de arca congeladora fora do intervalo definido",
    description:
      "Registo de temperatura da arca de conservação de amostras a -68°C, acima do limite de -70°C estabelecido no procedimento.",
    severity: "critica",
    status: "encerrada",
    correctiveAction:
      "Substituição do compressor da arca e reforço da monitorização contínua com alarme automático. Amostras verificadas sem perda de integridade.",
    deadline: "2023-12-15",
    resolvedAt: "2023-12-08T14:20:00.000Z",
    departmentId: "dep-0004",
    auditId: "aud-0005",
    departmentName: "Parasitologia",
    auditTitle: "Auditoria interna à conservação de amostras",
    createdAt: "2023-11-16T10:00:00.000Z",
  },
  {
    id: "nc-0005",
    title: "Ausência de plano de formação em biossegurança actualizado",
    description:
      "O plano anual de formação em biossegurança não foi revisto no último ano, faltando registo de acções para os novos técnicos.",
    severity: "maior",
    status: "em_resolucao",
    correctiveAction:
      "Elaborar novo plano de formação e agendar sessões trimestrais com registo de presenças.",
    deadline: "2026-12-31",
    resolvedAt: null,
    departmentId: "dep-0002",
    auditId: null,
    departmentName: "Virologia",
    auditTitle: null,
    createdAt: "2024-05-02T09:45:00.000Z",
  },
  {
    id: "nc-0006",
    title: "Análise bromatológica sem duplicado de controlo",
    description:
      "Lote de análises bromatológicas realizado sem amostra de controlo em duplicado, dificultando a validação dos resultados.",
    severity: "menor",
    status: "aberta",
    correctiveAction: null,
    deadline: "2024-08-01",
    resolvedAt: null,
    departmentId: "dep-0006",
    auditId: "aud-0006",
    departmentName: "Nutrição e Alimentação Animal",
    auditTitle: "Auditoria interna ao controlo microbiológico de alimentos",
    createdAt: "2024-07-02T11:00:00.000Z",
  },
  {
    id: "nc-0007",
    title: "Procedimento de antibiograma sem revisão documental",
    description:
      "O procedimento operacional de execução de antibiogramas encontra-se com versão desactualizada face às normas EUCAST em vigor.",
    severity: "maior",
    status: "aberta",
    correctiveAction: null,
    deadline: "2024-03-01",
    resolvedAt: null,
    departmentId: "dep-0003",
    auditId: "aud-0003",
    departmentName: "Bacteriologia",
    auditTitle: "Auditoria interna ao processo de antibiogramas",
    createdAt: "2024-06-06T08:30:00.000Z",
  },
  {
    id: "nc-0008",
    title: "Falta de rastreabilidade dos meios de cultura",
    description:
      "Não é possível rastrear o lote e a data de preparação de alguns meios de cultura utilizados nos ensaios microbiológicos.",
    severity: "menor",
    status: "resolvida",
    correctiveAction:
      "Implementação de folha de registo de preparação de meios com lote, data e técnico responsável.",
    deadline: "2024-07-15",
    resolvedAt: "2024-07-11T16:00:00.000Z",
    departmentId: "dep-0006",
    auditId: null,
    departmentName: "Nutrição e Alimentação Animal",
    auditTitle: null,
    createdAt: "2024-06-20T09:15:00.000Z",
  },
];

/** Substitui o conteúdo do array em memória (usado pelos handlers de escrita). */
export function setNaoConformidadesFixtures(next: NaoConformidadeDto[]) {
  naoConformidadesFixtures = next;
}
