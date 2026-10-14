import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  abrirProcesso,
  accaoBi,
  aceitarComReserva,
  conferirAmostra,
  createExame,
  deleteExame,
  emitirBoletimAnalises,
  encaminharTodos,
  encerrarProcesso,
  entregarBoletimAnalises,
  getBoletimInterno,
  getEtiquetas,
  getFilaArea,
  getFilaEmissao,
  getProcessoLab,
  getRecepcao,
  listColegas,
  listEncaminhamentos,
  listExames,
  listMinhasAreas,
  listRecepcao,
  reencaminhar,
  registarEnsaio,
  registarRequisicao,
  rejeitarNaArea,
  rejeitarNaRecepcao,
  updateExame,
  type AccaoBi,
} from "@/services/api/lab";
import type {
  ConferenciaPayload,
  EncaminhamentosListParams,
  EntregarPayload,
  ExameCatalogoPayload,
  RecepcaoListParams,
  ReencaminharPayload,
  RegistarEnsaioPayload,
  RegistarRequisicaoPayload,
  RejeitarNaAreaPayload,
  RejeitarRecepcaoPayload,
} from "@/types/dto/lab";

/**
 * Hooks react-query do Laboratório por fase. Qualquer transição invalida
 * toda a árvore `["lab"]` — as filas de Recepção, Encaminhamentos, Área e
 * Emissão são vistas diferentes do mesmo estado.
 */
export const labKeys = {
  all: ["lab"] as const,
  exames: (params: object) => [...labKeys.all, "exames", params] as const,
  colegas: () => [...labKeys.all, "colegas"] as const,
  recepcao: (params: RecepcaoListParams) => [...labKeys.all, "recepcao", params] as const,
  requisicao: (id: string) => [...labKeys.all, "requisicao", id] as const,
  etiquetas: (id: string) => [...labKeys.all, "etiquetas", id] as const,
  encaminhamentos: (params: EncaminhamentosListParams) => [...labKeys.all, "encaminhamentos", params] as const,
  areas: () => [...labKeys.all, "areas"] as const,
  fila: (code: string) => [...labKeys.all, "fila", code] as const,
  bi: (id: string) => [...labKeys.all, "bi", id] as const,
  emissao: () => [...labKeys.all, "emissao"] as const,
  processo: (id: string) => [...labKeys.all, "processo", id] as const,
};

function useLabMutation<TVars, TResult>(fn: (vars: TVars) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: labKeys.all }),
  });
}

// --- Leitura ---------------------------------------------------------------------
export const useExamesCatalogo = (params: { laboratorioId?: string; activos?: boolean; search?: string } = {}) =>
  useQuery({ queryKey: labKeys.exames(params), queryFn: () => listExames(params) });
export const useColegasLab = () => useQuery({ queryKey: labKeys.colegas(), queryFn: listColegas, staleTime: 5 * 60_000 });
export const useRecepcaoList = (params: RecepcaoListParams) =>
  useQuery({ queryKey: labKeys.recepcao(params), queryFn: () => listRecepcao(params) });
export const useRequisicaoLab = (id: string | undefined) =>
  useQuery({ queryKey: labKeys.requisicao(id ?? ""), queryFn: () => getRecepcao(id as string), enabled: !!id });
export const useEtiquetas = (id: string | undefined) =>
  useQuery({ queryKey: labKeys.etiquetas(id ?? ""), queryFn: () => getEtiquetas(id as string), enabled: !!id });
export const useEncaminhamentos = (params: EncaminhamentosListParams) =>
  useQuery({ queryKey: labKeys.encaminhamentos(params), queryFn: () => listEncaminhamentos(params) });
export const useMinhasAreas = () => useQuery({ queryKey: labKeys.areas(), queryFn: listMinhasAreas });
export const useFilaArea = (code: string | undefined) =>
  useQuery({ queryKey: labKeys.fila(code ?? ""), queryFn: () => getFilaArea(code as string), enabled: !!code });
export const useBoletimInterno = (id: string | undefined) =>
  useQuery({ queryKey: labKeys.bi(id ?? ""), queryFn: () => getBoletimInterno(id as string), enabled: !!id });
export const useFilaEmissao = () => useQuery({ queryKey: labKeys.emissao(), queryFn: getFilaEmissao });
export const useProcessoLab = (id: string | undefined) =>
  useQuery({ queryKey: labKeys.processo(id ?? ""), queryFn: () => getProcessoLab(id as string), enabled: !!id });

// --- Escrita (transições) --------------------------------------------------------
export const useRegistarRequisicao = () => useLabMutation((p: RegistarRequisicaoPayload) => registarRequisicao(p));
export const useConferirAmostra = () =>
  useLabMutation((v: { amostraId: string; payload: ConferenciaPayload }) => conferirAmostra(v.amostraId, v.payload));
export const useAceitarComReserva = () =>
  useLabMutation((v: { amostraId: string; motivo: string }) => aceitarComReserva(v.amostraId, v.motivo));
export const useRejeitarNaRecepcao = () =>
  useLabMutation((v: { amostraId: string; payload: RejeitarRecepcaoPayload }) => rejeitarNaRecepcao(v.amostraId, v.payload));
export const useAbrirProcesso = () => useLabMutation((requisicaoId: string) => abrirProcesso(requisicaoId));
export const useEncaminharTodos = () => useLabMutation((requisicaoId: string) => encaminharTodos(requisicaoId));
export const useAccaoBi = () =>
  useLabMutation((v: { id: string; accao: AccaoBi; payload?: unknown }) => accaoBi(v.id, v.accao, v.payload));
export const useRegistarEnsaio = () =>
  useLabMutation((v: { biId: string; payload: RegistarEnsaioPayload }) => registarEnsaio(v.biId, v.payload));
export const useRejeitarNaArea = () =>
  useLabMutation((v: { biId: string; payload: RejeitarNaAreaPayload }) => rejeitarNaArea(v.biId, v.payload));
export const useReencaminhar = () =>
  useLabMutation((v: { biId: string; payload: ReencaminharPayload }) => reencaminhar(v.biId, v.payload));
export const useEmitirBoletimAnalises = () => useLabMutation((biId: string) => emitirBoletimAnalises(biId));
export const useEntregarBoletimAnalises = () =>
  useLabMutation((v: { baId: string; payload: EntregarPayload }) => entregarBoletimAnalises(v.baId, v.payload));
export const useEncerrarProcesso = () => useLabMutation((requisicaoId: string) => encerrarProcesso(requisicaoId));
export const useSaveExame = () =>
  useLabMutation((v: { id?: string; payload: ExameCatalogoPayload }) => (v.id ? updateExame(v.id, v.payload) : createExame(v.payload)));
export const useDeleteExame = () => useLabMutation((id: string) => deleteExame(id));
