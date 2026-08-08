/**
 * DTO de Critério de Rejeição — contrato REST do recurso `criterios-rejeicao`,
 * espelha `App\Http\Resources\CriterioRejeicaoResource`. Catálogo de motivos
 * (FM-SQ-061 geral, FM-SQ-075 alimentar) — `laboratorioId` nulo = motivo
 * geral, aplicável a qualquer área.
 */
export interface CriterioRejeicaoDto {
  id: string;
  laboratorioId: string | null;
  codigo: string;
  motivo: string;
}

export interface CriterioRejeicaoPayload {
  laboratorioId?: string | null;
  codigo: string;
  motivo: string;
}
