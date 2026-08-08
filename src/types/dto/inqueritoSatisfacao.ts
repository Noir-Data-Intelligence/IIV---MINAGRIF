/**
 * DTO de Inquérito de Satisfação — contrato REST do recurso
 * `inqueritos-satisfacao`, espelha `App\Http\Resources\InqueritoSatisfacaoResource`.
 * FM-SQ-066 — entidade desacoplada, disparada pós-entrega do boletim.
 */
export interface InqueritoSatisfacaoDto {
  id: string;
  requisicaoId: string;
  dimensoes: Record<string, string>;
  comentario: string | null;
  createdAt: string;
}

export interface InqueritoSatisfacaoPayload {
  requisicaoId: string;
  dimensoes: Record<string, string>;
  comentario?: string | null;
}
