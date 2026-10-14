import type { AmostraDto, AmostraPayload } from "@/types/dto/amostra";
import type { BoletimStatus } from "@/types/dto/boletim";
import type { RequisicaoDto } from "@/types/dto/requisicao";
import type { LaboratorioDto } from "@/types/dto/laboratorio";

/**
 * DTOs do Laboratório por fase (redesenho DEF-001/002/003) — espelham os
 * Resources do backend em `App\Http\Resources` (RequisicaoResource,
 * BoletimInternoResource, BoletimAnaliseResource, ExameCatalogoResource,
 * EnsaioResource, ValidacaoResource, AmostraConferenciaResource,
 * AmostraMovimentoResource) e as rotas `/api/lab/*`.
 *
 * Fluxo: Recepção (CGISC) -> Encaminhamento -> Área (ensaio + validação) ->
 * Devolução -> Emissão do Boletim de Análises (CGISC) -> Entrega -> Encerramento.
 */

export type RequisicaoStatus =
  | "registada"
  | "em_triagem"
  | "rejeitada"
  | "processo_aberto"
  | "em_processamento"
  | "aguarda_emissao"
  | "emitida"
  | "encerrada";

export type OrigemTipo = "publica" | "privada" | "singular";
export type ResultadoQualitativo = "positivo" | "negativo" | "inconclusivo";
export type CanalEntrega = "presencial" | "email" | "isv" | "portal";

/** Campo do schema de resultado de um exame (`exames_catalogo.campos_resultado`). */
export interface CampoResultado {
  chave: string;
  tipo: "numero" | "texto" | "booleano" | "opcao";
  rotulo?: string | null;
  unidade?: string | null;
  obrigatorio?: boolean;
  opcoes?: string[];
}

export interface ExameCatalogoDto {
  id: string;
  laboratorioId: string;
  laboratorioCode?: string | null;
  codigo: string;
  nome: string;
  tecnicaMetodo: string | null;
  popCodigo: string | null;
  tiposAmostra: string[];
  slaHoras: number | null;
  camposResultado: CampoResultado[];
  activo: boolean;
}

export interface ExameCatalogoPayload {
  laboratorioId: string;
  codigo: string;
  nome: string;
  tecnicaMetodo?: string | null;
  popCodigo?: string | null;
  tiposAmostra?: string[];
  slaHoras?: number | null;
  camposResultado?: CampoResultado[];
  activo?: boolean;
}

export interface RequisicaoExameDto {
  id: string;
  requisicaoId: string;
  amostraId: string | null;
  exameId: string;
  laboratorioId: string;
  laboratorioCode?: string | null;
  boletimInternoId: string | null;
  exame?: ExameCatalogoDto;
}

export interface AmostraConferenciaDto {
  id: string;
  amostraId: string;
  tecnicoId: string;
  tecnicoNome?: string | null;
  ordem: 1 | 2;
  criterios: {
    identificacao: boolean;
    quantidade: boolean;
    conservacao: boolean;
    macroscopica: boolean;
    caracteristicasFisicas: boolean;
    tempoColheita: boolean;
  };
  conforme: boolean;
  observacao: string | null;
  createdAt: string | null;
}

export interface EnsaioDto {
  id: string;
  boletimInternoId: string;
  amostraId: string;
  exameId: string;
  tecnica: string | null;
  popCodigo: string | null;
  equipamentoId: string | null;
  loteReagente: string | null;
  executorId: string;
  executorNome?: string | null;
  segundoIntervenienteId: string | null;
  visualizadorId: string | null;
  iniciadoEm: string | null;
  concluidoEm: string | null;
  resultado: Record<string, unknown> | null;
  resultadoQualitativo: ResultadoQualitativo | null;
  interpretacao: string | null;
}

export interface ValidacaoDto {
  id: string;
  boletimInternoId: string;
  validadorId: string;
  validadorNome?: string | null;
  ordem: number;
  tipo: "segundo" | "terceiro" | "hierarquica" | "qualidade";
  assinatura: string | null;
  observacao: string | null;
  createdAt: string | null;
}

export interface BoletimAnaliseLabDto {
  id: string;
  boletimInternoId: string;
  numero: string | null;
  requisicaoId: string | null;
  laboratorioId: string | null;
  conteudo: Record<string, unknown> | null;
  emitidoPorId: string | null;
  emitidoEm: string | null;
  assinadoPorId: string | null;
  assinaturaHash: string | null;
  pdfPath: string | null;
  entregueEm: string | null;
  entregueA: string | null;
  canalEntrega: CanalEntrega | null;
  isvNotificadoEm: string | null;
}

export interface BoletimInternoLabDto {
  id: string;
  numero: string | null;
  numeroAnalise: string;
  requisicaoId: string | null;
  laboratorioId: string | null;
  laboratorio?: Pick<LaboratorioDto, "id" | "code" | "name" | "validadorCount" | "validadoresNomeados"> | null;
  requisicao?: {
    id: string;
    numero: string;
    patNumero: string | null;
    clienteNome: string;
    origemTipo: OrigemTipo | null;
    status: RequisicaoStatus;
  } | null;
  exames: string[] | Record<string, unknown> | null;
  entradaEm: string;
  inicioEm: string | null;
  conclusaoEm: string | null;
  prazoEm: string | null;
  status: BoletimStatus;
  resultadoGlobal: ResultadoQualitativo | null;
  encaminhadoEm: string | null;
  recebidoAreaEm: string | null;
  recebidoAreaPorId: string | null;
  responsavelTecnicoId: string | null;
  devolvidoEm: string | null;
  recebidoCgiscEm: string | null;
  motivoCorreccao: string | null;
  biOrigemId: string | null;
  amostras?: AmostraDto[];
  examesPedidos?: RequisicaoExameDto[];
  ensaios?: EnsaioDto[];
  validacoes?: ValidacaoDto[];
  boletimAnalise?: BoletimAnaliseLabDto | null;
}

export interface RequisicaoLabDto extends Omit<RequisicaoDto, "amostras"> {
  status: RequisicaoStatus;
  origemTipo: OrigemTipo | null;
  provenienciaLocal: boolean;
  termoEntregaNumero: string | null;
  termoEntregaAssinadoPor: string | null;
  entreguePor: string | null;
  entregueEm: string | null;
  conservacao: string | null;
  colheitaEm: string | null;
  doencasSuspeitas: string | null;
  patNumero: string | null;
  processoAbertoEm: string | null;
  encerradaEm: string | null;
  /** Áreas derivadas dos exames pedidos ("Será encaminhada para: X, Y"). */
  areas?: string[];
  amostras?: AmostraDto[];
  exames?: RequisicaoExameDto[];
  boletinsInternos?: BoletimInternoLabDto[];
  boletinsAnalises?: BoletimAnaliseLabDto[];
}

export interface AmostraMovimentoDto {
  id: string;
  amostraId: string;
  boletimInternoId: string | null;
  accao: string;
  deLocal: string | null;
  paraLocal: string | null;
  userId: string | null;
  userNome?: string | null;
  observacao: string | null;
  createdAt: string | null;
}

export interface FilaAreaDto {
  laboratorio: LaboratorioDto;
  porReceber: BoletimInternoLabDto[];
  emAnalise: BoletimInternoLabDto[];
  emValidacao: BoletimInternoLabDto[];
  validados: BoletimInternoLabDto[];
}

export interface FilaEmissaoDto {
  devolvidos: BoletimInternoLabDto[];
  aEmitir: BoletimInternoLabDto[];
  emitidos: BoletimInternoLabDto[];
  porEncerrar: RequisicaoLabDto[];
}

export interface ProcessoLabDto {
  requisicao: RequisicaoLabDto;
  movimentos: AmostraMovimentoDto[];
}

export interface EtiquetasDto {
  pat: string | null;
  amostras: { amostraId: string; codigoBarras: string; numero: string; tipoAmostra: string; areas: string[]; qrPayload: string }[];
  boletins: { boletimInternoId: string; codigoBarras: string; area: string | null; qrPayload: string }[];
}

export interface ColegaDto {
  id: string;
  fullName: string;
  roles: string[];
}

// --- Payloads ---------------------------------------------------------------

export interface ExamePedidoPayload {
  exameId: string;
  /** Índices (0-based) das amostras do lote; omisso/vazio = todas. */
  amostraIndices?: number[] | null;
}

export interface RegistarRequisicaoPayload {
  tipoSujeito: "animal" | "humano";
  clienteNome: string;
  clienteContacto?: string | null;
  veterinarioResponsavel?: string | null;
  consentimento: boolean;
  assinaturaCliente: string;
  origemTipo: OrigemTipo;
  provenienciaLocal: boolean;
  termoEntregaAssinadoPor?: string | null;
  entreguePor?: string | null;
  conservacao?: string | null;
  colheitaEm?: string | null;
  doencasSuspeitas?: string | null;
  amostras: AmostraPayload[];
  exames: ExamePedidoPayload[];
}

/** Chaves = colunas `crit_*` do backend (AmostraConferencia::CRITERIOS). */
export type CriteriosConferencia = Record<
  | "crit_identificacao"
  | "crit_quantidade"
  | "crit_conservacao"
  | "crit_macroscopica"
  | "crit_caracteristicas_fisicas"
  | "crit_tempo_colheita",
  boolean
>;

export interface ConferenciaPayload {
  criterios: CriteriosConferencia;
  observacao?: string | null;
}

export interface RejeitarRecepcaoPayload {
  criterioRejeicaoId: string;
  assinaturaResponsavel: string;
  segundoResponsavelId: string;
  assinaturaSegundo: string;
  detalhe?: string | null;
  accaoTomada?: string | null;
}

export interface RegistarEnsaioPayload {
  amostraId: string;
  exameId: string;
  tecnica?: string | null;
  popCodigo?: string | null;
  equipamentoId?: string | null;
  loteReagente?: string | null;
  resultado?: Record<string, unknown> | null;
  resultadoQualitativo?: ResultadoQualitativo | null;
  interpretacao?: string | null;
}

export interface RejeitarNaAreaPayload extends Omit<RejeitarRecepcaoPayload, "accaoTomada"> {
  amostraIds: string[];
}

export interface ReencaminharPayload {
  laboratorioId: string;
  exameIds: string[];
  amostraIds?: string[] | null;
  motivo: string;
  duplicar?: boolean;
}

export interface EntregarPayload {
  entregueA: string;
  canal: CanalEntrega;
  pagamentoConfirmado?: boolean;
}

export interface RecepcaoListParams {
  page?: number;
  perPage?: number;
  status?: RequisicaoStatus[];
  search?: string;
}

export interface EncaminhamentosListParams {
  page?: number;
  perPage?: number;
  laboratorio?: string;
  status?: BoletimStatus[];
  search?: string;
}
