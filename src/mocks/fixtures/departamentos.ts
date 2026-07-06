import type { DepartamentoDto } from "@/types/dto/departamento";

/**
 * Dados fictícios mas realistas da estrutura organizacional do IIV (Instituto de
 * Investigação Veterinária de Angola). Servem os handlers MSW enquanto o backend
 * Laravel não existe. Inclui uma hierarquia simples (alguns departamentos têm
 * `parentId` a apontar para outro) e datas de criação variadas.
 *
 * NOTA: exportado como `let` para ser MUTÁVEL — os handlers create/update/delete
 * operam sobre este array em memória, persistindo alterações durante a sessão do
 * browser (perde-se no refresh, que é o comportamento esperado de um mock).
 */
export let departamentosFixtures: DepartamentoDto[] = [
  {
    id: "dep-0001",
    name: "Investigação e Desenvolvimento",
    description:
      "Coordena os programas de investigação aplicada do instituto e a articulação com parceiros científicos nacionais e internacionais.",
    parentId: null,
    createdAt: "2023-01-15T09:00:00.000Z",
  },
  {
    id: "dep-0002",
    name: "Virologia",
    description:
      "Diagnóstico e caracterização de agentes virais animais, incluindo febre aftosa, peste suína africana e doença de Newcastle.",
    parentId: "dep-0001",
    createdAt: "2023-02-03T10:30:00.000Z",
  },
  {
    id: "dep-0003",
    name: "Bacteriologia",
    description:
      "Isolamento e identificação de agentes bacterianos, antibiogramas e vigilância da resistência antimicrobiana.",
    parentId: "dep-0001",
    createdAt: "2023-02-10T08:45:00.000Z",
  },
  {
    id: "dep-0004",
    name: "Parasitologia",
    description:
      "Estudo e diagnóstico de doenças parasitárias que afectam os efectivos pecuários, incluindo hemoparasitoses e endoparasitas.",
    parentId: "dep-0001",
    createdAt: "2023-03-01T11:15:00.000Z",
  },
  {
    id: "dep-0005",
    name: "Produção Animal",
    description:
      "Apoio técnico à melhoria dos sistemas de produção pecuária, maneio e bem-estar animal.",
    parentId: null,
    createdAt: "2023-03-22T14:00:00.000Z",
  },
  {
    id: "dep-0006",
    name: "Nutrição e Alimentação Animal",
    description:
      "Formulação de rações, avaliação de recursos alimentares locais e análise bromatológica de alimentos para animais.",
    parentId: "dep-0005",
    createdAt: "2023-04-05T09:20:00.000Z",
  },
  {
    id: "dep-0007",
    name: "Reprodução e Genética",
    description:
      "Programas de melhoramento genético, inseminação artificial e conservação de raças autóctones.",
    parentId: "dep-0005",
    createdAt: "2023-05-18T10:00:00.000Z",
  },
  {
    id: "dep-0008",
    name: "Qualidade e Metrologia",
    description:
      "Garantia da qualidade laboratorial, calibração de equipamentos e acreditação de métodos analíticos.",
    parentId: null,
    createdAt: "2023-06-30T13:40:00.000Z",
  },
  {
    id: "dep-0009",
    name: "Recursos Humanos",
    description:
      "Gestão de pessoal, formação contínua dos quadros técnicos e administração de carreiras.",
    parentId: null,
    createdAt: "2023-07-12T08:30:00.000Z",
  },
  {
    id: "dep-0010",
    name: "Financeiro e Património",
    description:
      "Gestão orçamental, contabilidade, aprovisionamento e controlo do património do instituto.",
    parentId: null,
    createdAt: "2023-08-09T15:10:00.000Z",
  },
];

/** Substitui o conteúdo do array em memória (usado pelos handlers de escrita). */
export function setDepartamentosFixtures(next: DepartamentoDto[]) {
  departamentosFixtures = next;
}
