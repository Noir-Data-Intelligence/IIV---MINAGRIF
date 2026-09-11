/**
 * DTO de Laboratório — contrato exacto do JSON REST para o recurso `laboratorios`
 * (espelha `App\Http\Resources\LaboratorioResource` no backend Laravel).
 *
 * Catálogo das 8 áreas laboratoriais + Sala de Incubação (REQ-005 §8). Os
 * campos `validadorCount`/`slaHoras`/`validadoresNomeados` parametrizam o
 * `LabWorkflowService` do backend (validação dupla/tripla, lista nomeada da
 * Bacteriologia, SLA por disciplina) — ver Onda 3 na SIG-IIV-MEMORIA-PROJETO.md.
 */
export interface LaboratorioDto {
  id: string;
  code: string;
  name: string;
  type: string | null;
  description: string | null;
  validadorCount: number;
  slaHoras: number | null;
  validadoresNomeados: string[] | null;
  isActive: boolean;
  /**
   * Regra de SLA aplicada de forma independente por laboratório (pedido do
   * cliente: "total autonomia de configuração de alertas para cada
   * componente"). `null` = SLA não configurado para este laboratório.
   */
  slaRuleType:
    | "horas_desde_entrada"
    | "horas_desde_entrada_diferenciado"
    | "dias_uteis"
    | "gate_qualidade"
    | null;
  /** Só relevante quando `slaRuleType === "horas_desde_entrada_diferenciado"` (ex. Bacteriologia: 24h negativo). */
  slaHorasNegativo: number | null;
  /** Só relevante quando `slaRuleType === "dias_uteis"` (ex. Microbiologia Alimentar: 5 dias). */
  slaDias: number | null;
  slaActive: boolean;
  slaSeverity: "warning" | "destructive";
  createdAt: string;
}

/** Parâmetros de listagem paginada/filtrada de laboratórios. */
export interface LaboratorioListParams {
  page?: number;
  perPage?: number;
  search?: string;
}
