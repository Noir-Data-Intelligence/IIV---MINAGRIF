import { apiDelete, apiGet, apiPost, apiPut } from "@/services/api/client";
import { endpoints } from "@/services/api/endpoints";
import type { Paginated } from "@/types/dto/paginated";
import type { AmostraDto } from "@/types/dto/amostra";
import type { LaboratorioDto } from "@/types/dto/laboratorio";
import type {
  AmostraConferenciaDto,
  AmostraMovimentoDto,
  BoletimAnaliseLabDto,
  BoletimInternoLabDto,
  ColegaDto,
  ConferenciaPayload,
  EncaminhamentosListParams,
  EnsaioDto,
  EntregarPayload,
  EtiquetasDto,
  ExameCatalogoDto,
  ExameCatalogoPayload,
  FilaAreaDto,
  FilaEmissaoDto,
  ProcessoLabDto,
  RecepcaoListParams,
  ReencaminharPayload,
  RegistarEnsaioPayload,
  RegistarRequisicaoPayload,
  RejeitarNaAreaPayload,
  RejeitarRecepcaoPayload,
  RequisicaoLabDto,
} from "@/types/dto/lab";

/**
 * Serviço de dados do Laboratório por fase (redesenho DEF-001/002/003).
 * Mesmo padrão de `services/api/requisicoes.ts`: helpers de `client.ts` +
 * rotas de `endpoints.ts`. Nunca escreve `status` — só chama endpoints de
 * transição (o backend recusa transições inválidas com 422).
 */

// --- Catálogo / apoio ---------------------------------------------------------
export function listExames(params: { laboratorioId?: string; activos?: boolean; search?: string } = {}): Promise<ExameCatalogoDto[]> {
  const query: Record<string, string | number> = {};
  if (params.laboratorioId) query.laboratorio_id = params.laboratorioId;
  if (params.activos) query.activos = 1;
  if (params.search) query.search = params.search;
  return apiGet<ExameCatalogoDto[]>(endpoints.lab.exames, { params: query });
}
export const createExame = (payload: ExameCatalogoPayload) => apiPost<ExameCatalogoDto>(endpoints.lab.exames, payload);
export const updateExame = (id: string, payload: ExameCatalogoPayload) => apiPut<ExameCatalogoDto>(endpoints.lab.exame(id), payload);
export const deleteExame = (id: string) => apiDelete<ExameCatalogoDto | void>(endpoints.lab.exame(id));
export const listColegas = () => apiGet<{ data: ColegaDto[] }>(endpoints.lab.colegas).then((r) => r.data);

// --- Fase 1: Recepção (CGISC) ------------------------------------------------
export function listRecepcao(params: RecepcaoListParams): Promise<Paginated<RequisicaoLabDto>> {
  const query: Record<string, string | number> = { page: params.page ?? 1, per_page: params.perPage ?? 20 };
  if (params.status?.length) query.status = params.status.join(",");
  if (params.search) query.search = params.search;
  return apiGet<Paginated<RequisicaoLabDto>>(endpoints.lab.recepcao.requisicoes, { params: query });
}
export const getRecepcao = (id: string) => apiGet<RequisicaoLabDto>(endpoints.lab.recepcao.requisicao(id));
export const registarRequisicao = (payload: RegistarRequisicaoPayload) =>
  apiPost<RequisicaoLabDto>(endpoints.lab.recepcao.requisicoes, payload);
export const conferirAmostra = (amostraId: string, payload: ConferenciaPayload) =>
  apiPost<AmostraConferenciaDto>(endpoints.lab.recepcao.conferencias(amostraId), payload);
export const aceitarComReserva = (amostraId: string, motivo: string) =>
  apiPost<AmostraDto>(endpoints.lab.recepcao.aceitarComReserva(amostraId), { motivo });
export const rejeitarNaRecepcao = (amostraId: string, payload: RejeitarRecepcaoPayload) =>
  apiPost<AmostraDto>(endpoints.lab.recepcao.rejeitar(amostraId), payload);
export const abrirProcesso = (requisicaoId: string) => apiPost<RequisicaoLabDto>(endpoints.lab.recepcao.abrirProcesso(requisicaoId));
export const getEtiquetas = (requisicaoId: string) => apiGet<EtiquetasDto>(endpoints.lab.recepcao.etiquetas(requisicaoId));

// --- Fase 2a: Encaminhamento ---------------------------------------------------
export function listEncaminhamentos(params: EncaminhamentosListParams): Promise<Paginated<BoletimInternoLabDto>> {
  const query: Record<string, string | number> = { page: params.page ?? 1, per_page: params.perPage ?? 50 };
  if (params.laboratorio) query.laboratorio = params.laboratorio;
  if (params.status?.length) query.status = params.status.join(",");
  if (params.search) query.search = params.search;
  return apiGet<Paginated<BoletimInternoLabDto>>(endpoints.lab.encaminhamentos, { params: query });
}
export const encaminharTodos = (requisicaoId: string) => apiPost<BoletimInternoLabDto[]>(endpoints.lab.encaminharTodos(requisicaoId));

/** Transições do BI sem payload (encaminhar, receber-na-area, iniciar-ensaio, submeter-validacao, devolver, receber-devolucao). */
export type AccaoBi =
  | "encaminhar"
  | "receber-na-area"
  | "iniciar-ensaio"
  | "submeter-validacao"
  | "validar"
  | "devolver"
  | "receber-devolucao"
  | "devolver-correccao"
  | "reencaminhar"
  | "rejeitar-amostras";

export const accaoBi = (id: string, accao: AccaoBi, payload?: unknown) =>
  apiPost<BoletimInternoLabDto>(endpoints.lab.bi.accao(id, accao), payload);
export const reencaminhar = (id: string, payload: ReencaminharPayload) =>
  apiPost<BoletimInternoLabDto>(endpoints.lab.bi.accao(id, "reencaminhar"), payload);
export const rejeitarNaArea = (id: string, payload: RejeitarNaAreaPayload) =>
  apiPost<BoletimInternoLabDto>(endpoints.lab.bi.accao(id, "rejeitar-amostras"), payload);

// --- Fase 2b: Área -------------------------------------------------------------
export const listMinhasAreas = () => apiGet<LaboratorioDto[]>(endpoints.lab.areas);
export const getFilaArea = (code: string) => apiGet<FilaAreaDto>(endpoints.lab.fila(code));
export const getBoletimInterno = (id: string) => apiGet<BoletimInternoLabDto>(endpoints.lab.bi.detail(id));
export const registarEnsaio = (biId: string, payload: RegistarEnsaioPayload) =>
  apiPut<EnsaioDto>(endpoints.lab.bi.accao(biId, "ensaios"), payload);

// --- Fase 3: Emissão (CGISC) -----------------------------------------------------
export const getFilaEmissao = () => apiGet<FilaEmissaoDto>(endpoints.lab.emissao);
export const emitirBoletimAnalises = (biId: string) => apiPost<BoletimAnaliseLabDto>(endpoints.lab.bi.accao(biId, "emitir"));
export const entregarBoletimAnalises = (baId: string, payload: EntregarPayload) =>
  apiPost<BoletimAnaliseLabDto>(endpoints.lab.ba.entregar(baId), payload);
export const encerrarProcesso = (requisicaoId: string) => apiPost<RequisicaoLabDto>(endpoints.lab.encerrar(requisicaoId));

// --- Consulta / rastreabilidade ------------------------------------------------
export const getProcessoLab = (requisicaoId: string) => apiGet<ProcessoLabDto>(endpoints.lab.processo(requisicaoId));
export const getMovimentosAmostra = (amostraId: string) => apiGet<AmostraMovimentoDto[]>(endpoints.lab.movimentos(amostraId));
