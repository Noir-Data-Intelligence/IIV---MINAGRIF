import { http, HttpResponse } from "msw";
import {
  labAmostrasFixtures,
  labBoletinsAnalisesFixtures,
  labBoletinsInternosFixtures,
  labExamesFixtures,
  labMembrosFixtures,
  labMovimentosFixtures,
  labRequisicaoExamesFixtures,
  labRequisicoesFixtures,
  labSequencias,
} from "@/mocks/fixtures/lab";
import { laboratoriosFixtures } from "@/mocks/fixtures/laboratorios";
import { usersFixtures } from "@/mocks/fixtures/users";
import type { AmostraDto, AmostraStatus } from "@/types/dto/amostra";
import type { BoletimStatus } from "@/types/dto/boletim";
import type {
  AmostraConferenciaDto,
  BoletimInternoLabDto,
  ConferenciaPayload,
  EnsaioDto,
  EntregarPayload,
  ExameCatalogoDto,
  ExameCatalogoPayload,
  RegistarEnsaioPayload,
  RegistarRequisicaoPayload,
  RejeitarRecepcaoPayload,
  RequisicaoLabDto,
  RequisicaoStatus,
} from "@/types/dto/lab";
import type { Paginated } from "@/types/dto/paginated";

/**
 * Handlers MSW do Laboratório por fase — espelham `/api/lab/*` do backend
 * com as MESMAS regras essenciais da máquina de estados (transições
 * válidas, 2ª conferência por técnico diferente, recepção só por membros
 * da área, executor nunca valida, só a CGISC emite), para que o frontend
 * se comporte igual em modo mock. Mensagens de erro no formato 422 Laravel.
 */
const API = "*/api/lab";
const ANO = new Date().getFullYear();
const now = () => new Date().toISOString();
const uid = (p: string) => `${p}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

function erro(campo: string, msg: string, status = 422) {
  return HttpResponse.json({ message: msg, errors: { [campo]: [msg] } }, { status });
}

function actor(request: Request) {
  const auth = request.headers.get("Authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  return usersFixtures.find((u) => u.id === token) ?? usersFixtures[0];
}

const SUPERVISAO = ["admin", "director-laboratorio", "responsavel-qualidade"];
function podeOperarNaArea(userId: string, roles: string[], laboratorioId: string | null) {
  if (roles.some((r) => SUPERVISAO.includes(r))) return true;
  return !!laboratorioId && (labMembrosFixtures[laboratorioId] ?? []).includes(userId);
}

const TRANSICOES: Record<string, BoletimStatus[]> = {
  gerado: ["em_transito"],
  em_transito: ["recebido_area"],
  recebido_area: ["em_analise", "rejeitado_na_area"],
  em_analise: ["resultado_registado", "rejeitado_na_area"],
  resultado_registado: ["em_validacao", "validado"],
  em_validacao: ["em_validacao", "validado"],
  validado: ["devolvido"],
  devolvido: ["recebido_cgisc"],
  recebido_cgisc: ["emitido", "em_analise"],
};

function lab(id: string | null) {
  return laboratoriosFixtures.find((l) => l.id === id) ?? null;
}

function mov(amostraId: string, accao: string, userId: string, bi: BoletimInternoLabDto | null, de: string | null, para: string | null, observacao: string | null = null) {
  labMovimentosFixtures.push({
    id: uid("mov"), amostraId, boletimInternoId: bi?.id ?? null, accao, deLocal: de, paraLocal: para, userId,
    userNome: usersFixtures.find((u) => u.id === userId)?.fullName ?? null, observacao, createdAt: now(),
  });
}

function amostrasDoBi(bi: BoletimInternoLabDto) {
  return bi.amostras ?? [];
}

function hydrateBi(bi: BoletimInternoLabDto): BoletimInternoLabDto {
  const r = labRequisicoesFixtures.find((x) => x.id === bi.requisicaoId);
  const l = lab(bi.laboratorioId);
  return {
    ...bi,
    laboratorio: l ? { id: l.id, code: l.code, name: l.name, validadorCount: l.validadorCount, validadoresNomeados: l.validadoresNomeados } : null,
    requisicao: r ? { id: r.id, numero: r.numero, patNumero: r.patNumero, clienteNome: r.clienteNome, origemTipo: r.origemTipo, status: r.status } : null,
    examesPedidos: labRequisicaoExamesFixtures
      .filter((p) => p.boletimInternoId === bi.id)
      .map((p) => ({ ...p, exame: labExamesFixtures.find((e) => e.id === p.exameId) })),
    boletimAnalise: labBoletinsAnalisesFixtures.find((b) => b.boletimInternoId === bi.id) ?? null,
  };
}

function hydrateReq(r: RequisicaoLabDto): RequisicaoLabDto {
  const exames = labRequisicaoExamesFixtures.filter((e) => e.requisicaoId === r.id);
  return {
    ...r,
    areas: [...new Set(exames.map((e) => e.laboratorioCode).filter((c): c is string => !!c))].sort(),
    amostras: labAmostrasFixtures.filter((a) => a.requisicaoId === r.id),
    exames: exames.map((e) => ({ ...e, exame: labExamesFixtures.find((x) => x.id === e.exameId) })),
    boletinsInternos: labBoletinsInternosFixtures.filter((b) => b.requisicaoId === r.id).map(hydrateBi),
    boletinsAnalises: labBoletinsAnalisesFixtures.filter((b) => b.requisicaoId === r.id),
  };
}

function sincronizar(r: RequisicaoLabDto) {
  if (["registada", "em_triagem", "rejeitada", "encerrada"].includes(r.status)) return;
  const est = labBoletinsInternosFixtures.filter((b) => b.requisicaoId === r.id).map((b) => b.status);
  if (!est.length) return;
  const terminal = (s: BoletimStatus) => s === "emitido" || s === "rejeitado_na_area";
  let novo: RequisicaoStatus = "processo_aberto";
  if (est.every(terminal)) novo = "emitida";
  else if (est.every((s) => terminal(s) || s === "recebido_cgisc")) novo = "aguarda_emissao";
  else if (est.some((s) => s !== "gerado" && s !== "em_transito")) novo = "em_processamento";
  r.status = novo;
}

function transitar(bi: BoletimInternoLabDto, alvo: BoletimStatus) {
  if (!(TRANSICOES[bi.status] ?? []).includes(alvo)) {
    return erro("status", `Transição inválida do Boletim Interno ${bi.numero}: ${bi.status} → ${alvo}.`);
  }
  bi.status = alvo;
  return null;
}

function setAmostraStatus(id: string, status: AmostraStatus, extra: Partial<AmostraDto> = {}) {
  const a = labAmostrasFixtures.find((x) => x.id === id);
  if (a) Object.assign(a, { status, ...extra });
  labBoletinsInternosFixtures.forEach((b) => b.amostras?.forEach((x) => x.id === id && Object.assign(x, { status, ...extra })));
}

export const labHandlers = [
  // --- Catálogo / colegas ------------------------------------------------------
  http.get(`${API}/exames`, ({ request }) => {
    const url = new URL(request.url);
    const labId = url.searchParams.get("laboratorio_id");
    const activos = url.searchParams.get("activos");
    const q = (url.searchParams.get("search") ?? "").toLowerCase();
    return HttpResponse.json(
      labExamesFixtures.filter((e) => (!labId || e.laboratorioId === labId) && (!activos || e.activo) && (!q || `${e.codigo} ${e.nome}`.toLowerCase().includes(q))),
    );
  }),
  http.post(`${API}/exames`, async ({ request }) => {
    const p = (await request.json()) as ExameCatalogoPayload;
    const ex: ExameCatalogoDto = {
      id: uid("ex"), laboratorioId: p.laboratorioId, laboratorioCode: lab(p.laboratorioId)?.code ?? null, codigo: p.codigo, nome: p.nome,
      tecnicaMetodo: p.tecnicaMetodo ?? null, popCodigo: p.popCodigo ?? null, tiposAmostra: p.tiposAmostra ?? [], slaHoras: p.slaHoras ?? null,
      camposResultado: p.camposResultado ?? [], activo: p.activo ?? true,
    };
    labExamesFixtures.push(ex);
    return HttpResponse.json(ex, { status: 201 });
  }),
  http.put(`${API}/exames/:id`, async ({ params, request }) => {
    const ex = labExamesFixtures.find((e) => e.id === params.id);
    if (!ex) return HttpResponse.json({ message: "Não encontrado." }, { status: 404 });
    const p = (await request.json()) as ExameCatalogoPayload;
    Object.assign(ex, { ...p, laboratorioCode: lab(p.laboratorioId)?.code ?? null });
    return HttpResponse.json(ex);
  }),
  http.delete(`${API}/exames/:id`, ({ params }) => {
    const i = labExamesFixtures.findIndex((e) => e.id === params.id);
    if (i < 0) return HttpResponse.json({ message: "Não encontrado." }, { status: 404 });
    if (labRequisicaoExamesFixtures.some((p) => p.exameId === params.id)) {
      labExamesFixtures[i].activo = false;
      return HttpResponse.json(labExamesFixtures[i]);
    }
    labExamesFixtures.splice(i, 1);
    return new HttpResponse(null, { status: 204 });
  }),
  http.get(`${API}/colegas`, () =>
    HttpResponse.json({
      data: usersFixtures
        .filter((u) => u.roles.some((r) => ["recepcionista", "tecnico", "director-laboratorio", "responsavel-qualidade", "admin"].includes(r)))
        .map((u) => ({ id: u.id, fullName: u.fullName, roles: u.roles })),
    }),
  ),

  // --- Fase 1: Recepção ----------------------------------------------------------
  http.get(`${API}/recepcao/requisicoes`, ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status")?.split(",") ?? [];
    const q = (url.searchParams.get("search") ?? "").toLowerCase();
    const rows = labRequisicoesFixtures
      .filter((r) => (!status.length || status.includes(r.status)) && (!q || `${r.clienteNome} ${r.numero} ${r.patNumero ?? ""}`.toLowerCase().includes(q)))
      .map(hydrateReq);
    const body: Paginated<RequisicaoLabDto> = { data: rows, meta: { currentPage: 1, perPage: rows.length || 20, total: rows.length, lastPage: 1 } };
    return HttpResponse.json(body);
  }),
  http.get(`${API}/recepcao/requisicoes/:id`, ({ params }) => {
    const r = labRequisicoesFixtures.find((x) => x.id === params.id);
    return r ? HttpResponse.json(hydrateReq(r)) : HttpResponse.json({ message: "Não encontrada." }, { status: 404 });
  }),
  http.post(`${API}/recepcao/requisicoes`, async ({ request }) => {
    const u = actor(request);
    const p = (await request.json()) as RegistarRequisicaoPayload;
    if (!p.exames?.length) return erro("exames", "Seleccione pelo menos um exame.");
    if (!p.provenienciaLocal && !p.termoEntregaAssinadoPor) return erro("termoEntregaAssinadoPor", "Amostras de proveniência não local exigem Termo de Entrega assinado.");
    labSequencias.req += 1;
    const numero = `REQ-${ANO}-${String(labSequencias.req).padStart(4, "0")}`;
    const id = uid("lreq");
    const r: RequisicaoLabDto = {
      id, numero, laboratorioId: null, tipoSujeito: p.tipoSujeito, clienteNome: p.clienteNome, clienteContacto: p.clienteContacto ?? null,
      veterinarioResponsavel: p.veterinarioResponsavel ?? null, dadosEpidemiologicos: null, dadosFacturacao: null, consentimento: p.consentimento,
      assinaturaCliente: p.assinaturaCliente, createdBy: u.id, createdAt: now(), status: "registada", origemTipo: p.origemTipo,
      provenienciaLocal: p.provenienciaLocal, termoEntregaNumero: p.provenienciaLocal ? null : `TE-${ANO}-${String(++labSequencias.te).padStart(4, "0")}`,
      termoEntregaAssinadoPor: p.termoEntregaAssinadoPor ?? null, entreguePor: p.entreguePor ?? null, entregueEm: now(), conservacao: p.conservacao ?? null,
      colheitaEm: p.colheitaEm ?? null, doencasSuspeitas: p.doencasSuspeitas ?? null, patNumero: null, processoAbertoEm: null, encerradaEm: null,
    };
    labRequisicoesFixtures.unshift(r);
    const amostras = p.amostras.map((a, i) => {
      const am: AmostraDto = {
        id: uid("lam"), requisicaoId: id, numero: `${numero}-A${i + 1}`, tipoAmostra: a.tipoAmostra, origemMatriz: a.origemMatriz ?? null,
        pontoColheita: a.pontoColheita ?? null, colhidaPor: a.colhidaPor ?? null, sujeito: a.sujeito ?? null, latitude: null, longitude: null,
        recebidaEm: now(), status: "recebida", conferencias: [], localizacaoActual: "CGISC", codigoBarras: null,
      };
      labAmostrasFixtures.push(am);
      mov(am.id, "recebida", u.id, null, p.entreguePor ?? "Origem", "CGISC");
      return am;
    });
    for (const pedido of p.exames) {
      const ex = labExamesFixtures.find((e) => e.id === pedido.exameId);
      if (!ex) continue;
      const alvos = pedido.amostraIndices?.length ? pedido.amostraIndices.map((i) => amostras[i]?.id ?? null) : [null];
      alvos.forEach((amostraId) =>
        labRequisicaoExamesFixtures.push({ id: uid("rex"), requisicaoId: id, amostraId, exameId: ex.id, laboratorioId: ex.laboratorioId, laboratorioCode: ex.laboratorioCode, boletimInternoId: null }),
      );
    }
    return HttpResponse.json(hydrateReq(r), { status: 201 });
  }),
  http.post(`${API}/recepcao/amostras/:id/conferencias`, async ({ params, request }) => {
    const u = actor(request);
    const a = labAmostrasFixtures.find((x) => x.id === params.id);
    if (!a) return HttpResponse.json({ message: "Não encontrada." }, { status: 404 });
    const p = (await request.json()) as ConferenciaPayload;
    const confs = a.conferencias ?? [];
    const ordem = confs.length + 1;
    if (ordem > 2) return erro("conferencia", "A amostra já tem as duas conferências registadas.");
    if (ordem === 2 && confs[0].tecnicoId === u.id) return erro("conferencia", "A 2ª conferência tem de ser feita por um técnico diferente do que fez a 1ª.");
    const c = p.criterios;
    const conforme = Object.values(c).every(Boolean);
    const conf: AmostraConferenciaDto = {
      id: uid("conf"), amostraId: a.id, tecnicoId: u.id, tecnicoNome: u.fullName, ordem: ordem as 1 | 2, conforme, observacao: p.observacao ?? null, createdAt: now(),
      criterios: {
        identificacao: c.crit_identificacao, quantidade: c.crit_quantidade, conservacao: c.crit_conservacao, macroscopica: c.crit_macroscopica,
        caracteristicasFisicas: c.crit_caracteristicas_fisicas, tempoColheita: c.crit_tempo_colheita,
      },
    };
    a.conferencias = [...confs, conf];
    mov(a.id, "conferida", u.id, null, "CGISC", "CGISC", `${ordem}ª conferência: ${conforme ? "conforme" : "não conforme"}`);
    const r = labRequisicoesFixtures.find((x) => x.id === a.requisicaoId)!;
    if (ordem === 1) {
      a.status = "em_conferencia";
      if (r.status === "registada") r.status = "em_triagem";
    } else if (conforme && confs[0].conforme) {
      Object.assign(a, { status: "aceite", aceiteEm: now() });
      mov(a.id, "aceite", u.id, null, "CGISC", "CGISC", "Dupla conferência conforme.");
    }
    return HttpResponse.json(conf, { status: 201 });
  }),
  http.post(`${API}/recepcao/amostras/:id/aceitar-com-reserva`, async ({ params, request }) => {
    const u = actor(request);
    const a = labAmostrasFixtures.find((x) => x.id === params.id);
    if (!a || a.status !== "em_conferencia" || (a.conferencias ?? []).length < 2) return erro("status", "A aceitação com reserva exige as duas conferências.");
    const { motivo } = (await request.json()) as { motivo: string };
    Object.assign(a, { status: "aceite_com_reserva", aceiteComReserva: true, reservaMotivo: motivo, aceiteEm: now() });
    mov(a.id, "aceite", u.id, null, "CGISC", "CGISC", `Aceite com reserva: ${motivo}`);
    return HttpResponse.json(a);
  }),
  http.post(`${API}/recepcao/amostras/:id/rejeitar`, async ({ params, request }) => {
    const u = actor(request);
    const a = labAmostrasFixtures.find((x) => x.id === params.id);
    if (!a) return HttpResponse.json({ message: "Não encontrada." }, { status: 404 });
    const p = (await request.json()) as RejeitarRecepcaoPayload;
    if (p.segundoResponsavelId === u.id) return erro("segundoResponsavelId", "O Termo de Rejeição exige a assinatura de dois responsáveis diferentes.");
    if (!["recebida", "em_conferencia"].includes(a.status)) return erro("status", "Só é possível rejeitar uma amostra ainda em triagem.");
    a.status = "rejeitada";
    a.rejeicao = {
      id: uid("rej"), amostraId: a.id, criterioRejeicaoId: p.criterioRejeicaoId, responsavelId: u.id, detalhe: p.detalhe ?? null,
      assinaturaResponsavel: p.assinaturaResponsavel, rejeitadaEm: now(), fase: "recepcao", segundoResponsavelId: p.segundoResponsavelId,
      assinaturaSegundo: p.assinaturaSegundo, origemNotificadaEm: now(), accaoTomada: p.accaoTomada ?? null,
    };
    mov(a.id, "rejeitada", u.id, null, "CGISC", null, "Termo de Rejeição");
    const r = labRequisicoesFixtures.find((x) => x.id === a.requisicaoId)!;
    if (r.status === "registada") r.status = "em_triagem";
    if (labAmostrasFixtures.filter((x) => x.requisicaoId === r.id).every((x) => x.status === "rejeitada")) r.status = "rejeitada";
    return HttpResponse.json(a);
  }),
  http.post(`${API}/recepcao/requisicoes/:id/abrir-processo`, ({ params }) => {
    const r = labRequisicoesFixtures.find((x) => x.id === params.id);
    if (!r) return HttpResponse.json({ message: "Não encontrada." }, { status: 404 });
    if (!["registada", "em_triagem"].includes(r.status)) return erro("status", `Não é possível abrir o processo de uma requisição em "${r.status}".`);
    const amostras = labAmostrasFixtures.filter((a) => a.requisicaoId === r.id);
    const aceites = amostras.filter((a) => a.status === "aceite" || a.status === "aceite_com_reserva");
    if (amostras.some((a) => !["aceite", "aceite_com_reserva", "rejeitada"].includes(a.status))) return erro("amostras", "Triagem incompleta.");
    if (!aceites.length) return erro("amostras", "Nenhuma amostra aceite — o processo não pode ser aberto.");
    labSequencias.pat += 1;
    const pat = `PAT-${String(labSequencias.pat).padStart(3, "0")}-${ANO}`;
    Object.assign(r, { patNumero: pat, processoAbertoEm: now(), status: "processo_aberto" });
    amostras.forEach((a, i) => aceites.includes(a) && (a.codigoBarras = `${pat}-A${i + 1}`));
    const pedidos = labRequisicaoExamesFixtures.filter((p) => p.requisicaoId === r.id);
    for (const labId of [...new Set(pedidos.map((p) => p.laboratorioId))]) {
      const daArea = pedidos.filter((p) => p.laboratorioId === labId);
      const alvo = aceites.filter((a) => daArea.some((p) => p.amostraId === null || p.amostraId === a.id));
      if (!alvo.length) continue;
      const l = lab(labId);
      const numero = `${pat}/${l?.code ?? "XX"}`;
      const sla = Math.max(...daArea.map((p) => labExamesFixtures.find((e) => e.id === p.exameId)?.slaHoras ?? 0)) || null;
      const bi: BoletimInternoLabDto = {
        id: uid("lbi"), numero, numeroAnalise: numero, requisicaoId: r.id, laboratorioId: labId, exames: daArea.map((p) => labExamesFixtures.find((e) => e.id === p.exameId)?.codigo ?? ""),
        entradaEm: now(), inicioEm: null, conclusaoEm: null, prazoEm: sla ? new Date(Date.now() + sla * 3600_000).toISOString() : null, status: "gerado",
        resultadoGlobal: null, encaminhadoEm: null, recebidoAreaEm: null, recebidoAreaPorId: null, responsavelTecnicoId: null, devolvidoEm: null,
        recebidoCgiscEm: null, motivoCorreccao: null, biOrigemId: null, amostras: alvo.map((a) => ({ ...a, estadoNoBoletim: "pendente" })), ensaios: [], validacoes: [],
      };
      labBoletinsInternosFixtures.push(bi);
      daArea.forEach((p) => (p.boletimInternoId = bi.id));
    }
    return HttpResponse.json(hydrateReq(r));
  }),
  http.get(`${API}/recepcao/requisicoes/:id/etiquetas`, ({ params }) => {
    const r = labRequisicoesFixtures.find((x) => x.id === params.id);
    if (!r) return HttpResponse.json({ message: "Não encontrada." }, { status: 404 });
    const bis = labBoletinsInternosFixtures.filter((b) => b.requisicaoId === r.id);
    return HttpResponse.json({
      pat: r.patNumero,
      amostras: labAmostrasFixtures
        .filter((a) => a.requisicaoId === r.id && a.codigoBarras)
        .map((a) => ({
          amostraId: a.id, codigoBarras: a.codigoBarras, numero: a.numero, tipoAmostra: a.tipoAmostra,
          areas: bis.filter((b) => b.amostras?.some((x) => x.id === a.id)).map((b) => lab(b.laboratorioId)?.code ?? ""), qrPayload: a.codigoBarras,
        })),
      boletins: bis.map((b) => ({ boletimInternoId: b.id, codigoBarras: b.numero, area: lab(b.laboratorioId)?.code ?? null, qrPayload: b.numero })),
    });
  }),

  // --- Fase 2a: Encaminhamento -------------------------------------------------
  http.get(`${API}/encaminhamentos`, () => {
    const rows = labBoletinsInternosFixtures.map(hydrateBi);
    return HttpResponse.json({ data: rows, meta: { currentPage: 1, perPage: rows.length || 50, total: rows.length, lastPage: 1 } });
  }),
  http.post(`${API}/requisicoes/:id/encaminhar`, ({ params, request }) => {
    const u = actor(request);
    const bis = labBoletinsInternosFixtures.filter((b) => b.requisicaoId === params.id && b.status === "gerado");
    if (!bis.length) return erro("status", "Não há Boletins Internos por encaminhar neste processo.");
    bis.forEach((b) => {
      b.status = "em_transito";
      b.encaminhadoEm = now();
      amostrasDoBi(b).forEach((a) => mov(a.id, "encaminhada", u.id, b, "CGISC", `Área ${lab(b.laboratorioId)?.code}`));
    });
    return HttpResponse.json(bis.map(hydrateBi));
  }),
  http.post(`${API}/requisicoes/:id/encerrar`, ({ params, request }) => {
    const u = actor(request);
    const r = labRequisicoesFixtures.find((x) => x.id === params.id);
    if (!r) return HttpResponse.json({ message: "Não encontrada." }, { status: 404 });
    sincronizar(r);
    if (r.status !== "emitida") return erro("status", "O processo só pode ser encerrado quando todos os BI estiverem emitidos ou rejeitados.");
    Object.assign(r, { status: "encerrada", encerradaEm: now(), encerradaPorId: u.id });
    return HttpResponse.json(hydrateReq(r));
  }),

  // --- Fase 2b: Área -------------------------------------------------------------
  http.get(`${API}/areas`, ({ request }) => {
    const u = actor(request);
    const sup = u.roles.some((r) => SUPERVISAO.includes(r) || r === "diretor");
    return HttpResponse.json(laboratoriosFixtures.filter((l) => sup || (labMembrosFixtures[l.id] ?? []).includes(u.id)));
  }),
  http.get(`${API}/areas/:code/fila`, ({ params, request }) => {
    const u = actor(request);
    const l = laboratoriosFixtures.find((x) => x.code === params.code);
    if (!l) return HttpResponse.json({ message: "Não encontrada." }, { status: 404 });
    if (!podeOperarNaArea(u.id, u.roles, l.id) && !u.roles.includes("diretor")) return HttpResponse.json({ message: "Sem acesso a esta área." }, { status: 403 });
    const bis = labBoletinsInternosFixtures.filter((b) => b.laboratorioId === l.id).map(hydrateBi);
    const g = (s: BoletimStatus[]) => bis.filter((b) => s.includes(b.status));
    return HttpResponse.json({
      laboratorio: l, porReceber: g(["em_transito"]), emAnalise: g(["recebido_area", "em_analise"]),
      emValidacao: g(["resultado_registado", "em_validacao"]), validados: g(["validado"]),
    });
  }),
  http.get(`${API}/boletins-internos/:id`, ({ params }) => {
    const bi = labBoletinsInternosFixtures.find((b) => b.id === params.id);
    return bi ? HttpResponse.json(hydrateBi(bi)) : HttpResponse.json({ message: "Não encontrado." }, { status: 404 });
  }),
  http.put(`${API}/boletins-internos/:id/ensaios`, async ({ params, request }) => {
    const u = actor(request);
    const bi = labBoletinsInternosFixtures.find((b) => b.id === params.id);
    if (!bi) return HttpResponse.json({ message: "Não encontrado." }, { status: 404 });
    if (!podeOperarNaArea(u.id, u.roles, bi.laboratorioId)) return HttpResponse.json({ message: "Fora da sua área." }, { status: 403 });
    if (bi.status !== "em_analise") return erro("status", "Só é possível registar ensaios com o BI em análise.");
    const p = (await request.json()) as RegistarEnsaioPayload;
    const lista = bi.ensaios ?? (bi.ensaios = []);
    let e = lista.find((x) => x.amostraId === p.amostraId && x.exameId === p.exameId);
    if (!e) {
      e = { id: uid("ens"), boletimInternoId: bi.id, amostraId: p.amostraId, exameId: p.exameId, iniciadoEm: now() } as EnsaioDto;
      lista.push(e);
    }
    Object.assign(e, {
      tecnica: p.tecnica ?? null, popCodigo: p.popCodigo ?? null, equipamentoId: p.equipamentoId ?? null, loteReagente: p.loteReagente ?? null,
      executorId: u.id, executorNome: u.fullName, segundoIntervenienteId: null, visualizadorId: null, resultado: p.resultado ?? null,
      resultadoQualitativo: p.resultadoQualitativo ?? null, interpretacao: p.interpretacao ?? null, concluidoEm: now(),
    });
    mov(p.amostraId, "resultado", u.id, bi, null, null);
    return HttpResponse.json(e);
  }),
  http.post(`${API}/boletins-internos/:id/:accao`, async ({ params, request }) => {
    const u = actor(request);
    const bi = labBoletinsInternosFixtures.find((b) => b.id === params.id);
    if (!bi) return HttpResponse.json({ message: "Não encontrado." }, { status: 404 });
    const r = labRequisicoesFixtures.find((x) => x.id === bi.requisicaoId)!;
    const area = `Área ${lab(bi.laboratorioId)?.code ?? ""}`;
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const daArea = ["receber-na-area", "iniciar-ensaio", "submeter-validacao", "devolver", "rejeitar-amostras", "reencaminhar"];
    if (daArea.includes(String(params.accao)) && !podeOperarNaArea(u.id, u.roles, bi.laboratorioId)) {
      return HttpResponse.json({ message: "Só a equipa da área pode operar este Boletim Interno." }, { status: 403 });
    }
    const todos = (accao: string, de: string | null, para: string | null, obs: string | null = null) => amostrasDoBi(bi).forEach((a) => mov(a.id, accao, u.id, bi, de, para, obs));
    let falha: Response | null = null;
    switch (params.accao) {
      case "encaminhar":
        falha = transitar(bi, "em_transito");
        if (!falha) { bi.encaminhadoEm = now(); todos("encaminhada", "CGISC", area); }
        break;
      case "receber-na-area":
        falha = transitar(bi, "recebido_area");
        if (!falha) { Object.assign(bi, { recebidoAreaEm: now(), recebidoAreaPorId: u.id }); todos("recebida_area", "CGISC", area); }
        break;
      case "iniciar-ensaio":
        falha = transitar(bi, "em_analise");
        if (!falha) { bi.inicioEm ??= now(); bi.amostras?.forEach((a) => setAmostraStatus(a.id, "em_processamento")); todos("ensaio_iniciado", area, area); }
        break;
      case "submeter-validacao":
        if (!(bi.ensaios ?? []).length) return erro("ensaios", "Resultados em falta.");
        falha = transitar(bi, "resultado_registado");
        if (!falha) todos("resultado", area, area, "Resultados submetidos para validação.");
        break;
      case "validar": {
        if (!["resultado_registado", "em_validacao"].includes(bi.status)) return erro("status", "O BI não está em validação.");
        if ((bi.ensaios ?? []).some((e) => e.executorId === u.id)) return erro("validador", "O validador não pode ser o executor de um ensaio deste Boletim Interno.");
        if ((bi.validacoes ?? []).some((v) => v.validadorId === u.id)) return erro("validador", "Este utilizador já validou este Boletim Interno.");
        const l = lab(bi.laboratorioId);
        if (l?.validadoresNomeados?.length && !l.validadoresNomeados.includes(u.id)) return erro("validador", `A validação de ${l.code} está restrita à lista de validadores nomeados.`);
        const ordem = (bi.validacoes ?? []).length + 1;
        bi.validacoes = [...(bi.validacoes ?? []), { id: uid("val"), boletimInternoId: bi.id, validadorId: u.id, validadorNome: u.fullName, ordem, tipo: ordem === 1 ? "segundo" : ordem === 2 ? "terceiro" : "hierarquica", assinatura: (body.assinatura as string) ?? null, observacao: null, createdAt: now() }];
        bi.status = ordem >= Math.max(1, l?.validadorCount ?? 2) ? "validado" : "em_validacao";
        todos("validada", area, area, `Validação ${ordem}.`);
        break;
      }
      case "devolver":
        falha = transitar(bi, "devolvido");
        if (!falha) { bi.devolvidoEm = now(); todos("devolvida", area, "CGISC"); }
        break;
      case "receber-devolucao":
        falha = transitar(bi, "recebido_cgisc");
        if (!falha) { bi.recebidoCgiscEm = now(); todos("recebida_cgisc", area, "CGISC"); }
        break;
      case "devolver-correccao":
        falha = transitar(bi, "em_analise");
        if (!falha) { bi.motivoCorreccao = String(body.motivo ?? ""); bi.validacoes = []; todos("devolvida_correccao", "CGISC", area, bi.motivoCorreccao); }
        break;
      case "emitir": {
        if (!u.roles.some((x) => ["recepcionista", "admin"].includes(x))) return HttpResponse.json({ message: "Só a CGISC emite o Boletim de Análises." }, { status: 403 });
        falha = transitar(bi, "emitido");
        if (falha) break;
        labSequencias.ba += 1;
        const ba = {
          id: uid("lba"), boletimInternoId: bi.id, numero: `BA-${ANO}-${String(labSequencias.ba).padStart(4, "0")}`, requisicaoId: r.id, laboratorioId: bi.laboratorioId,
          conteudo: { boletimInterno: bi.numero, ensaios: bi.ensaios, validacoes: bi.validacoes }, emitidoPorId: u.id, emitidoEm: now(), assinadoPorId: u.id,
          assinaturaHash: "mock", pdfPath: null, entregueEm: null, entregueA: null, canalEntrega: null, isvNotificadoEm: r.origemTipo === "publica" ? now() : null,
        };
        labBoletinsAnalisesFixtures.push(ba);
        todos("emitida", "CGISC", "CGISC", `Boletim de Análises ${ba.numero} emitido.`);
        bi.amostras?.forEach((a) => {
          const todosTerminais = labBoletinsInternosFixtures.filter((b) => b.amostras?.some((x) => x.id === a.id)).every((b) => b.status === "emitido" || b.status === "rejeitado_na_area");
          if (todosTerminais) setAmostraStatus(a.id, "concluida");
        });
        sincronizar(r);
        return HttpResponse.json(ba, { status: 201 });
      }
      case "rejeitar-amostras": {
        const ids = (body.amostraIds as string[]) ?? [];
        bi.amostras?.forEach((a) => ids.includes(a.id) && (a.estadoNoBoletim = "rejeitada_na_area"));
        ids.forEach((id) => mov(id, "rejeitada", u.id, bi, area, null, "Rejeitada na área"));
        if (bi.amostras?.every((a) => a.estadoNoBoletim === "rejeitada_na_area")) falha = transitar(bi, "rejeitado_na_area");
        break;
      }
      case "reencaminhar":
        return erro("laboratorioId", "Reencaminhamento não suportado em modo mock — use o backend real.");
      default:
        return HttpResponse.json({ message: "Acção desconhecida." }, { status: 404 });
    }
    if (falha) return falha;
    sincronizar(r);
    return HttpResponse.json(hydrateBi(bi));
  }),

  // --- Fase 3: Emissão -------------------------------------------------------------
  http.get(`${API}/emissao`, () => {
    const bis = labBoletinsInternosFixtures.map(hydrateBi);
    return HttpResponse.json({
      devolvidos: bis.filter((b) => b.status === "devolvido"),
      aEmitir: bis.filter((b) => b.status === "recebido_cgisc"),
      emitidos: bis.filter((b) => b.status === "emitido"),
      porEncerrar: labRequisicoesFixtures.filter((r) => r.status === "emitida").map(hydrateReq),
    });
  }),
  http.post(`${API}/boletins-analises/:id/entregar`, async ({ params, request }) => {
    const ba = labBoletinsAnalisesFixtures.find((b) => b.id === params.id);
    if (!ba) return HttpResponse.json({ message: "Não encontrado." }, { status: 404 });
    if (ba.entregueEm) return erro("status", "Este Boletim de Análises já foi entregue.");
    const p = (await request.json()) as EntregarPayload;
    const l = lab(ba.laboratorioId);
    if (l?.exigePagamentoParaEntrega && !p.pagamentoConfirmado) return erro("pagamentoConfirmado", "Esta área exige confirmação de pagamento antes da entrega.");
    Object.assign(ba, { entregueEm: now(), entregueA: p.entregueA, canalEntrega: p.canal, isvNotificadoEm: ba.isvNotificadoEm ?? (p.canal === "isv" ? now() : null) });
    return HttpResponse.json(ba);
  }),

  // --- Consulta -----------------------------------------------------------------------
  http.get(`${API}/processos/:id`, ({ params }) => {
    const r = labRequisicoesFixtures.find((x) => x.id === params.id);
    if (!r) return HttpResponse.json({ message: "Não encontrado." }, { status: 404 });
    const ids = labAmostrasFixtures.filter((a) => a.requisicaoId === r.id).map((a) => a.id);
    return HttpResponse.json({ requisicao: hydrateReq(r), movimentos: labMovimentosFixtures.filter((m) => ids.includes(m.amostraId)) });
  }),
  http.get(`${API}/amostras/:id/movimentos`, ({ params }) => HttpResponse.json(labMovimentosFixtures.filter((m) => m.amostraId === params.id))),
];

export default labHandlers;
