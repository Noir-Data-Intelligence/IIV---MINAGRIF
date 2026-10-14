import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList, Eye, Plus, Printer, Send, Trash2, FolderOpen, FlaskConical } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { WriteGuard } from "@/components/WriteGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import {
  useAbrirProcesso,
  useEncaminharTodos,
  useEtiquetas,
  useExamesCatalogo,
  useRecepcaoList,
  useRegistarRequisicao,
} from "@/hooks/queries/useLab";
import type { AmostraDto } from "@/types/dto/amostra";
import type { OrigemTipo, RequisicaoLabDto, RequisicaoStatus } from "@/types/dto/lab";
import { ConferenciaDialog } from "./ConferenciaDialog";
import { AmostraStatusBadge, RequisicaoStatusBadge, TIPOS_AMOSTRA, errMsg, fmtDateTime, useLabT } from "./labShared";

const TABS: Record<string, RequisicaoStatus[]> = {
  triagem: ["registada", "em_triagem"],
  abertos: ["processo_aberto", "em_processamento", "aguarda_emissao"],
  emitidos: ["emitida", "encerrada"],
  rejeitadas: ["rejeitada"],
};

/**
 * Fase 1 — Recepção (CGISC), resolve DEF-001: registo SEM escolha de
 * laboratório (áreas derivadas dos exames), dupla conferência por 2
 * técnicos, Termo de Rejeição, abertura do processo (PAT + BI por área) e
 * encaminhamento para as áreas.
 */
export default function Recepcao() {
  const { t } = useLabT();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { canWrite } = useUserRole();
  const podeEscrever = canWrite("lab-recepcao");
  const [tab, setTab] = useState<keyof typeof TABS>("triagem");
  const [search, setSearch] = useState("");
  const [wizardAberto, setWizardAberto] = useState(false);
  const [amostraConferir, setAmostraConferir] = useState<AmostraDto | null>(null);
  const [etiquetasDe, setEtiquetasDe] = useState<string | null>(null);

  const { data, isLoading } = useRecepcaoList({ page: 1, perPage: 100, status: TABS[tab], search: search || undefined });
  const abrir = useAbrirProcesso();
  const encaminhar = useEncaminharTodos();
  const rows = useMemo(() => data?.data ?? [], [data]);

  // A amostra em conferência é relida da lista após cada mutação (invalidate) para reflectir a 2ª conferência.
  const amostraActual = useMemo(() => {
    if (!amostraConferir) return null;
    for (const r of rows) {
      const a = r.amostras?.find((x) => x.id === amostraConferir.id);
      if (a) return a;
    }
    return amostraConferir;
  }, [rows, amostraConferir]);

  const accao = async (fn: () => Promise<unknown>, okMsg?: string) => {
    try {
      await fn();
      if (okMsg) toast({ title: okMsg });
    } catch (e) {
      toast({ title: errMsg(e, t("common.error")), variant: "destructive" });
    }
  };

  const triagemConcluida = (r: RequisicaoLabDto) =>
    (r.amostras ?? []).length > 0 &&
    (r.amostras ?? []).every((a) => ["aceite", "aceite_com_reserva", "rejeitada"].includes(a.status)) &&
    (r.amostras ?? []).some((a) => a.status !== "rejeitada");

  return (
    <div className="space-y-6">
      <AdminPageHeader icon={ClipboardList} title={t("recepcao.title")} description={t("recepcao.description")}>
        <WriteGuard module="lab-recepcao">
          <Button onClick={() => setWizardAberto(true)}>
            <Plus className="mr-1 h-4 w-4" /> {t("recepcao.nova")}
          </Button>
        </WriteGuard>
      </AdminPageHeader>

      <div className="flex flex-wrap items-center gap-3">
        <Tabs value={tab} onValueChange={(v) => setTab(v as keyof typeof TABS)}>
          <TabsList>
            {Object.keys(TABS).map((k) => (
              <TabsTrigger key={k} value={k}>
                {t(`recepcao.tabs.${k}`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Input className="max-w-xs" placeholder={t("recepcao.pesquisar")} value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("common.requisicao")}</TableHead>
                <TableHead>{t("common.cliente")}</TableHead>
                <TableHead>{t("common.areas")}</TableHead>
                <TableHead>{t("common.amostras")}</TableHead>
                <TableHead>{t("common.estado")}</TableHead>
                <TableHead className="text-right">{t("common.accoes")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">{t("common.loading")}</TableCell>
                </TableRow>
              )}
              {!isLoading && rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">{t("common.empty")}</TableCell>
                </TableRow>
              )}
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="font-medium">{r.patNumero ?? r.numero}</div>
                    {r.patNumero && <div className="text-xs text-muted-foreground">{r.numero}</div>}
                    <div className="text-xs text-muted-foreground">{fmtDateTime(r.entregueEm ?? r.createdAt)}</div>
                  </TableCell>
                  <TableCell>{r.clienteNome}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(r.areas ?? []).map((a) => (
                        <Badge key={a} variant="outline">{a}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {(r.amostras ?? []).map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          className="flex items-center gap-2 text-left text-xs hover:underline disabled:no-underline"
                          disabled={!podeEscrever}
                          onClick={() => setAmostraConferir(a)}
                        >
                          <span className="font-mono">{a.codigoBarras ?? a.numero}</span>
                          <AmostraStatusBadge status={a.status} />
                        </button>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <RequisicaoStatusBadge status={r.status} />
                  </TableCell>
                  <TableCell className="space-x-1 text-right">
                    {podeEscrever && (r.status === "registada" || r.status === "em_triagem") && triagemConcluida(r) && (
                      <Button
                        size="sm"
                        disabled={abrir.isPending}
                        onClick={() =>
                          accao(async () => {
                            const res = await abrir.mutateAsync(r.id);
                            toast({ title: t("recepcao.processoAberto", { pat: res.patNumero ?? "" }) });
                          })
                        }
                      >
                        <FolderOpen className="mr-1 h-3.5 w-3.5" /> {t("recepcao.abrirProcesso")}
                      </Button>
                    )}
                    {podeEscrever && (r.boletinsInternos ?? []).some((b) => b.status === "gerado") && (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={encaminhar.isPending}
                        onClick={() => accao(() => encaminhar.mutateAsync(r.id), t("recepcao.encaminhados"))}
                      >
                        <Send className="mr-1 h-3.5 w-3.5" /> {t("recepcao.encaminhar")}
                      </Button>
                    )}
                    {r.patNumero && (
                      <Button size="sm" variant="outline" onClick={() => setEtiquetasDe(r.id)}>
                        <Printer className="mr-1 h-3.5 w-3.5" /> {t("recepcao.etiquetas")}
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => navigate(`/admin/lab/processos/${r.id}`)}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ConferenciaDialog amostra={amostraActual} open={!!amostraConferir} onOpenChange={(v) => !v && setAmostraConferir(null)} />
      <NovaRequisicaoDialog open={wizardAberto} onOpenChange={setWizardAberto} />
      <EtiquetasDialog requisicaoId={etiquetasDe} onClose={() => setEtiquetasDe(null)} />
    </div>
  );
}

interface AmostraForm {
  tipoAmostra: string;
  pontoColheita: string;
  colhidaPor: string;
}

/** Wizard de registo — SEM select de laboratório: as áreas derivam dos exames seleccionados. */
function NovaRequisicaoDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { t } = useLabT();
  const { toast } = useToast();
  const registar = useRegistarRequisicao();
  const { data: catalogo } = useExamesCatalogo({ activos: true });

  const [tipoSujeito, setTipoSujeito] = useState<"animal" | "humano">("animal");
  const [clienteNome, setClienteNome] = useState("");
  const [clienteContacto, setClienteContacto] = useState("");
  const [veterinario, setVeterinario] = useState("");
  const [origemTipo, setOrigemTipo] = useState<OrigemTipo>("privada");
  const [provenienciaLocal, setProvenienciaLocal] = useState(true);
  const [termoAssinadoPor, setTermoAssinadoPor] = useState("");
  const [entreguePor, setEntreguePor] = useState("");
  const [conservacao, setConservacao] = useState("");
  const [colheitaEm, setColheitaEm] = useState("");
  const [doencas, setDoencas] = useState("");
  const [consentimento, setConsentimento] = useState(false);
  const [assinatura, setAssinatura] = useState("");
  const [amostras, setAmostras] = useState<AmostraForm[]>([{ tipoAmostra: "sangue", pontoColheita: "", colhidaPor: "" }]);
  /** exameId -> índices das amostras (null = todas). */
  const [exames, setExames] = useState<Record<string, number[] | null>>({});

  const reset = () => {
    setClienteNome("");
    setClienteContacto("");
    setVeterinario("");
    setOrigemTipo("privada");
    setProvenienciaLocal(true);
    setTermoAssinadoPor("");
    setEntreguePor("");
    setConservacao("");
    setColheitaEm("");
    setDoencas("");
    setConsentimento(false);
    setAssinatura("");
    setAmostras([{ tipoAmostra: "sangue", pontoColheita: "", colhidaPor: "" }]);
    setExames({});
  };

  const areasDerivadas = useMemo(() => {
    const codes = new Set<string>();
    for (const id of Object.keys(exames)) {
      const ex = catalogo?.find((e) => e.id === id);
      if (ex?.laboratorioCode) codes.add(ex.laboratorioCode);
    }
    return [...codes].sort();
  }, [exames, catalogo]);

  const examesPorArea = useMemo(() => {
    const grupos: Record<string, NonNullable<typeof catalogo>> = {};
    for (const ex of catalogo ?? []) {
      const k = ex.laboratorioCode ?? "?";
      (grupos[k] ??= []).push(ex);
    }
    return grupos;
  }, [catalogo]);

  const valido =
    clienteNome.trim().length >= 2 &&
    consentimento &&
    assinatura.trim().length > 0 &&
    amostras.length > 0 &&
    Object.keys(exames).length > 0 &&
    (provenienciaLocal || termoAssinadoPor.trim().length > 0);

  const submeter = async () => {
    try {
      const r = await registar.mutateAsync({
        tipoSujeito,
        clienteNome: clienteNome.trim(),
        clienteContacto: clienteContacto.trim() || null,
        veterinarioResponsavel: veterinario.trim() || null,
        consentimento,
        assinaturaCliente: assinatura.trim(),
        origemTipo,
        provenienciaLocal,
        termoEntregaAssinadoPor: provenienciaLocal ? null : termoAssinadoPor.trim(),
        entreguePor: entreguePor.trim() || null,
        conservacao: conservacao.trim() || null,
        colheitaEm: colheitaEm ? new Date(colheitaEm).toISOString() : null,
        doencasSuspeitas: doencas.trim() || null,
        amostras: amostras.map((a) => ({
          tipoAmostra: a.tipoAmostra,
          pontoColheita: a.pontoColheita.trim() || null,
          colhidaPor: a.colhidaPor.trim() || null,
        })),
        exames: Object.entries(exames).map(([exameId, indices]) => ({ exameId, amostraIndices: indices })),
      });
      toast({ title: t("wizard.registada", { numero: r.numero }) });
      reset();
      onOpenChange(false);
    } catch (e) {
      toast({ title: errMsg(e, t("common.error")), variant: "destructive" });
    }
  };

  const toggleExame = (id: string, on: boolean) =>
    setExames((prev) => {
      const next = { ...prev };
      if (on) next[id] = null;
      else delete next[id];
      return next;
    });

  const toggleAmostraNoExame = (exameId: string, idx: number) =>
    setExames((prev) => {
      const actual = prev[exameId] ?? amostras.map((_, i) => i);
      const set = new Set(actual);
      if (set.has(idx)) set.delete(idx);
      else set.add(idx);
      const lista = [...set].sort();
      return { ...prev, [exameId]: lista.length === amostras.length ? null : lista };
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("wizard.title")}</DialogTitle>
        </DialogHeader>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold">{t("wizard.passo1")}</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>{t("wizard.clienteNome")}</Label>
              <Input value={clienteNome} onChange={(e) => setClienteNome(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>{t("wizard.clienteContacto")}</Label>
              <Input value={clienteContacto} onChange={(e) => setClienteContacto(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>{t("wizard.tipoSujeito")}</Label>
              <Select value={tipoSujeito} onValueChange={(v) => setTipoSujeito(v as "animal" | "humano")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="animal">{t("wizard.animal")}</SelectItem>
                  <SelectItem value="humano">{t("wizard.humano")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>{t("wizard.origemTipo")}</Label>
              <Select value={origemTipo} onValueChange={(v) => setOrigemTipo(v as OrigemTipo)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["publica", "privada", "singular"] as const).map((o) => (
                    <SelectItem key={o} value={o}>{t(`wizard.origem.${o}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>{t("wizard.veterinario")}</Label>
              <Input value={veterinario} onChange={(e) => setVeterinario(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>{t("wizard.entreguePor")}</Label>
              <Input value={entreguePor} onChange={(e) => setEntreguePor(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>{t("wizard.conservacao")}</Label>
              <Input value={conservacao} onChange={(e) => setConservacao(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>{t("wizard.colheitaEm")}</Label>
              <Input type="datetime-local" value={colheitaEm} onChange={(e) => setColheitaEm(e.target.value)} />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>{t("wizard.doencasSuspeitas")}</Label>
              <Textarea rows={2} value={doencas} onChange={(e) => setDoencas(e.target.value)} />
            </div>
            <label className="col-span-2 flex items-center gap-2 text-sm">
              <Switch checked={provenienciaLocal} onCheckedChange={setProvenienciaLocal} /> {t("wizard.provenienciaLocal")}
            </label>
            {!provenienciaLocal && (
              <div className="col-span-2 space-y-1">
                <Label>{t("wizard.termoEntregaAssinadoPor")}</Label>
                <Input value={termoAssinadoPor} onChange={(e) => setTermoAssinadoPor(e.target.value)} />
              </div>
            )}
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">{t("wizard.passo2")}</h3>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setAmostras((p) => [...p, { tipoAmostra: "sangue", pontoColheita: "", colhidaPor: "" }])}
            >
              <Plus className="mr-1 h-3.5 w-3.5" /> {t("wizard.addAmostra")}
            </Button>
          </div>
          {amostras.map((a, i) => (
            <div key={i} className="grid grid-cols-[auto_1fr_1fr_1fr_auto] items-end gap-2 rounded-md bg-muted/30 p-2">
              <span className="pb-2 font-mono text-xs">A{i + 1}</span>
              <div className="space-y-1">
                <Label className="text-xs">{t("wizard.tipoAmostra")}</Label>
                <Select
                  value={a.tipoAmostra}
                  onValueChange={(v) => setAmostras((p) => p.map((x, j) => (j === i ? { ...x, tipoAmostra: v } : x)))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPOS_AMOSTRA.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>{t(`tipoAmostra.${tipo}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("wizard.pontoColheita")}</Label>
                <Input value={a.pontoColheita} onChange={(e) => setAmostras((p) => p.map((x, j) => (j === i ? { ...x, pontoColheita: e.target.value } : x)))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("wizard.colhidaPor")}</Label>
                <Input value={a.colhidaPor} onChange={(e) => setAmostras((p) => p.map((x, j) => (j === i ? { ...x, colhidaPor: e.target.value } : x)))} />
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                disabled={amostras.length === 1}
                onClick={() => {
                  setAmostras((p) => p.filter((_, j) => j !== i));
                  setExames((prev) => Object.fromEntries(Object.keys(prev).map((k) => [k, null])));
                }}
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
          ))}
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold">{t("wizard.passo3")}</h3>
          <div className="max-h-64 space-y-3 overflow-y-auto rounded-md border p-2">
            {Object.entries(examesPorArea).map(([area, lista]) => (
              <div key={area}>
                <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                  <FlaskConical className="h-3 w-3" /> {area}
                </p>
                {lista.map((ex) => {
                  const sel = ex.id in exames;
                  const indices = exames[ex.id];
                  return (
                    <div key={ex.id} className="ml-4 py-0.5">
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox checked={sel} onCheckedChange={(v) => toggleExame(ex.id, v === true)} />
                        <span className="font-mono text-xs">{ex.codigo}</span> {ex.nome}
                      </label>
                      {sel && amostras.length > 1 && (
                        <div className="ml-6 flex flex-wrap gap-2 text-xs">
                          {amostras.map((_, i) => (
                            <label key={i} className="flex items-center gap-1">
                              <Checkbox
                                checked={indices === null || (indices ?? []).includes(i)}
                                onCheckedChange={() => toggleAmostraNoExame(ex.id, i)}
                              />
                              A{i + 1}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <p className="text-sm">
            {areasDerivadas.length > 0 ? (
              <>
                <strong>{t("wizard.seraEncaminhada")}</strong>{" "}
                {areasDerivadas.map((a) => (
                  <Badge key={a} className="mr-1">{a}</Badge>
                ))}
              </>
            ) : (
              <span className="text-muted-foreground">{t("wizard.semExames")}</span>
            )}
          </p>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={consentimento} onCheckedChange={(v) => setConsentimento(v === true)} /> {t("wizard.consentimento")}
          </label>
          <div className="space-y-1">
            <Label>{t("wizard.assinaturaCliente")}</Label>
            <Input value={assinatura} onChange={(e) => setAssinatura(e.target.value)} />
          </div>
        </section>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
          <Button disabled={!valido || registar.isPending} onClick={submeter}>{t("wizard.registar")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Etiquetas da amostra e do BI. STUB "a melhorar": mostra o código e o
 * payload do QR em texto e usa a impressão do browser — não há ainda
 * biblioteca de Code128/QR no projecto.
 */
function EtiquetasDialog({ requisicaoId, onClose }: { requisicaoId: string | null; onClose: () => void }) {
  const { t } = useLabT();
  const { data } = useEtiquetas(requisicaoId ?? undefined);
  return (
    <Dialog open={!!requisicaoId} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("recepcao.etiquetas")} — {data?.pat}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2">
          {[...(data?.amostras ?? []).map((a) => ({ k: a.amostraId, c: a.codigoBarras, s: `${t(`tipoAmostra.${a.tipoAmostra}`)} · ${a.areas.join(", ")}` })),
            ...(data?.boletins ?? []).map((b) => ({ k: b.boletimInternoId, c: b.codigoBarras, s: `BI · ${b.area ?? ""}` }))].map((e) => (
            <div key={e.k} className="rounded border border-dashed p-2 text-center">
              <div className="font-mono text-sm font-bold tracking-widest">{e.c}</div>
              <div className="text-xs text-muted-foreground">{e.s}</div>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="mr-1 h-4 w-4" /> {t("recepcao.etiquetas")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
