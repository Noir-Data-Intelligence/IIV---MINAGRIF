import type { AmostraDto, AmostraPayload } from "@/types/dto/amostra";

/**
 * DTO de Requisição — contrato REST do recurso `requisicoes`, espelha
 * `App\Http\Resources\RequisicaoResource`. Cabeçalho de intake (FM-SQ-040/
 * 041/042/046/047, FM-CGISC-073); o lote de amostras associado é criado na
 * mesma chamada (ver `RequisicaoPayload`).
 */
export type TipoSujeito = "animal" | "humano";

export interface RequisicaoDto {
  id: string;
  numero: string;
  laboratorioId: string;
  tipoSujeito: TipoSujeito;
  clienteNome: string;
  clienteContacto: string | null;
  veterinarioResponsavel: string | null;
  dadosEpidemiologicos: Record<string, unknown> | null;
  dadosFacturacao: Record<string, unknown> | null;
  consentimento: boolean;
  assinaturaCliente: string | null;
  createdBy: string;
  createdAt: string;
  amostras?: AmostraDto[];
}

/** Payload de criação — cria a requisição e o lote de amostras numa só chamada. */
export interface RequisicaoPayload {
  laboratorioId: string;
  tipoSujeito: TipoSujeito;
  clienteNome: string;
  clienteContacto?: string | null;
  veterinarioResponsavel?: string | null;
  dadosEpidemiologicos?: Record<string, unknown> | null;
  dadosFacturacao?: Record<string, unknown> | null;
  consentimento: boolean;
  assinaturaCliente: string;
  amostras: AmostraPayload[];
}

/** Parâmetros de listagem paginada/filtrada de requisições. */
export interface RequisicaoListParams {
  page?: number;
  perPage?: number;
  laboratorioId?: string;
  search?: string;
}
