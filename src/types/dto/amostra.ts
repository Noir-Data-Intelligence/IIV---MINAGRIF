import type { BoletimInternoDto } from "@/types/dto/boletim";
import type { AmostraConferenciaDto } from "@/types/dto/lab";

/**
 * DTO de Amostra — contrato REST do recurso `amostras`, espelha
 * `App\Http\Resources\AmostraResource`. N amostras por requisição (RN
 * "anexo para lotes"); `sujeito` guarda os dados do animal OU do paciente
 * humano num único JSON (par FM-SQ-041/046 partilha a mesma estrutura).
 */
export type AmostraStatus =
  | "recebida"
  | "em_conferencia"
  | "aceite"
  | "aceite_com_reserva"
  | "rejeitada"
  | "em_processamento"
  | "concluida";

export interface AmostraRejeicaoDto {
  id: string;
  amostraId: string;
  criterioRejeicaoId: string;
  responsavelId: string;
  detalhe: string | null;
  assinaturaResponsavel: string;
  rejeitadaEm: string;
  /** Redesenho DEF-001: fase da rejeição e 2ª assinatura do Termo de Rejeição. */
  fase?: "recepcao" | "area";
  laboratorioId?: string | null;
  boletimInternoId?: string | null;
  segundoResponsavelId?: string | null;
  assinaturaSegundo?: string | null;
  origemNotificadaEm?: string | null;
  accaoTomada?: string | null;
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
  latitude: number | null;
  longitude: number | null;
  recebidaEm: string;
  status: AmostraStatus;
  aceiteEm?: string | null;
  aceiteComReserva?: boolean;
  reservaMotivo?: string | null;
  /** PAT-###-ANO-A{n}, atribuído ao abrir o processo. */
  codigoBarras?: string | null;
  amostraOrigemId?: string | null;
  localizacaoActual?: string | null;
  /** Estado da amostra dentro de um BI (pendente|em_ensaio|concluida|rejeitada_na_area). */
  estadoNoBoletim?: string;
  /** @deprecated modelo antigo (1 BI por amostra). */
  boletimInterno?: BoletimInternoDto | null;
  rejeicao?: AmostraRejeicaoDto | null;
  rejeicoes?: AmostraRejeicaoDto[];
  conferencias?: AmostraConferenciaDto[];
}

/** Item do lote enviado dentro de `RequisicaoPayload.amostras`. */
export interface AmostraPayload {
  tipoAmostra: string;
  origemMatriz?: string | null;
  pontoColheita?: string | null;
  colhidaPor?: string | null;
  sujeito?: Record<string, unknown> | null;
  latitude?: number | null;
  longitude?: number | null;
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
