import type {
  AlertHistoryDto,
  AlertActionStatus,
  AlertTone,
} from "@/types/dto/dashboardAlertHistory";

/**
 * Histórico de alertas fictício da sessão actual (`userId: "me"`), MUTÁVEL em
 * memória — os handlers create/update/clear operam sobre este array (perde-se
 * no refresh, comportamento esperado de um mock).
 *
 * Os registos são gerados nos últimos ~30 dias para dar uma tendência plausível
 * ao gráfico de `HistoricoAlertas.tsx`. `assignedTo` usa ids reais de
 * `mocks/fixtures/users.ts` e `assignedDepartmentId` ids de
 * `mocks/fixtures/departamentos.ts`; os respectivos nomes são resolvidos pelo
 * handler no momento da resposta (join simulado).
 */
export const ME_USER_ID = "me";

interface Seed {
  metricKey: string;
  label: string;
  tone: AlertTone;
  value: number;
  threshold: number;
  daysAgo: number;
  hour: number;
  assignedTo: string | null;
  assignedDepartmentId: string | null;
  actionStatus: AlertActionStatus;
  actionNotes: string | null;
}

const META: Record<string, { label: string; tone: AlertTone; threshold: number }> = {
  lowStock: { label: "Stock Crítico", tone: "destructive", threshold: 1 },
  expiringSoon: { label: "Lotes a Expirar", tone: "warning", threshold: 1 },
  ncOpen: { label: "Não Conformidades", tone: "destructive", threshold: 1 },
  analysesPending: { label: "Análises Pendentes", tone: "warning", threshold: 20 },
};

// Padrão de disparos ao longo do último mês (métrica, valor, dias atrás, hora,
// responsável, departamento, estado, notas).
const SEEDS: Array<[string, number, number, number, string | null, string | null, AlertActionStatus, string | null]> = [
  ["lowStock", 3, 28, 9, "usr-0003", "dep-0002", "resolvido", "Reposição de stock efectuada."],
  ["analysesPending", 24, 27, 14, "usr-0003", "dep-0002", "resolvido", "Análises redistribuídas pela equipa."],
  ["ncOpen", 2, 25, 10, "usr-0002", "dep-0001", "resolvido", "NC encerrada após acção correctiva."],
  ["expiringSoon", 4, 24, 8, null, null, "pendente", null],
  ["lowStock", 5, 21, 11, "usr-0004", "dep-0002", "em_curso", "Pedido de compra em curso."],
  ["analysesPending", 22, 20, 15, "usr-0003", null, "em_curso", null],
  ["ncOpen", 3, 18, 9, "usr-0002", "dep-0001", "em_curso", "A rever plano de acção."],
  ["expiringSoon", 6, 17, 16, "usr-0005", "dep-0003", "resolvido", "Lotes escoados dentro do prazo."],
  ["lowStock", 4, 15, 10, null, "dep-0002", "pendente", null],
  ["analysesPending", 26, 14, 13, "usr-0003", "dep-0002", "pendente", null],
  ["ncOpen", 4, 12, 8, "usr-0002", "dep-0001", "pendente", null],
  ["expiringSoon", 7, 11, 14, null, null, "pendente", null],
  ["lowStock", 6, 9, 9, "usr-0004", "dep-0002", "em_curso", "Fornecedor contactado."],
  ["analysesPending", 28, 8, 11, null, null, "pendente", null],
  ["ncOpen", 5, 6, 10, "usr-0002", "dep-0001", "pendente", null],
  ["expiringSoon", 5, 5, 15, "usr-0005", "dep-0003", "em_curso", "A priorizar distribuição."],
  ["lowStock", 7, 3, 8, null, null, "pendente", null],
  ["analysesPending", 30, 2, 12, "usr-0003", "dep-0002", "pendente", null],
  ["ncOpen", 6, 1, 9, null, "dep-0001", "pendente", null],
  ["expiringSoon", 8, 0, 10, null, null, "pendente", null],
];

function build(seed: Seed): AlertHistoryDto {
  const d = new Date();
  d.setDate(d.getDate() - seed.daysAgo);
  d.setHours(seed.hour, 0, 0, 0);
  const createdAt = d.toISOString();
  const assigned = seed.assignedTo !== null || seed.assignedDepartmentId !== null;
  return {
    id: `alh-${seed.metricKey}-${seed.daysAgo}-${seed.hour}`,
    metricKey: seed.metricKey,
    label: seed.label,
    value: seed.value,
    threshold: seed.threshold,
    tone: seed.tone,
    entityType: null,
    entityId: null,
    origem: "browser",
    createdAt,
    userId: ME_USER_ID,
    assignedTo: seed.assignedTo,
    assignedDepartmentId: seed.assignedDepartmentId,
    actionStatus: seed.actionStatus,
    actionNotes: seed.actionNotes,
    assignedAt: assigned ? createdAt : null,
    resolvedAt:
      seed.actionStatus === "resolvido"
        ? new Date(d.getTime() + 3 * 3600 * 1000).toISOString()
        : null,
    assignedToName: null,
    assignedDepartmentName: null,
  };
}

export const dashboardAlertHistoryFixtures: AlertHistoryDto[] = SEEDS.map(
  ([metricKey, value, daysAgo, hour, assignedTo, assignedDepartmentId, actionStatus, actionNotes]) =>
    build({
      metricKey,
      label: META[metricKey].label,
      tone: META[metricKey].tone,
      value,
      threshold: META[metricKey].threshold,
      daysAgo,
      hour,
      assignedTo,
      assignedDepartmentId,
      actionStatus,
      actionNotes,
    }),
);
