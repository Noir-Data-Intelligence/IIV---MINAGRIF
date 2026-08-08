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
  createdAt: string;
}

/** Parâmetros de listagem paginada/filtrada de laboratórios. */
export interface LaboratorioListParams {
  page?: number;
  perPage?: number;
  search?: string;
}
