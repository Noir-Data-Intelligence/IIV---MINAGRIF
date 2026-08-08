import type { BoletimInternoDto } from "@/types/dto/boletim";

/**
 * DTO de Amostra — contrato REST do recurso `amostras`, espelha
 * `App\Http\Resources\AmostraResource`. N amostras por requisição (RN
 * "anexo para lotes"); `sujeito` guarda os dados do animal OU do paciente
 * humano num único JSON (par FM-SQ-041/046 partilha a mesma estrutura).
 */
export type AmostraStatus = "recebida" | "aceite" | "rejeitada";

export interface AmostraRejeicaoDto {
  id: string;
  amostraId: string;
  criterioRejeicaoId: string;
  responsavelId: string;
  detalhe: string | null;
  assinaturaResponsavel: string;
  rejeitadaEm: string;
}

export interface AmostraDto {
  id: string;
  requisicaoId: string;
  numero: string;
  tipoAmostra: string;
  origemMatriz: string | null;
  pontoColheita: string | null;
  colhidaPor: string | null;
  sujeito: Record<string, unknown> | null;
  recebidaEm: string;
  status: AmostraStatus;
  boletimInterno?: BoletimInternoDto | null;
  rejeicao?: AmostraRejeicaoDto | null;
}

/** Item do lote enviado dentro de `RequisicaoPayload.amostras`. */
export interface AmostraPayload {
  tipoAmostra: string;
  origemMatriz?: string | null;
  pontoColheita?: string | null;
  colhidaPor?: string | null;
  sujeito?: Record<string, unknown> | null;
}

/** Payload de rejeição na triagem — RN "Termo de Rejeição obrigatório". */
export interface RejeitarAmostraPayload {
  criterioRejeicaoId: string;
  assinaturaResponsavel: string;
  detalhe?: string | null;
}

/** Parâmetros de listagem paginada/filtrada de amostras. */
export interface AmostraListParams {
  page?: number;
  perPage?: number;
  requisicaoId?: string;
  status?: AmostraStatus;
}
