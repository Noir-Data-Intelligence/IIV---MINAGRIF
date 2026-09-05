import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "framer-motion";
import {
  Workflow, ChevronLeft, CheckCircle2, RotateCcw, Clock, Calendar,
  MessageSquare, XCircle, Pencil,
} from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { ProcessAttachmentsPanel } from "@/components/admin/ProcessAttachmentsPanel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  useProcess,
  useProcessSteps,
  useProcessEvents,
  useAdvanceProcess,
  useReturnProcess,
  useCancelProcess,
  useCreateProcessEvent,
  useUpdateProcess,
} from "@/hooks/queries/useProcesses";
import { useProcessTypesList } from "@/hooks/queries/useProcessTypes";
import { PROCESS_PRIORITY, PROCESS_STATUS } from "@/lib/domain-enums";
import { formatDate } from "@/lib/format";
import { fadeIn } from "@/lib/motion";
import type { ProcessPriority, ProcessStepDto, ProcessStepStatus } from "@/types/dto/process";
import i18n from "@/i18n";
import ptDetalhe from "@/i18n/locales/pt/admin/processo-detalhe.json";
import enDetalhe from "@/i18n/locales/en/admin/processo-detalhe.json";

// Namespace autónomo registado em runtime (o bundle central só regista common/nav).
if (!i18n.hasResourceBundle("pt", "admin-processo-detalhe"))
  i18n.addResourceBundle("pt", "admin-processo-detalhe", ptDetalhe, true, true);
if (!i18n.hasResourceBundle("en", "admin-processo-detalhe"))
  i18n.addResourceBundle("en", "admin-processo-detalhe", enDetalhe, true, true);

const stepStatusVariant: Record<ProcessStepStatus, "default" | "secondary" | "destructive" | "outline"> = {
  pendente: "outline",
  em_curso: "secondary",
  concluida: "default",
  rejeitada: "destructive",
  devolvida: "destructive",
};

const PRIORITY_KEYS = Object.keys(PROCESS_PRIORITY);

export default function ProcessoDetalhe() {
  const { id } = useParams();
  const processId = id ?? "";
  const { t, i18n: i18nInstance } = useTranslation("admin-processo-detalhe");
  const { toast } = useToast();
  const { user } = useAuth();
  const prefersReduced = useReducedMotion();

  const { data: process, isLoading } = useProcess(id ?? null);
  const { data: steps = [] } = useProcessSteps(id ?? null);
  const { data: events = [] } = useProcessEvents(id ?? null);
  const { data: typesData } = useProcessTypesList({ perPage: 100 });

  const advance = useAdvanceProcess(processId);
  const returnStep = useReturnProcess(processId);
  const cancelProcess = useCancelProcess(processId);
  const createEvent = useCreateProcessEvent(processId);
  const updateProcess = useUpdateProcess();

  const [comment, setComment] = useState("");
  const [actionNote, setActionNote] = useState("");
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", description: "", priority: "normal", dueDate: "" });

  const typeName = useMemo(
    () => typesData?.data.find((ty) => ty.id === process?.typeId)?.name ?? "",
    [typesData, process],
  );

  const dateLocale = i18nInstance.language === "en" ? "en-GB" : "pt-AO";
  const fmtDateTime = (value: string) => new Date(value).toLocaleString(dateLocale);

  const currentStep =
    steps.find((s) => s.id === process?.currentStepId) ??
    steps.find((s) => s.status === "em_curso");

  const completedCount = steps.filter((s) => s.status === "concluida").length;
  const progressPct = steps.length > 0 ? (completedCount / steps.length) * 100 : 0;

  const statusLabel = (s: string) => (PROCESS_STATUS[s] ? t(`status.${s}`) : s);
  const statusVariant = (s: string) => PROCESS_STATUS[s]?.variant ?? "outline";
  const priorityLabel = (p: string) => (PROCESS_PRIORITY[p] ? t(`priority.${p}`) : p);

  const handleAdvance = async () => {
    if (!process || !currentStep) return;
    const next = steps.find((s) => s.orderIndex > currentStep.orderIndex && s.status !== "concluida");
    try {
      await advance.mutateAsync({ notes: actionNote.trim() || null, actorId: user?.id ?? null });
      setActionNote("");
      if (next) {
        toast({ title: t("toast.advanced"), description: t("toast.advancedTo", { name: next.name }) });
      } else {
        toast({ title: t("toast.completed") });
      }
    } catch {
      toast({ title: t("toast.error"), variant: "destructive" });
    }
  };

  const handleReturn = async () => {
    if (!process || !currentStep) return;
    const prev = [...steps].reverse().find((s) => s.orderIndex < currentStep.orderIndex);
    if (!prev) {
      toast({ title: t("toast.noPrevStep"), variant: "destructive" });
      return;
    }
    try {
      await returnStep.mutateAsync({ notes: actionNote.trim() || null, actorId: user?.id ?? null });
      setActionNote("");
      toast({ title: t("toast.returned"), description: t("toast.returnedTo", { name: prev.name }) });
    } catch {
      toast({ title: t("toast.error"), variant: "destructive" });
    }
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    try {
      await createEvent.mutateAsync({
        eventType: "comentario",
        payload: { text: comment.trim() },
        actorId: user?.id ?? null,
      });
      setComment("");
    } catch {
      toast({ title: t("toast.error"), variant: "destructive" });
    }
  };

  const openEdit = () => {
    if (!process) return;
    setEditForm({
      title: process.title,
      description: process.description ?? "",
      priority: process.priority,
      dueDate: process.dueDate ?? "",
    });
    setEditOpen(true);
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!process) return;
    try {
      await updateProcess.mutateAsync({
        id: process.id,
        payload: {
          title: editForm.title.trim(),
          description: editForm.description.trim() || null,
          priority: editForm.priority as ProcessPriority,
          dueDate: editForm.dueDate || null,
        },
      });
      toast({ title: t("toast.updated") });
      setEditOpen(false);
    } catch {
      toast({ title: t("toast.error"), variant: "destructive" });
    }
  };

  const confirmCancel = async () => {
    if (!process) return;
    try {
      await cancelProcess.mutateAsync({ notes: cancelReason.trim() || null, actorId: user?.id ?? null });
      toast({ title: t("toast.cancelled") });
      setCancelOpen(false);
      setCancelReason("");
    } catch {
      toast({ title: t("toast.error"), variant: "destructive" });
    }
  };

  const eventText = (payload: Record<string, unknown> | null): string => {
    if (!payload) return "";
    if (typeof payload.text === "string") return payload.text;
    if (typeof payload.notes === "string") return payload.notes;
    if (typeof payload.next === "string") return `→ ${payload.next}`;
    if (typeof payload.to === "string") return `→ ${payload.to}`;
    if (typeof payload.reason === "string") return payload.reason;
    return "";
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <AdminPageHeader icon={Workflow} title={t("loading")} />
        <AdminCard loading />
      </div>
    );
  }

  if (!process) {
    return (
      <div className="space-y-6">
        <AdminPageHeader icon={Workflow} title={t("notFound.title")} />
        <Button asChild variant="outline" className="gap-2">
          <Link to="/admin/processos"><ChevronLeft className="h-4 w-4" /> {t("back")}</Link>
        </Button>
      </div>
    );
  }

  // Editar/Cancelar devem ficar disponíveis em qualquer estado não-terminal,
  // mesmo sem etapa activa (ex.: processo "aberto" sem etapas configuradas);
  // só Avançar/Devolver exigem uma etapa em curso (ver auditoria — Gestão de
  // Processos, ANL/Crítica).
  const isTerminal = process.status === "concluido" || process.status === "cancelado";
  const showFlowActions = !!currentStep && process.status === "em_curso";
  const busy = advance.isPending || returnStep.isPending || cancelProcess.isPending;

  const motionProps = prefersReduced
    ? {}
    : { initial: "hidden" as const, animate: "visible" as const, variants: fadeIn };

  return (
    <motion.div className="space-y-6" {...motionProps}>
      <div className="flex items-center gap-2">
        <Button asChild size="sm" variant="ghost">
          <Link to="/admin/processos"><ChevronLeft className="h-4 w-4" /> {t("back")}</Link>
        </Button>
      </div>

      <AdminPageHeader
        icon={Workflow}
        title={process.title}
        description={[typeName, process.code].filter(Boolean).join(" · ")}
      >
        <Badge variant={PROCESS_PRIORITY[process.priority]?.variant ?? "outline"}>
          {priorityLabel(process.priority)}
        </Badge>
        <Badge variant={statusVariant(process.status)}>{statusLabel(process.status)}</Badge>
      </AdminPageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna principal */}
        <div className="lg:col-span-2 space-y-6">
          {process.description && (
            <AdminCard title={t("sections.description")}>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{process.description}</p>
            </AdminCard>
          )}

          <AdminCard title={t("sections.steps")}>
            <div className="space-y-1">
              {steps.map((s: ProcessStepDto, idx) => {
                const isCurrent = s.id === currentStep?.id;
                return (
                  <div
                    key={s.id}
                    className={`relative pl-10 pb-5 ${idx < steps.length - 1 ? "border-l-2 border-border ml-3" : "ml-3"}`}
                  >
                    <div
                      className={`absolute -left-3 top-0 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                        s.status === "concluida"
                          ? "bg-primary text-primary-foreground"
                          : isCurrent
                          ? "bg-secondary text-secondary-foreground ring-2 ring-primary"
                          : s.status === "devolvida" || s.status === "rejeitada"
                          ? "bg-destructive text-destructive-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {s.orderIndex}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <p className="font-semibold text-sm">{s.name}</p>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                          {s.assigneeRole && <span className="capitalize">{t("steps.role", { role: s.assigneeRole })}</span>}
                          {s.dueAt && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(s.dueAt)}
                            </span>
                          )}
                          {s.completedAt && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {t("steps.completedOn", { date: formatDate(s.completedAt) })}
                            </span>
                          )}
                        </div>
                        {s.notes && <p className="text-xs text-muted-foreground mt-1 italic">"{s.notes}"</p>}
                      </div>
                      <Badge variant={stepStatusVariant[s.status]}>{t(`stepStatus.${s.status}`)}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>

            {!isTerminal && (
              <div className="mt-6 pt-5 border-t space-y-3">
                {showFlowActions && (
                  <>
                    <p className="text-sm font-semibold flex items-center gap-2">
                      <Clock className="h-4 w-4 text-secondary" /> {t("steps.current", { name: currentStep!.name })}
                    </p>
                    <Textarea
                      placeholder={t("steps.notesPlaceholder")}
                      value={actionNote}
                      onChange={(e) => setActionNote(e.target.value)}
                      rows={2}
                    />
                  </>
                )}
                <div className="flex flex-wrap gap-2">
                  {showFlowActions && (
                    <>
                      <Button onClick={handleAdvance} disabled={busy} className="gap-2">
                        <CheckCircle2 className="h-4 w-4" /> {t("steps.advance")}
                      </Button>
                      <Button variant="outline" onClick={handleReturn} disabled={busy} className="gap-2">
                        <RotateCcw className="h-4 w-4" /> {t("steps.return")}
                      </Button>
                    </>
                  )}
                  <Button variant="outline" onClick={openEdit} className="gap-2">
                    <Pencil className="h-4 w-4" /> {t("steps.edit")}
                  </Button>
                  <Button variant="destructive" onClick={() => setCancelOpen(true)} disabled={busy} className="gap-2 ml-auto">
                    <XCircle className="h-4 w-4" /> {t("steps.cancel")}
                  </Button>
                </div>
              </div>
            )}
          </AdminCard>

          <AdminCard title={t("sections.timeline")}>
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("timeline.empty")}</p>
            ) : (
              <div className="space-y-4">
                {events.map((e) => (
                  <div key={e.id} className="flex gap-3 text-sm">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                      <MessageSquare className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {e.eventType.replace(/_/g, " ")}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{fmtDateTime(e.createdAt)}</span>
                      </div>
                      {eventText(e.payload) && (
                        <p className="mt-1 text-sm text-muted-foreground">{eventText(e.payload)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-5 pt-5 border-t flex gap-2">
              <Textarea
                placeholder={t("timeline.commentPlaceholder")}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
                className="flex-1"
              />
              <Button onClick={handleComment} disabled={!comment.trim() || createEvent.isPending}>
                {t("timeline.comment")}
              </Button>
            </div>
          </AdminCard>
        </div>

        {/* Barra lateral */}
        <div className="space-y-6">
          <AdminCard title={t("sections.info")}>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">{t("info.code")}</dt>
                <dd className="font-mono">{process.code}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">{t("info.type")}</dt>
                <dd>{typeName || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">{t("info.openedAt")}</dt>
                <dd>{fmtDateTime(process.openedAt)}</dd>
              </div>
              {process.dueDate && (
                <div>
                  <dt className="text-xs text-muted-foreground">{t("info.dueDate")}</dt>
                  <dd>{formatDate(process.dueDate)}</dd>
                </div>
              )}
              {process.closedAt && (
                <div>
                  <dt className="text-xs text-muted-foreground">{t("info.closedAt")}</dt>
                  <dd>{fmtDateTime(process.closedAt)}</dd>
                </div>
              )}
            </dl>
          </AdminCard>

          <AdminCard title={t("sections.progress")}>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{t("progress.completedSteps")}</span>
                <span className="font-semibold">
                  {completedCount} / {steps.length}
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${progressPct}%` }} />
              </div>
            </div>
          </AdminCard>

          <AdminCard title={t("sections.attachments")}>
            <ProcessAttachmentsPanel processId={process.id} />
          </AdminCard>
        </div>
      </div>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("cancelDialog.title")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>{t("cancelDialog.reasonLabel")}</Label>
            <Textarea
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder={t("cancelDialog.reasonPlaceholder")}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>{t("cancelDialog.back")}</Button>
            <Button variant="destructive" onClick={confirmCancel} disabled={cancelProcess.isPending}>
              {t("cancelDialog.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("editDialog.title")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={saveEdit} className="space-y-3">
            <div className="space-y-1.5">
              <Label>{t("editDialog.titleLabel")}</Label>
              <Input
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("editDialog.descriptionLabel")}</Label>
              <Textarea
                rows={3}
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("editDialog.priorityLabel")}</Label>
                <Select value={editForm.priority} onValueChange={(v) => setEditForm({ ...editForm, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORITY_KEYS.map((k) => (
                      <SelectItem key={k} value={k}>{t(`priority.${k}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("editDialog.dueDateLabel")}</Label>
                <Input
                  type="date"
                  value={editForm.dueDate}
                  onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                {t("editDialog.cancel")}
              </Button>
              <Button type="submit" disabled={updateProcess.isPending}>{t("editDialog.save")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
