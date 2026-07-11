/**
 * DTO de Histórico de Alertas do Painel — contrato REST do recurso
 * `dashboard-alert-history`.
 *
 * Espelha a tabela Supabase `dashboard_alert_history` em camelCase (backend
 * Laravel via API Resources): `metric_key` -> `metricKey`, `action_status` ->
 * `actionStatus`, `assigned_to` -> `assignedTo`, etc.
 *
 * Recurso PARTILHADO entre dois módulos:
 *  - `Dashboard.tsx` insere uma linha (POST) quando uma métrica cruza o limiar
 *    configurado (o handler faz debounce de 1 hora por métrica).
 *  - `HistoricoAlertas.tsx` faz o CRUD de gestão: lista/filtra, atribui a um
 *    utilizador/departamento e resolve (PUT), exporta e limpa (DELETE).
 *
 * `assignedTo` referencia um `UserDto` (via `useUsersList`) e
 * `assignedDepartmentId` um `DepartamentoDto` (via `useDepartamentosList`) —
 * ambos opcionais (null enquanto não atribuídos). O handler devolve
 * `assignedToName`/`assignedDepartmentName` já resolvidos, tal como uma API
 * Resource faria `whenLoaded('assignee')->fullName`, poupando ao cliente um
 * segundo pedido só para a etiqueta.
 */
export type AlertActionStatus = "pendente" | "em_curso" | "resolvido";

/** Tonalidade semântica do alerta (herdada da métrica que o disparou). */
export type AlertTone = "warning" | "destructive";

export interface AlertHistoryDto {
  id: string;
  metricKey: string;
  label: string;
  value: number;
  threshold: number;
  tone: AlertTone;
  createdAt: string;
  /** Utilizador dono do registo ("me" — a sessão actual simulada, ver fixtures). */
  userId: string;
  assignedTo: string | null;
  assignedDepartmentId: string | null;
  actionStatus: AlertActionStatus;
  actionNotes: string | null;
  assignedAt: string | null;
  resolvedAt: string | null;
  /** Nomes já resolvidos pelo handler (join simulado). */
  assignedToName: string | null;
  assignedDepartmentName: string | null;
}

/** Parâmetros de listagem paginada/filtrada do histórico de alertas. */
export interface AlertHistoryListParams {
  page?: number;
  perPage?: number;
  /** Filtro por métrica (lowStock/expiringSoon/ncOpen/analysesPending). */
  metricKey?: string;
  /** Filtro por estado da acção. */
  actionStatus?: string;
  /** Intervalo de datas (ISO date, inclusivo). */
  from?: string;
  to?: string;
}

/** Payload de criação de um registo de alerta (usado pelo Dashboard). */
export interface CreateAlertHistoryPayload {
  metricKey: string;
  label: string;
  value: number;
  threshold: number;
  tone: AlertTone;
}

/** Payload de actualização (atribuição/resolução — usado por HistoricoAlertas). */
export interface UpdateAlertHistoryPayload {
  assignedTo?: string | null;
  assignedDepartmentId?: string | null;
  actionStatus?: AlertActionStatus;
  actionNotes?: string | null;
}
