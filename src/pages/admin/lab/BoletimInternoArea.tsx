import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, FileSignature, Play, Send, Shuffle, XCircle } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import {
  useAccaoBi,
  useBoletimInterno,
  useColegasLab,
  useExamesCatalogo,
  useReencaminhar,
  useRegistarEnsaio,
  useRejeitarNaArea,
} from "@/hooks/queries/useLab";
import { useCriteriosRejeicaoList } from "@/hooks/queries/useCriteriosRejeicao";
import { useLaboratoriosList } from "@/hooks/queries/useLaboratorios";
import type { AmostraDto } from "@/types/dto/amostra";
import type { BoletimInternoLabDto, CampoResultado, EnsaioDto, ExameCatalogoDto, ResultadoQualitativo } from "@/types/dto/lab";
import type { AccaoBi } from "@/services/api/lab";
import { BiStatusBadge, errMsg, fmtDateTime, useLabT } from "./labShared";

/**
 * Espaço de trabalho do BI na área (DEF-002): boletim de ensaio por amostra
 * × exame (método/POP, equipamento, lote de reagente, executor), timeline de
 * validações (nenhum técnico valida sozinho; o executor nunca valida) e
 * "Devolver à Recepção". A emissão NÃO existe aqui — é exclusiva da CGISC.
 */
export default function BoletimInternoArea() {
  const { id } = useParams<{ id: string }>();
  const { t } = useLabT();
  const { toast } = useToast();
  const { user } = useAuth();
  const { canWrite } = useUserRole();
  const { data: bi, isLoading } = useBoletimInterno(id);
  const accaoBi = useAccaoBi();
  const [rejeitarAberto, setRejeitarAberto] = useState(false);
  const [reencaminharAberto, setReencaminharAberto] = useState(false);

  const podeArea = canWrite("lab-area");
  const podeValidar = canWrite("lab-validacao") || podeArea;

  const executores = useMemo(() => new Set((bi?.ensaios ?? []).map((e) => e.executorId)), [bi?.ensaios]);
  const souExecutor = !!user && executores.has(user.id);
  const jaValidei = !!user && (bi?.validacoes ?? []).some((v) => v.validadorId === user.id);
  const nomeados = bi?.laboratorio?.validadoresNomeados ?? null;
  const total = Math.max(1, bi?.laboratorio?.validadorCount ?? 2);

  if (isLoading || !bi) return <p className="text-sm text-muted-foreground">{t("common.loading")}</p>;

  const correr = async (accao: AccaoBi, payload?: unknown) => {
    try {
      await accaoBi.mutateAsync({ id: bi.id, accao, payload });
      toast({ title: t(`statusBi.${accaoParaEstado(accao)}`) });
    } catch (e) {
      toast({ title: errMsg(e, t("common.error")), variant: "destructive" });
    }
  };

  const activas = (bi.amostras ?? []).filter((a) => a.estadoNoBoletim !== "rejeitada_na_area");
  const pares = activas.flatMap((a) =>
    (bi.examesPedidos ?? [])
      .filter((p) => p.amostraId === null || p.amostraId === a.id)
      .filter((p, i, arr) => arr.findIndex((x) => x.exameId === p.exameId) === i)
      .map((p) => ({ amostra: a, exame: p.exame! }))
      .filter((x) => !!x.exame),
  );
  const editavel = bi.status === "em_analise" && podeArea;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={FileSignature}
        title={t("bi.title", { numero: bi.numero ?? bi.numeroAnalise })}
        description={`${bi.laboratorio?.code ?? ""} — ${bi.laboratorio?.name ?? ""} · ${bi.requisicao?.clienteNome ?? ""}`}
      >
        <Button variant="ghost" asChild>
          <Link to={bi.laboratorio ? `/admin/lab/area/${bi.laboratorio.code}` : "/admin/lab/area"}>
            <ArrowLeft className="mr-1 h-4 w-4" /> {t("common.voltar")}
          </Link>
        </Button>
      </AdminPageHeader>

      <div className="flex flex-wrap items-center gap-2">
        <BiStatusBadge status={bi.status} />
        <span className="text-sm text-muted-foreground">
          {t("common.prazo")}: {fmtDateTime(bi.prazoEm)} · {t("common.entrada")}: {fmtDateTime(bi.entradaEm)}
        </span>
        <div className="ml-auto flex flex-wrap gap-2">
          {bi.status === "recebido_area" && podeArea && (
            <Button onClick={() => correr("iniciar-ensaio")}><Play className="mr-1 h-4 w-4" /> {t("bi.iniciar")}</Button>
          )}
          {bi.status === "em_analise" && podeArea && (
            <Button onClick={() => correr("submeter-validacao")}><Send className="mr-1 h-4 w-4" /> {t("bi.submeter")}</Button>
          )}
          {(bi.status === "resultado_registado" || bi.status === "em_validacao") && podeValidar && (
            <Button disabled={souExecutor || jaValidei || accaoBi.isPending} onClick={() => correr("validar", { assinatura: user?.fullName })}>
              <CheckCircle2 className="mr-1 h-4 w-4" /> {t("bi.validar")}
            </Button>
          )}
          {bi.status === "validado" && podeArea && (
            <Button onClick={() => correr("devolver")}><Send className="mr-1 h-4 w-4" /> {t("bi.devolver")}</Button>
          )}
          {(bi.status === "recebido_area" || bi.status === "em_analise") && podeArea && (
            <Button variant="destructive" onClick={() => setRejeitarAberto(true)}><XCircle className="mr-1 h-4 w-4" /> {t("bi.rejeitarAmostras")}</Button>
          )}
          {!["emitido", "rejeitado_na_area", "gerado", "em_transito"].includes(bi.status) && podeArea && (
            <Button variant="outline" onClick={() => setReencaminharAberto(true)}><Shuffle className="mr-1 h-4 w-4" /> {t("bi.reencaminhar")}</Button>
          )}
        </div>
      </div>

      {bi.motivoCorreccao && bi.status === "em_analise" && (
        <Alert variant="destructive">
          <AlertTitle>{t("bi.motivoCorreccao")}</AlertTitle>
          <AlertDescription>{bi.motivoCorreccao}</AlertDescription>
        </Alert>
      )}
      {souExecutor && (bi.status === "resultado_registado" || bi.status === "em_validacao") && (
        <Alert><AlertDescription>{t("bi.executorNaoValida")}</AlertDescription></Alert>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">{t("bi.ensaios")}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {pares.length === 0 && <p className="text-sm text-muted-foreground">{t("common.empty")}</p>}
          {pares.map(({ amostra, exame }) => (
            <EnsaioForm
              key={`${amostra.id}-${exame.id}`}
              bi={bi}
              amostra={amostra}
              exame={exame}
              ensaio={(bi.ensaios ?? []).find((e) => e.amostraId === amostra.id && e.exameId === exame.id)}
              editavel={editavel}
            />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("bi.validacoes", { n: bi.validacoes?.length ?? 0, total })}</CardTitle>
          {nomeados && nomeados.length > 0 && <p className="text-xs text-muted-foreground">{t("bi.nomeados")}</p>}
        </CardHeader>
        <CardContent>
          <ol className="space-y-2 border-l pl-4">
            {(bi.validacoes ?? []).map((v) => (
              <li key={v.id} className="text-sm">
                <span className="font-medium">{v.ordem}. {v.validadorNome ?? v.validadorId}</span>{" "}
                <Badge variant="outline">{v.tipo}</Badge>{" "}
                <span className="text-xs text-muted-foreground">{fmtDateTime(v.createdAt)}</span>
              </li>
            ))}
            {(bi.validacoes ?? []).length === 0 && <li className="text-sm text-muted-foreground">{t("common.empty")}</li>}
          </ol>
        </CardContent>
      </Card>

      <RejeitarNaAreaDialog bi={bi} open={rejeitarAberto} onOpenChange={setRejeitarAberto} />
      <ReencaminharDialog bi={bi} open={reencaminharAberto} onOpenChange={setReencaminharAberto} />
    </div>
  );
}

function accaoParaEstado(accao: AccaoBi): string {
  const mapa: Partial<Record<AccaoBi, string>> = {
    "iniciar-ensaio": "em_analise",
    "submeter-validacao": "resultado_registado",
    validar: "em_validacao",
    devolver: "devolvido",
    "receber-na-area": "recebido_area",
  };
  return mapa[accao] ?? "em_analise";
}

/** Uma linha do boletim de ensaio (amostra × exame), com os campos do schema do catálogo. */
function EnsaioForm({
  bi,
  amostra,
  exame,
  ensaio,
  editavel,
}: {
  bi: BoletimInternoLabDto;
  amostra: AmostraDto;
  exame: ExameCatalogoDto;
  ensaio: EnsaioDto | undefined;
  editavel: boolean;
}) {
  const { t } = useLabT();
  const { toast } = useToast();
  const registar = useRegistarEnsaio();
  const [tecnica, setTecnica] = useState(ensaio?.tecnica ?? exame.tecnicaMetodo ?? "");
  const [equipamento, setEquipamento] = useState(ensaio?.equipamentoId ?? "");
  const [lote, setLote] = useState(ensaio?.loteReagente ?? "");
  const [qualitativo, setQualitativo] = useState<string>(ensaio?.resultadoQualitativo ?? "");
  const [interpretacao, setInterpretacao] = useState(ensaio?.interpretacao ?? "");
  const [valores, setValores] = useState<Record<string, unknown>>(ensaio?.resultado ?? {});

  const gravar = async () => {
    const resultado: Record<string, unknown> = {};
    for (const campo of exame.camposResultado) {
      const v = valores[campo.chave];
      if (v === undefined || v === "") continue;
      resultado[campo.chave] = campo.tipo === "numero" ? Number(v) : v;
    }
    try {
      await registar.mutateAsync({
        biId: bi.id,
        payload: {
          amostraId: amostra.id,
          exameId: exame.id,
          tecnica: tecnica || null,
          equipamentoId: equipamento || null,
          loteReagente: lote || null,
          resultado: Object.keys(resultado).length ? resultado : null,
          resultadoQualitativo: (qualitativo || null) as ResultadoQualitativo | null,
          interpretacao: interpretacao || null,
        },
      });
      toast({ title: t("bi.ensaioGravado") });
    } catch (e) {
      toast({ title: errMsg(e, t("common.error")), variant: "destructive" });
    }
  };

  return (
    <div className="rounded-md border p-3">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
        <span className="font-mono font-semibold">{amostra.codigoBarras ?? amostra.numero}</span>
        <Badge variant="outline">{exame.codigo}</Badge> {exame.nome}
        <span className="ml-auto text-xs text-muted-foreground">
          {t("bi.executor")}: {ensaio?.executorNome ?? (ensaio ? ensaio.executorId : t("bi.semResultado"))}
        </span>
      </div>
      <div className="grid gap-2 md:grid-cols-3">
        <Field label={t("bi.tecnica")}><Input disabled={!editavel} value={tecnica} onChange={(e) => setTecnica(e.target.value)} /></Field>
        <Field label={t("bi.equipamento")}><Input disabled={!editavel} value={equipamento} onChange={(e) => setEquipamento(e.target.value)} /></Field>
        <Field label={t("bi.loteReagente")}><Input disabled={!editavel} value={lote} onChange={(e) => setLote(e.target.value)} /></Field>
        {exame.camposResultado.map((campo) => (
          <Field key={campo.chave} label={`${campo.rotulo ?? campo.chave}${campo.unidade ? ` (${campo.unidade})` : ""}`}>
            <CampoInput campo={campo} disabled={!editavel} value={valores[campo.chave]} onChange={(v) => setValores((p) => ({ ...p, [campo.chave]: v }))} />
          </Field>
        ))}
        <Field label={t("bi.resultadoQualitativo")}>
          <Select disabled={!editavel} value={qualitativo} onValueChange={setQualitativo}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(["negativo", "positivo", "inconclusivo"] as const).map((q) => (
                <SelectItem key={q} value={q}>{t(`bi.qualitativo.${q}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label={t("bi.interpretacao")} className="md:col-span-2">
          <Input disabled={!editavel} value={interpretacao} onChange={(e) => setInterpretacao(e.target.value)} />
        </Field>
      </div>
      {editavel && (
        <div className="mt-2 text-right">
          <Button size="sm" disabled={registar.isPending} onClick={gravar}>{t("bi.registarEnsaio")}</Button>
        </div>
      )}
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-1 ${className ?? ""}`}>
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function CampoInput({ campo, value, onChange, disabled }: { campo: CampoResultado; value: unknown; onChange: (v: unknown) => void; disabled: boolean }) {
  if (campo.tipo === "booleano") {
    return <Switch disabled={disabled} checked={value === true} onCheckedChange={(v) => onChange(v)} />;
  }
  if (campo.tipo === "opcao") {
    return (
      <Select disabled={disabled} value={typeof value === "string" ? value : ""} onValueChange={onChange}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {(campo.opcoes ?? []).map((o) => (
            <SelectItem key={o} value={o}>{o}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
  return (
    <Input
      disabled={disabled}
      type={campo.tipo === "numero" ? "number" : "text"}
      value={value === undefined || value === null ? "" : String(value)}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

/** Termo de Rejeição na área (fase "area", 2 assinaturas). */
function RejeitarNaAreaDialog({ bi, open, onOpenChange }: { bi: BoletimInternoLabDto; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { t } = useLabT();
  const { toast } = useToast();
  const { user } = useAuth();
  const rejeitar = useRejeitarNaArea();
  const { data: criterios } = useCriteriosRejeicaoList();
  const { data: colegas } = useColegasLab();
  const [amostraIds, setAmostraIds] = useState<string[]>([]);
  const [criterioId, setCriterioId] = useState("");
  const [segundoId, setSegundoId] = useState("");
  const [assinatura, setAssinatura] = useState("");
  const [assinaturaSegundo, setAssinaturaSegundo] = useState("");
  const [detalhe, setDetalhe] = useState("");

  const valido = amostraIds.length > 0 && !!criterioId && !!segundoId && !!assinatura.trim() && !!assinaturaSegundo.trim();

  const confirmar = async () => {
    try {
      await rejeitar.mutateAsync({
        biId: bi.id,
        payload: { amostraIds, criterioRejeicaoId: criterioId, assinaturaResponsavel: assinatura, segundoResponsavelId: segundoId, assinaturaSegundo, detalhe: detalhe || null },
      });
      toast({ title: t("rejeicao.ok") });
      onOpenChange(false);
    } catch (e) {
      toast({ title: errMsg(e, t("common.error")), variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{t("bi.rejeitarAmostras")}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-3">
            {(bi.amostras ?? []).filter((a) => a.estadoNoBoletim !== "rejeitada_na_area").map((a) => (
              <label key={a.id} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={amostraIds.includes(a.id)}
                  onCheckedChange={(v) => setAmostraIds((p) => (v === true ? [...p, a.id] : p.filter((x) => x !== a.id)))}
                />
                {a.codigoBarras ?? a.numero}
              </label>
            ))}
          </div>
          <Field label={t("rejeicao.criterio")}>
            <Select value={criterioId} onValueChange={setCriterioId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(criterios ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.codigo} — {c.motivo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label={t("rejeicao.assinatura")}><Input value={assinatura} onChange={(e) => setAssinatura(e.target.value)} /></Field>
          <Field label={t("rejeicao.segundo")}>
            <Select value={segundoId} onValueChange={setSegundoId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(colegas ?? []).filter((c) => c.id !== user?.id).map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.fullName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label={t("rejeicao.assinaturaSegundo")}><Input value={assinaturaSegundo} onChange={(e) => setAssinaturaSegundo(e.target.value)} /></Field>
          <Field label={t("rejeicao.detalhe")}><Textarea rows={2} value={detalhe} onChange={(e) => setDetalhe(e.target.value)} /></Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
          <Button variant="destructive" disabled={!valido || rejeitar.isPending} onClick={confirmar}>{t("common.confirm")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Reencaminhamento: cria um novo BI na área de destino (o BI actual segue o seu fluxo). */
function ReencaminharDialog({ bi, open, onOpenChange }: { bi: BoletimInternoLabDto; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { t } = useLabT();
  const { toast } = useToast();
  const reencaminhar = useReencaminhar();
  const { data: labs } = useLaboratoriosList({ page: 1, perPage: 100 });
  const [destino, setDestino] = useState("");
  const { data: exames } = useExamesCatalogo({ laboratorioId: destino || undefined, activos: true });
  const [exameIds, setExameIds] = useState<string[]>([]);
  const [motivo, setMotivo] = useState("");
  const [duplicar, setDuplicar] = useState(false);

  const confirmar = async () => {
    try {
      await reencaminhar.mutateAsync({ biId: bi.id, payload: { laboratorioId: destino, exameIds, motivo, duplicar } });
      toast({ title: t("bi.reencaminhar") });
      onOpenChange(false);
    } catch (e) {
      toast({ title: errMsg(e, t("common.error")), variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{t("bi.reencaminhar")}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Field label={t("bi.destino")}>
            <Select value={destino} onValueChange={(v) => { setDestino(v); setExameIds([]); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(labs?.data ?? []).filter((l) => l.id !== bi.laboratorioId).map((l) => (
                  <SelectItem key={l.id} value={l.id}>{l.code} — {l.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {destino && (
            <Field label={t("bi.examesDestino")}>
              <div className="space-y-1">
                {(exames ?? []).map((e) => (
                  <label key={e.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={exameIds.includes(e.id)}
                      onCheckedChange={(v) => setExameIds((p) => (v === true ? [...p, e.id] : p.filter((x) => x !== e.id)))}
                    />
                    {e.codigo} — {e.nome}
                  </label>
                ))}
              </div>
            </Field>
          )}
          <Field label={t("bi.motivo")}><Textarea rows={2} value={motivo} onChange={(e) => setMotivo(e.target.value)} /></Field>
          <label className="flex items-center gap-2 text-sm"><Switch checked={duplicar} onCheckedChange={setDuplicar} /> {t("bi.duplicar")}</label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
          <Button disabled={!destino || exameIds.length === 0 || !motivo.trim() || reencaminhar.isPending} onClick={confirmar}>{t("common.confirm")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
