/**
 * DTOs de Boletim Interno (BI) e Boletim de Análises (BA) — contrato REST do
 * recurso `boletins`, espelha `App\Http\Resources\BoletimInternoResource` e
 * `BoletimAnaliseResource`. O BI é o único documento que circula entre a
 * Recepção e a área (RN); o BA guarda o resultado e as assinaturas de
 * validação dupla/tripla.
 */
export type BoletimStatus =
  | "em_analise"
  | "resultado_registado"
  | "em_validacao"
  | "aprovado"
  | "comunicado";

export interface BoletimAnaliseDto {
  id: string;
  boletimInternoId: string;
  resultado: Record<string, unknown> | null;
  validador1Id: string | null;
  validador2Id: string | null;
  validador3Id: string | null;
  validadoEm: string | null;
  aprovadoPorId: string | null;
  aprovadoEm: string | null;
  comunicadoEm: string | null;
}

export interface BoletimInternoDto {
  id: string;
  amostraId: string;
  numeroAnalise: string;
  exames: Record<string, unknown> | null;
  entradaEm: string;
  inicioEm: string | null;
  conclusaoEm: string | null;
  status: BoletimStatus;
  boletimAnalise?: BoletimAnaliseDto | null;
}

/** Parâmetros de listagem paginada/filtrada de boletins. */
export interface BoletimListParams {
  page?: number;
  perPage?: number;
  status?: BoletimStatus;
}
