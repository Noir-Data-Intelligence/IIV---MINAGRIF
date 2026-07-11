import type { ProcessTypeDto, ProcessTypeStepDto } from "@/types/dto/processType";

/**
 * Dados fictícios mas realistas dos tipos de processo do workflow administrativo
 * do IIV/MINAGRIF e das suas etapas-padrão. Servem os handlers MSW enquanto o
 * backend Laravel não existe.
 *
 * NOTA: exportados como `let` para serem MUTÁVEIS — os handlers de escrita
 * operam sobre estes arrays em memória, persistindo alterações durante a sessão
 * do browser (perde-se no refresh, comportamento esperado de um mock).
 */
export let processTypesFixtures: ProcessTypeDto[] = [
  {
    id: "ptype-0001",
    name: "Parecer Técnico",
    description:
      "Emissão de parecer técnico-científico sobre matérias de sanidade animal solicitadas por entidades externas ou internas.",
    icon: "FileCheck",
    slaDays: 15,
    isActive: true,
    createdAt: "2024-01-10T09:00:00.000Z",
  },
  {
    id: "ptype-0002",
    name: "Licenciamento Sanitário",
    description:
      "Processo de licenciamento sanitário de estabelecimentos pecuários, incluindo vistoria e análise documental.",
    icon: "ShieldCheck",
    slaDays: 30,
    isActive: true,
    createdAt: "2024-01-18T10:30:00.000Z",
  },
  {
    id: "ptype-0003",
    name: "Tratamento de Não Conformidade",
    description:
      "Fluxo de tratamento de não conformidades detectadas em auditorias, com investigação de causa e acção correctiva.",
    icon: "AlertTriangle",
    slaDays: 20,
    isActive: true,
    createdAt: "2024-02-05T08:45:00.000Z",
  },
  {
    id: "ptype-0004",
    name: "Aprovação de Lote",
    description:
      "Controlo de qualidade e aprovação de lotes de produção (vacinas, reagentes) antes da libertação para distribuição.",
    icon: "PackageCheck",
    slaDays: 10,
    isActive: true,
    createdAt: "2024-03-01T11:15:00.000Z",
  },
  {
    id: "ptype-0005",
    name: "Requisição Interna",
    description:
      "Pedido interno de material, reagentes ou serviços, com aprovação hierárquica e validação orçamental.",
    icon: "ClipboardList",
    slaDays: 5,
    isActive: true,
    createdAt: "2024-03-20T14:00:00.000Z",
  },
  {
    id: "ptype-0006",
    name: "Missão de Serviço (descontinuado)",
    description:
      "Antigo fluxo de autorização de missões de serviço, substituído pelo módulo de Missões. Mantido para histórico.",
    icon: "Plane",
    slaDays: null,
    isActive: false,
    createdAt: "2023-11-02T09:20:00.000Z",
  },
];

export let processTypeStepsFixtures: ProcessTypeStepDto[] = [
  // Parecer Técnico
  { id: "pstep-0001", processTypeId: "ptype-0001", orderIndex: 1, name: "Recepção e triagem", defaultRole: "gestor", slaDays: 2 },
  { id: "pstep-0002", processTypeId: "ptype-0001", orderIndex: 2, name: "Análise técnica", defaultRole: "tecnico", slaDays: 7 },
  { id: "pstep-0003", processTypeId: "ptype-0001", orderIndex: 3, name: "Revisão e validação", defaultRole: "diretor", slaDays: 3 },
  { id: "pstep-0004", processTypeId: "ptype-0001", orderIndex: 4, name: "Emissão do parecer", defaultRole: "gestor", slaDays: 3 },

  // Licenciamento Sanitário
  { id: "pstep-0005", processTypeId: "ptype-0002", orderIndex: 1, name: "Submissão do pedido", defaultRole: "colaborador", slaDays: 2 },
  { id: "pstep-0006", processTypeId: "ptype-0002", orderIndex: 2, name: "Vistoria ao estabelecimento", defaultRole: "tecnico", slaDays: 10 },
  { id: "pstep-0007", processTypeId: "ptype-0002", orderIndex: 3, name: "Análise documental", defaultRole: "gestor", slaDays: 7 },
  { id: "pstep-0008", processTypeId: "ptype-0002", orderIndex: 4, name: "Decisão", defaultRole: "diretor", slaDays: 5 },
  { id: "pstep-0009", processTypeId: "ptype-0002", orderIndex: 5, name: "Emissão da licença", defaultRole: "gestor", slaDays: 3 },

  // Tratamento de Não Conformidade
  { id: "pstep-0010", processTypeId: "ptype-0003", orderIndex: 1, name: "Registo da não conformidade", defaultRole: "gestor", slaDays: 1 },
  { id: "pstep-0011", processTypeId: "ptype-0003", orderIndex: 2, name: "Investigação de causa", defaultRole: "tecnico", slaDays: 7 },
  { id: "pstep-0012", processTypeId: "ptype-0003", orderIndex: 3, name: "Acção correctiva", defaultRole: "tecnico", slaDays: 10 },
  { id: "pstep-0013", processTypeId: "ptype-0003", orderIndex: 4, name: "Verificação de eficácia", defaultRole: "gestor", slaDays: 2 },

  // Aprovação de Lote
  { id: "pstep-0014", processTypeId: "ptype-0004", orderIndex: 1, name: "Requisição de controlo", defaultRole: "tecnico", slaDays: 1 },
  { id: "pstep-0015", processTypeId: "ptype-0004", orderIndex: 2, name: "Ensaios de controlo de qualidade", defaultRole: "tecnico", slaDays: 5 },
  { id: "pstep-0016", processTypeId: "ptype-0004", orderIndex: 3, name: "Aprovação e libertação", defaultRole: "diretor", slaDays: 3 },

  // Requisição Interna
  { id: "pstep-0017", processTypeId: "ptype-0005", orderIndex: 1, name: "Preenchimento da requisição", defaultRole: "colaborador", slaDays: 1 },
  { id: "pstep-0018", processTypeId: "ptype-0005", orderIndex: 2, name: "Aprovação da chefia", defaultRole: "gestor", slaDays: 2 },
  { id: "pstep-0019", processTypeId: "ptype-0005", orderIndex: 3, name: "Validação orçamental", defaultRole: "diretor", slaDays: 2 },
];

/** Substitui o array de tipos em memória (usado pelos handlers de escrita). */
export function setProcessTypesFixtures(next: ProcessTypeDto[]) {
  processTypesFixtures = next;
}

/** Substitui o array de etapas-padrão em memória (usado pelos handlers de escrita). */
export function setProcessTypeStepsFixtures(next: ProcessTypeStepDto[]) {
  processTypeStepsFixtures = next;
}
