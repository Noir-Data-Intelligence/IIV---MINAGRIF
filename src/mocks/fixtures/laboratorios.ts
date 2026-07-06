import type { LaboratorioDto } from "@/types/dto/laboratorio";

/**
 * Dados fictícios mas realistas dos laboratórios do IIV. Servem os handlers MSW
 * enquanto o backend Laravel não existe.
 *
 * NOTA: exportado como `let` para ser MUTÁVEL — os handlers create/update/delete
 * operam sobre este array em memória (reset no refresh do browser).
 */
export let laboratoriosFixtures: LaboratorioDto[] = [
  {
    id: "lab-0001",
    name: "Laboratório de Virologia",
    type: "virologia",
    description:
      "Diagnóstico e caracterização de agentes virais animais (febre aftosa, peste suína africana, doença de Newcastle).",
    isActive: true,
    createdAt: "2023-02-03T10:30:00.000Z",
  },
  {
    id: "lab-0002",
    name: "Laboratório de Bacteriologia",
    type: "bacteriologia",
    description:
      "Isolamento e identificação de agentes bacterianos, antibiogramas e vigilância da resistência antimicrobiana.",
    isActive: true,
    createdAt: "2023-02-10T08:45:00.000Z",
  },
  {
    id: "lab-0003",
    name: "Laboratório de Parasitologia",
    type: "parasitologia",
    description:
      "Diagnóstico de doenças parasitárias dos efectivos pecuários, incluindo hemoparasitoses e endoparasitas.",
    isActive: true,
    createdAt: "2023-03-01T11:15:00.000Z",
  },
  {
    id: "lab-0004",
    name: "Laboratório de Diagnóstico Molecular",
    type: "diagnostico_molecular",
    description:
      "Técnicas de PCR, RT-PCR e sequenciação para detecção e caracterização molecular de agentes patogénicos.",
    isActive: true,
    createdAt: "2023-04-12T09:00:00.000Z",
  },
  {
    id: "lab-0005",
    name: "Laboratório de Microbiologia de Alimentos",
    type: "microbiologia_alimentos",
    description:
      "Controlo microbiológico de alimentos de origem animal e avaliação da segurança alimentar.",
    isActive: false,
    createdAt: "2023-05-20T14:30:00.000Z",
  },
  {
    id: "lab-0006",
    name: "Laboratório de Patologia",
    type: "patologia",
    description:
      "Exames anatomopatológicos e histopatológicos para diagnóstico de lesões e causas de mortalidade animal.",
    isActive: true,
    createdAt: "2023-06-08T08:20:00.000Z",
  },
];

/** Substitui o conteúdo do array em memória (usado pelos handlers de escrita). */
export function setLaboratoriosFixtures(next: LaboratorioDto[]) {
  laboratoriosFixtures = next;
}
