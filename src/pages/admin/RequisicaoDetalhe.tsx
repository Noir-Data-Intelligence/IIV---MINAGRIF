import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "framer-motion";
import {
  ClipboardList, ChevronLeft, CheckCircle2, XCircle, FlaskConical, Send,
  ShieldCheck, FileText, Plus, Trash2,
} from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useRequisicao } from "@/hooks/queries/useRequisicoes";
import { useAceitarAmostra, useRejeitarAmostra } from "@/hooks/queries/useAmostras";
import { useRegistarResultado, useValidarBoletim, useComunicarBoletim } from "@/hooks/queries/useBoletins";
import { useLaboratoriosList } from "@/hooks/queries/useLaboratorios";
import { useCriteriosRejeicaoList } from "@/hooks/queries/useCriteriosRejeicao";
import { useUsersList } from "@/hooks/queries/useUsers";
import { formatDate } from "@/lib/format";
import { fadeIn } from "@/lib/motion";
import type { AmostraDto } from "@/types/dto/amostra";
import i18n from "@/i18n";
import ptDetalhe from "@/i18n/locales/pt/admin/requisicao-detalhe.json";
import enDetalhe from "@/i18n/locales/en/admin/requisicao-detalhe.json";

if (!i18n.hasResourceBundle("pt", "admin-requisicao-detalhe"))
  i18n.addResourceBundle("pt", "admin-requisicao-detalhe", ptDetalhe, true, true);
if (!i18n.hasResourceBundle("en", "admin-requisicao-detalhe"))
  i18n.addResourceBundle("en", "admin-requisicao-detalhe", enDetalhe, true, true);

const AMOSTRA_STATUS_VARIANT: Record<AmostraDto["status"], "default" | "secondary" | "destructive" | "outline"> = {
  recebida: "outline",
  aceite: "secondary",
  rejeitada: "destructive",
};

const BOLETIM_STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  em_analise: "outline",
  resultado_registado: "secondary",
  em_validacao: "secondary",
  aprovado: "default",
  comunicado: "default",
};

export default function RequisicaoDetalhe() {
  const { id } = useParams();
  const { t, i18n: i18nInstance } = useTranslation("admin-requisicao-detalhe");
  const { toast } = useToast();
  const { user } = useAuth();
  const { canWrite } = useUserRole();
  const prefersReduced = useReducedMotion();

  const { data: requisicao, isLoading } = useRequisicao(id);
  const laboratoriosQuery = useLaboratoriosList({ page: 1, perPage: 100 });
  const usersQuery = useUsersList({});

  const laboratorio = laboratoriosQuery.data?.data.find((l) => l.id === requisicao?.laboratorioId);
  const criteriosQuery = useCriteriosRejeicaoList(requisicao?.laboratorioId);
  const userName = (uid: string | null) => (uid ? usersQuery.data?.find((u) => u.id === uid)?.fullName ?? uid : null);
  const criterioMotivo = (criterioId: string) => {
    const criterio = criteriosQuery.data?.find((c) => c.id === criterioId);
    return criterio ? `${criterio.codigo} — ${criterio.motivo}` : criterioId;
  };

  const aceitarAmostra = useAceitarAmostra();
  const rejeitarAmostra = useRejeitarAmostra();
  const registarResultado = useRegistarResultado();
  const validarBoletim = useValidarBoletim();
  const comunicarBoletim = useComunicarBoletim();

  const canEdit = canWrite("analises");
  const canValidar = canWrite("resultados");

  const [rejeitarAlvo, setRejeitarAlvo] = useState<AmostraDto | null>(null);
  const [criterioId, setCriterioId] = useState("");
  const [assinatura, setAssinatura] = useState(user?.fullName ?? "");
  const [detalheRejeicao, setDetalheRejeicao] = useState("");

  const [resultadoAlvo, setResultadoAlvo] = useState<AmostraDto | null>(null);
  const [parametros, setParametros] = useState<{ chave: string; valor: string }[]>([{ chave: "", valor: "" }]);

  const dateLocale = i18nInstance.language === "en" ? "en-GB" : "pt-AO";
  const fmtDateTime = (value: string | null) => (value ? new Date(value).toLocaleString(dateLocale) : "—");

  const openRejeitar = (amostra: AmostraDto) => {
    setRejeitarAlvo(amostra);
    setCriterioId("");
    setAssinatura(user?.fullName ?? "");
    setDetalheRejeicao("");
  };

  const confirmRejeitar = async () => {
    if (!rejeitarAlvo || !requisicao || !criterioId || !assinatura.trim()) return;
    try {
      await rejeitarAmostra.mutateAsync({
        id: rejeitarAlvo.id,
        requisicaoId: requisicao.id,
        payload: { criterioRejeicaoId: criterioId, assinaturaResponsavel: assinatura.trim(), detalhe: detalheRejeicao.trim() || null },
      });
      toast({ title: t("toast.rejeitada") });
      setRejeitarAlvo(null);
    } catch {
      toast({ title: t("toast.error"), variant: "destructive" });
    }
  };

  const handleAceitar = async (amostra: AmostraDto) => {
    if (!requisicao) return;
    try {
      await aceitarAmostra.mutateAsync({ id: amostra.id, requisicaoId: requisicao.id });
      toast({ title: t("toast.aceite") });
    } catch {
      toast({ title: t("toast.error"), variant: "destructive" });
    }
  };

  const openResultado = (amostra: AmostraDto) => {
    setResultadoAlvo(amostra);
    const existentes = amostra.boletimInterno?.boletimAnalise?.resultado as { parametros?: Record<string, unknown> } | null;
    const entries = existentes?.parametros ? Object.entries(existentes.parametros).map(([chave, valor]) => ({ chave, valor: String(valor) })) : [];
    setParametros(entries.length > 0 ? entries : [{ chave: "", valor: "" }]);
  };

  const confirmResultado = async () => {
    if (!resultadoAlvo?.boletimInterno || !requisicao) return;
    const parametrosObj: Record<string, string> = {};
    parametros.forEach(({ chave, valor }) => {
      if (chave.trim()) parametrosObj[chave.trim()] = valor;
    });
    try {
      await registarResultado.mutateAsync({
        id: resultadoAlvo.boletimInterno.id,
        requisicaoId: requisicao.id,
        resultado: { parametros: parametrosObj },
      });
      toast({ title: t("toast.resultadoRegistado") });
      setResultadoAlvo(null);
    } catch {
      toast({ title: t("toast.error"), variant: "destructive" });
    }
  };

  const handleValidar = async (amostra: AmostraDto) => {
    if (!amostra.boletimInterno || !requisicao) return;
    try {
      await validarBoletim.mutateAsync({ id: amostra.boletimInterno.id, requisicaoId: requisicao.id });
      toast({ title: t("toast.validado") });
    } catch (error) {
      toast({ title: t("toast.error"), description: error instanceof Error ? error.message : undefined, variant: "destructive" });
    }
  };

  const handleComunicar = async (amostra: AmostraDto) => {
    if (!amostra.boletimInterno || !requisicao) return;
    try {
      await comunicarBoletim.mutateAsync({ id: amostra.boletimInterno.id, requisicaoId: requisicao.id });
      toast({ title: t("toast.comunicado") });
    } catch {
      toast({ title: t("toast.error"), variant: "destructive" });
    }
  };

  const motionProps = prefersReduced ? {} : { initial: "hidden" as const, animate: "visible" as const, variants: fadeIn };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <AdminPageHeader icon={ClipboardList} title={t("loading")} />
        <AdminCard loading />
      </div>
    );
  }

  if (!requisicao) {
    return (
      <div className="space-y-6">
        <AdminPageHeader icon={ClipboardList} title={t("notFound.title")} />
        <Button asChild variant="outline" className="gap-2">
          <Link to="/admin/requisicoes"><ChevronLeft className="h-4 w-4" /> {t("back")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <motion.div className="space-y-6" {...motionProps}>
      <div className="flex items-center gap-2">
        <Button asChild size="sm" variant="ghost">
          <Link to="/admin/requisicoes"><ChevronLeft className="h-4 w-4" /> {t("back")}</Link>
        </Button>
      </div>

      <AdminPageHeader
        icon={ClipboardList}
        title={requisicao.numero}
        description={[requisicao.clienteNome, laboratorio ? `${laboratorio.code} — ${laboratorio.name}` : null].filter(Boolean).join(" · ")}
      >
        <Badge variant="outline" className="capitalize">{t(`tipoSujeito.${requisicao.tipoSujeito}`)}</Badge>
      </AdminPageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <p className="text-sm font-semibold flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-primary" /> {t("sections.amostras")} ({requisicao.amostras?.length ?? 0})
          </p>

          {(requisicao.amostras ?? []).map((amostra) => {
            const boletim = amostra.boletimInterno;
            const ba = boletim?.boletimAnalise;
            const validadores = ba ? [ba.validador1Id, ba.validador2Id, ba.validador3Id].filter((v): v is string => !!v) : [];
            const required = laboratorio?.validadorCount ?? 2;

            return (
              <Card key={amostra.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-3 p-4">
                  <div>
                    <p className="font-mono text-sm font-semibold">{amostra.numero}</p>
                    <p className="text-sm text-muted-foreground">{amostra.tipoAmostra}</p>
                  </div>
                  <Badge variant={AMOSTRA_STATUS_VARIANT[amostra.status]}>{t(`amostraStatus.${amostra.status}`)}</Badge>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-3">
                  {amostra.sujeito && (
                    <p className="text-xs text-muted-foreground">
                      {Object.entries(amostra.sujeito).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                    </p>
                  )}

                  {amostra.status === "recebida" && (
                    <div className="flex gap-2">
                      {canEdit && (
                        <>
                          <Button size="sm" onClick={() => handleAceitar(amostra)} disabled={aceitarAmostra.isPending} className="gap-2">
                            <CheckCircle2 className="h-4 w-4" /> {t("actions.aceitar")}
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => openRejeitar(amostra)} className="gap-2">
                            <XCircle className="h-4 w-4" /> {t("actions.rejeitar")}
                          </Button>
                        </>
                      )}
                    </div>
                  )}

                  {amostra.status === "rejeitada" && amostra.rejeicao && (
                    <div className="rounded-md bg-destructive/5 border border-destructive/20 p-3 text-sm space-y-1">
                      <p className="font-medium">
                        {t("rejeicao.motivo")}: {criterioMotivo(amostra.rejeicao.criterioRejeicaoId)}
                      </p>
                      {amostra.rejeicao.detalhe && <p className="text-xs text-muted-foreground">{amostra.rejeicao.detalhe}</p>}
                      <p className="text-xs text-muted-foreground">{t("rejeicao.assinatura")}: {amostra.rejeicao.assinaturaResponsavel} · {fmtDateTime(amostra.rejeicao.rejeitadaEm)}</p>
                    </div>
                  )}

                  {amostra.status === "aceite" && boletim && (
                    <div className="rounded-md border border-border/60 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-mono text-muted-foreground">{boletim.numeroAnalise}</p>
                        <Badge variant={BOLETIM_STATUS_VARIANT[boletim.status] ?? "outline"}>{t(`boletimStatus.${boletim.status}`)}</Badge>
                      </div>

                      {ba?.resultado != null && (
                        <p className="text-xs text-muted-foreground">
                          {Object.entries((ba.resultado as { parametros?: Record<string, unknown> }).parametros ?? {})
                            .map(([k, v]) => `${k}: ${v}`).join(" · ")}
                        </p>
                      )}

                      {(boletim.status === "resultado_registado" || boletim.status === "em_validacao") && validadores.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {t("validacao.progresso", { count: validadores.length, required })} — {validadores.map(userName).join(", ")}
                        </p>
                      )}

                      {boletim.status === "aprovado" && (
                        <p className="text-xs text-muted-foreground">{t("validacao.aprovadoPor")}: {userName(ba?.aprovadoPorId ?? null)} · {fmtDateTime(ba?.aprovadoEm ?? null)}</p>
                      )}
                      {boletim.status === "comunicado" && (
                        <p className="text-xs text-muted-foreground">{t("validacao.comunicadoEm")}: {fmtDateTime(ba?.comunicadoEm ?? null)}</p>
                      )}

                      <div className="flex gap-2 pt-1">
                        {boletim.status === "em_analise" && canEdit && (
                          <Button size="sm" variant="outline" onClick={() => openResultado(amostra)} className="gap-2">
                            <FileText className="h-4 w-4" /> {t("actions.registarResultado")}
                          </Button>
                        )}
                        {(boletim.status === "resultado_registado" || boletim.status === "em_validacao") && canValidar && (
                          <Button size="sm" variant="outline" onClick={() => handleValidar(amostra)} disabled={validarBoletim.isPending} className="gap-2">
                            <ShieldCheck className="h-4 w-4" /> {t("actions.validar")}
                          </Button>
                        )}
                        {boletim.status === "aprovado" && canValidar && (
                          <Button size="sm" onClick={() => handleComunicar(amostra)} disabled={comunicarBoletim.isPending} className="gap-2">
                            <Send className="h-4 w-4" /> {t("actions.comunicar")}
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="space-y-6">
          <AdminCard title={t("sections.info")}>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">{t("info.cliente")}</dt>
                <dd className="font-medium">{requisicao.clienteNome}</dd>
              </div>
              {requisicao.clienteContacto && (
                <div>
                  <dt className="text-xs text-muted-foreground">{t("info.contacto")}</dt>
                  <dd>{requisicao.clienteContacto}</dd>
                </div>
              )}
              {requisicao.veterinarioResponsavel && (
                <div>
                  <dt className="text-xs text-muted-foreground">{t("info.veterinario")}</dt>
                  <dd>{requisicao.veterinarioResponsavel}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-muted-foreground">{t("info.criadaEm")}</dt>
                <dd>{fmtDateTime(requisicao.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">{t("info.consentimento")}</dt>
                <dd>
                  <Badge variant={requisicao.consentimento ? "default" : "destructive"}>
                    {requisicao.consentimento ? t("info.consentimentoSim") : t("info.consentimentoNao")}
                  </Badge>
                </dd>
              </div>
            </dl>
          </AdminCard>

          {laboratorio && (
            <AdminCard title={t("sections.laboratorio")}>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">{t("info.area")}</dt>
                  <dd className="font-medium">{laboratorio.code} — {laboratorio.name}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">{t("info.validadores")}</dt>
                  <dd>{laboratorio.validadorCount}</dd>
                </div>
                {laboratorio.slaHoras && (
                  <div>
                    <dt className="text-xs text-muted-foreground">{t("info.sla")}</dt>
                    <dd>{t("info.slaHoras", { count: laboratorio.slaHoras })}</dd>
                  </div>
                )}
              </dl>
            </AdminCard>
          )}
        </div>
      </div>

      <Dialog open={!!rejeitarAlvo} onOpenChange={(o) => !o && setRejeitarAlvo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("rejeitarDialog.title")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>{t("rejeitarDialog.criterio")}</Label>
              <Select value={criterioId} onValueChange={setCriterioId}>
                <SelectTrigger><SelectValue placeholder={t("rejeitarDialog.criterioPlaceholder")} /></SelectTrigger>
                <SelectContent>
                  {(criteriosQuery.data ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.codigo} — {c.motivo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("rejeitarDialog.detalhe")}</Label>
              <Textarea rows={2} value={detalheRejeicao} onChange={(e) => setDetalheRejeicao(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("rejeitarDialog.assinatura")}</Label>
              <Input value={assinatura} onChange={(e) => setAssinatura(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejeitarAlvo(null)}>{t("rejeitarDialog.cancel")}</Button>
            <Button variant="destructive" onClick={confirmRejeitar} disabled={!criterioId || !assinatura.trim() || rejeitarAmostra.isPending}>
              {t("rejeitarDialog.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!resultadoAlvo} onOpenChange={(o) => !o && setResultadoAlvo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("resultadoDialog.title")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {parametros.map((p, index) => (
              <div key={index} className="flex gap-2 items-end">
                <div className="flex-1 space-y-1.5">
                  <Label className="text-xs">{t("resultadoDialog.parametro")}</Label>
                  <Input
                    value={p.chave}
                    onChange={(e) => setParametros((prev) => prev.map((row, i) => (i === index ? { ...row, chave: e.target.value } : row)))}
                  />
                </div>
                <div className="flex-1 space-y-1.5">
                  <Label className="text-xs">{t("resultadoDialog.valor")}</Label>
                  <Input
                    value={p.valor}
                    onChange={(e) => setParametros((prev) => prev.map((row, i) => (i === index ? { ...row, valor: e.target.value } : row)))}
                  />
                </div>
                {parametros.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => setParametros((prev) => prev.filter((_, i) => i !== index))}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => setParametros((prev) => [...prev, { chave: "", valor: "" }])} className="gap-2">
              <Plus className="h-3.5 w-3.5" /> {t("resultadoDialog.add")}
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResultadoAlvo(null)}>{t("resultadoDialog.cancel")}</Button>
            <Button onClick={confirmResultado} disabled={registarResultado.isPending}>{t("resultadoDialog.confirm")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
