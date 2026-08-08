import type { LaboratorioDto } from "@/types/dto/laboratorio";

/**
 * Dados fictícios mas realistas dos laboratórios do IIV. Servem os handlers MSW
 * enquanto o backend Laravel não existe.
 *
 * NOTA: IDs (`lab-0001`..`lab-0006`) mantidos estáveis de propósito — são
 * referenciados por `fixtures/analises.ts` (ainda usado pelo Dashboard/BI
 * para KPIs agregados, ver nota em `pages/admin/Laboratorios.tsx`). Os campos
 * `validadorCount`/`slaHoras`/`validadoresNomeados` (Onda 3) são novos e
 * demonstram o `LabWorkflowService` do backend real — Bacteriologia (lab-0002)
 * usa 3 validadores nomeados, replicando a RN da REQ-005.
 *
 * NOTA: exportado como `let` para ser MUTÁVEL — os handlers create/update/delete
 * operam sobre este array em memória (reset no refresh do browser).
 */
export let laboratoriosFixtures: LaboratorioDto[] = [
  {
    id: "lab-0001",
    code: "AR",
    name: "Laboratório de Virologia",
    type: "virologia",
    description:
      "Diagnóstico e caracterização de agentes virais animais (febre aftosa, peste suína africana, doença de Newcastle).",
    validadorCount: 2,
    slaHoras: 48,
    validadoresNomeados: null,
    isActive: true,
    createdAt: "2023-02-03T10:30:00.000Z",
  },
  {
    id: "lab-0002",
    code: "AB",
    name: "Laboratório de Bacteriologia",
    type: "bacteriologia",
    description:
      "Isolamento e identificação de agentes bacterianos, antibiogramas e vigilância da resistência antimicrobiana.",
    validadorCount: 3,
    slaHoras: 72,
    // usr-0005 (tecnico@iiv.demo), usr-0003 (director-laboratorio@iiv.demo), usr-0001 (admin@iiv.demo) — ver mocks/fixtures/users.ts.
    validadoresNomeados: ["usr-0005", "usr-0003", "usr-0001"],
    isActive: true,
    createdAt: "2023-02-10T08:45:00.000Z",
  },
  {
    id: "lab-0003",
    code: "AP",
    name: "Laboratório de Parasitologia",
    type: "parasitologia",
    description:
      "Diagnóstico de doenças parasitárias dos efectivos pecuários, incluindo hemoparasitoses e endoparasitas.",
    validadorCount: 2,
    slaHoras: null,
    validadoresNomeados: null,
    isActive: true,
    createdAt: "2023-03-01T11:15:00.000Z",
  },
  {
    id: "lab-0004",
    code: "BM",
    name: "Laboratório de Diagnóstico Molecular",
    type: "diagnostico_molecular",
    description:
      "Técnicas de PCR, RT-PCR e sequenciação para detecção e caracterização molecular de agentes patogénicos.",
    validadorCount: 2,
    slaHoras: 24,
    validadoresNomeados: null,
    isActive: true,
    createdAt: "2023-04-12T09:00:00.000Z",
  },
  {
    id: "lab-0005",
    code: "AMA",
    name: "Laboratório de Microbiologia de Alimentos",
    type: "microbiologia_alimentos",
    description:
      "Controlo microbiológico de alimentos de origem animal e avaliação da segurança alimentar.",
    validadorCount: 2,
    slaHoras: 120,
    validadoresNomeados: null,
    isActive: false,
    createdAt: "2023-05-20T14:30:00.000Z",
  },
  {
    id: "lab-0006",
    code: "AS",
    name: "Laboratório de Patologia",
    type: "patologia",
    description:
      "Exames anatomopatológicos e histopatológicos para diagnóstico de lesões e causas de mortalidade animal.",
    validadorCount: 2,
    slaHoras: null,
    validadoresNomeados: null,
    isActive: true,
    createdAt: "2023-06-08T08:20:00.000Z",
  },
];

/** Substitui o conteúdo do array em memória (usado pelos handlers de escrita). */
export function setLaboratoriosFixtures(next: LaboratorioDto[]) {
  laboratoriosFixtures = next;
}
