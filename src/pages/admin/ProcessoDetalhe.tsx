import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProcessAttachmentsPanel } from "@/components/admin/ProcessAttachmentsPanel";
import { useToast } from "@/hooks/use-toast";
import {
  Workflow, ChevronLeft, CheckCircle2, RotateCcw, Clock, User as UserIcon,
  Calendar, MessageSquare, XCircle, Pencil,
} from "lucide-react";
import type { AppRole } from "@/lib/permissions";

interface Process {
  id: string; code: string; type_id: string; title: string; description: string | null;
  requester_id: string; current_step_id: string | null;
  status: "aberto"|"em_curso"|"concluido"|"cancelado";
  priority: string; due_date: string | null; opened_at: string; closed_at: string | null;
}
interface Step {
  id: string; process_id: string; order_index: number; name: string;
  assignee_user_id: string | null; assignee_role: AppRole | null;
  status: "pendente"|"em_curso"|"concluida"|"devolvida";
  started_at: string | null; completed_at: string | null; due_at: string | null; notes: string | null;
}
interface Event {
  id: string; process_id: string; step_id: string | null; actor_id: string | null;
  event_type: string; payload: any; created_at: string;
}

const stepStatusVariant: Record<string, "default"|"secondary"|"destructive"|"outline"> = {
  pendente: "outline", em_curso: "secondary", concluida: "default", devolvida: "destructive",
};
const stepStatusLabel: Record<string, string> = {
  pendente: "Pendente", em_curso: "Em curso", concluida: "Concluída", devolvida: "Devolvida",
};

export default function ProcessoDetalhe() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [process, setProcess] = useState<Process | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [typeName, setTypeName] = useState("");
  const [comment, setComment] = useState("");
  const [actionNote, setActionNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<{ user_id: string; full_name: string }[]>([]);
  const [assignee, setAssignee] = useState<string>("");

  // Cancel dialog
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "", description: "", priority: "normal", due_date: "",
  });

  const fetchAll = async () => {
    if (!id) return;
    setLoading(true);
    const [{ data: p }, { data: s }, { data: e }] = await Promise.all([
      supabase.from("processes").select("*").eq("id", id).maybeSingle(),
      supabase.from("process_steps").select("*").eq("process_id", id).order("order_index"),
      supabase.from("process_events").select("*").eq("process_id", id).order("created_at", { ascending: false }),
    ]);
    setProcess(p as Process | null);
    setSteps((s ?? []) as Step[]);
    setEvents((e ?? []) as Event[]);
    if (p) {
      const { data: t } = await supabase.from("process_types").select("name").eq("id", (p as any).type_id).maybeSingle();
      setTypeName(t?.name ?? "");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
    supabase.from("profiles").select("user_id, full_name").order("full_name")
      .then(({ data }) => setUsers((data ?? []) as any));
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [id]);

  // Realtime: refresh when steps/events/process change
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`process-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "processes", filter: `id=eq.${id}` }, fetchAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "process_steps", filter: `process_id=eq.${id}` }, fetchAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "process_events", filter: `process_id=eq.${id}` }, fetchAll)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [id]);

  const currentStep = steps.find(s => s.id === process?.current_step_id) ?? steps.find(s => s.status === "em_curso");

  const notify = async (userIds: string[], title: string, message: string) => {
    if (!process) return;
    const unique = Array.from(new Set(userIds.filter(Boolean)));
    if (unique.length === 0) return;
    await supabase.from("notifications").insert(
      unique.map(uid => ({
        user_id: uid, title, message,
        link: `/admin/processos/${process.id}`, type: "info" as const,
      }))
    );
  };

  const resolveStepAssignees = async (step: Step): Promise<string[]> => {
    if (step.assignee_user_id) return [step.assignee_user_id];
    if (step.assignee_role) {
      const { data } = await supabase.from("user_roles").select("user_id").eq("role", step.assignee_role);
      return (data ?? []).map((r: any) => r.user_id);
    }
    return [];
  };

  const advanceStep = async () => {
    if (!process || !currentStep || !user) return;
    await supabase.from("process_steps").update({
      status: "concluida", completed_at: new Date().toISOString(),
      notes: actionNote.trim() || currentStep.notes,
    }).eq("id", currentStep.id);

    const next = steps.find(s => s.order_index > currentStep.order_index && s.status !== "concluida");
    if (next) {
      const nextPatch: any = { status: "em_curso", started_at: new Date().toISOString() };
      if (assignee) nextPatch.assignee_user_id = assignee;
      await supabase.from("process_steps").update(nextPatch).eq("id", next.id);
      await supabase.from("processes").update({
        current_step_id: next.id, status: "em_curso",
      }).eq("id", process.id);
      await supabase.from("process_events").insert({
        process_id: process.id, step_id: currentStep.id, actor_id: user.id,
        event_type: "avancado", payload: { notes: actionNote, next: next.name, assignee: assignee || null },
      });
      const updatedNext = { ...next, ...nextPatch } as Step;
      const assignees = await resolveStepAssignees(updatedNext);
      await notify(
        [...assignees, process.requester_id],
        `Processo ${process.code}`,
        `Etapa actual: ${next.name}`,
      );
      toast({ title: "Etapa concluída", description: `Avançou para "${next.name}"` });
    } else {
      await supabase.from("processes").update({
        status: "concluido", closed_at: new Date().toISOString(), current_step_id: null,
      }).eq("id", process.id);
      await supabase.from("process_events").insert({
        process_id: process.id, step_id: currentStep.id, actor_id: user.id,
        event_type: "fechado", payload: { notes: actionNote },
      });
      await notify([process.requester_id], `Processo ${process.code} concluído`, process.title);
      toast({ title: "Processo concluído" });
    }
    setActionNote(""); setAssignee("");
    fetchAll();
  };

  const returnStep = async () => {
    if (!process || !currentStep || !user) return;
    const prev = [...steps].reverse().find(s => s.order_index < currentStep.order_index);
    if (!prev) {
      toast({ title: "Sem etapa anterior", variant: "destructive" });
      return;
    }
    await supabase.from("process_steps").update({
      status: "devolvida", notes: actionNote.trim() || currentStep.notes,
    }).eq("id", currentStep.id);
    await supabase.from("process_steps").update({
      status: "em_curso", started_at: new Date().toISOString(), completed_at: null,
    }).eq("id", prev.id);
    await supabase.from("processes").update({ current_step_id: prev.id }).eq("id", process.id);
    await supabase.from("process_events").insert({
      process_id: process.id, step_id: currentStep.id, actor_id: user.id,
      event_type: "devolvido", payload: { notes: actionNote, to: prev.name },
    });
    const assignees = await resolveStepAssignees(prev);
    await notify(
      [...assignees, process.requester_id],
      `Processo ${process.code} devolvido`,
      `Voltou para: ${prev.name}`,
    );
    setActionNote("");
    toast({ title: "Etapa devolvida", description: `Para "${prev.name}"` });
    fetchAll();
  };

  const openCancel = () => { setCancelReason(""); setCancelOpen(true); };
  const confirmCancel = async () => {
    if (!process || !user) return;
    await supabase.from("processes").update({
      status: "cancelado", closed_at: new Date().toISOString(),
    }).eq("id", process.id);
    await supabase.from("process_events").insert({
      process_id: process.id, actor_id: user.id, event_type: "cancelado",
      payload: { reason: cancelReason },
    });
    await notify([process.requester_id], `Processo ${process.code} cancelado`, cancelReason || process.title);
    toast({ title: "Processo cancelado" });
    setCancelOpen(false);
    fetchAll();
  };

  const openEdit = () => {
    if (!process) return;
    setEditForm({
      title: process.title, description: process.description ?? "",
      priority: process.priority, due_date: process.due_date ?? "",
    });
    setEditOpen(true);
  };
  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!process) return;
    const { error } = await supabase.from("processes").update({
      title: editForm.title.trim(),
      description: editForm.description.trim() || null,
      priority: editForm.priority as any,
      due_date: editForm.due_date || null,
    }).eq("id", process.id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Processo actualizado" });
    setEditOpen(false);
    fetchAll();
  };

  const addComment = async () => {
    if (!process || !user || !comment.trim()) return;
    await supabase.from("process_events").insert({
      process_id: process.id, actor_id: user.id, event_type: "comentario",
      payload: { text: comment.trim() },
    });
    setComment("");
    fetchAll();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <AdminPageHeader icon={Workflow} title="A carregar…" />
        <AdminCard loading />
      </div>
    );
  }

  if (!process) {
    return (
      <div className="space-y-6">
        <AdminPageHeader icon={Workflow} title="Processo não encontrado" />
        <Button asChild variant="outline"><Link to="/admin/processos"><ChevronLeft className="h-4 w-4" /> Voltar</Link></Button>
      </div>
    );
  }

  const canActOnCurrent = currentStep && user && (
    currentStep.assignee_user_id === user.id || currentStep.assignee_role !== null
    // RLS will enforce; UI is permissive
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild size="sm" variant="ghost">
          <Link to="/admin/processos"><ChevronLeft className="h-4 w-4" /> Voltar</Link>
        </Button>
      </div>

      <AdminPageHeader
        icon={Workflow}
        title={process.title}
        description={`${typeName} · ${process.code}`}
      >
        <Badge variant="outline">{process.priority}</Badge>
        <Badge variant={process.status === "concluido" ? "default" : process.status === "cancelado" ? "destructive" : "secondary"}>
          {process.status === "em_curso" ? "Em curso" : process.status.charAt(0).toUpperCase() + process.status.slice(1)}
        </Badge>
      </AdminPageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          {process.description && (
            <AdminCard title="Descrição">
              <p className="text-sm whitespace-pre-wrap">{process.description}</p>
            </AdminCard>
          )}

          <AdminCard title="Etapas do processo">
            <div className="space-y-3">
              {steps.map((s, idx) => {
                const isCurrent = s.id === currentStep?.id;
                return (
                  <div
                    key={s.id}
                    className={`relative pl-10 pb-4 ${idx < steps.length - 1 ? "border-l-2 border-border ml-3" : "ml-3"}`}
                  >
                    <div className={`absolute -left-3 top-0 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      s.status === "concluida" ? "bg-primary text-primary-foreground"
                      : isCurrent ? "bg-secondary text-secondary-foreground ring-2 ring-primary"
                      : s.status === "devolvida" ? "bg-destructive text-destructive-foreground"
                      : "bg-muted text-muted-foreground"
                    }`}>
                      {s.order_index}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <p className="font-semibold text-sm">{s.name}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          {s.assignee_role && <span className="capitalize">Papel: {s.assignee_role}</span>}
                          {s.due_at && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(s.due_at).toLocaleDateString("pt-PT")}</span>}
                          {s.completed_at && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Concluída {new Date(s.completed_at).toLocaleDateString("pt-PT")}</span>}
                        </div>
                        {s.notes && <p className="text-xs text-muted-foreground mt-1 italic">"{s.notes}"</p>}
                      </div>
                      <Badge variant={stepStatusVariant[s.status]}>{stepStatusLabel[s.status]}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>

            {currentStep && process.status === "em_curso" && (
              <div className="mt-6 pt-4 border-t space-y-3">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-secondary" /> Etapa actual: {currentStep.name}
                </p>
                <Textarea
                  placeholder="Notas / parecer da etapa…"
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  rows={2}
                />
                <div>
                  <Label className="text-xs flex items-center gap-1 mb-1">
                    <UserIcon className="h-3 w-3" /> Atribuir próxima etapa a (opcional)
                  </Label>
                  <Select value={assignee} onValueChange={setAssignee}>
                    <SelectTrigger><SelectValue placeholder="Manter atribuição por papel" /></SelectTrigger>
                    <SelectContent>
                      {users.map(u => (
                        <SelectItem key={u.user_id} value={u.user_id}>{u.full_name || u.user_id.slice(0, 8)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={advanceStep} className="gap-2">
                    <CheckCircle2 className="h-4 w-4" /> Concluir e avançar
                  </Button>
                  <Button variant="outline" onClick={returnStep} className="gap-2">
                    <RotateCcw className="h-4 w-4" /> Devolver à anterior
                  </Button>
                  <Button variant="outline" onClick={openEdit} className="gap-2">
                    <Pencil className="h-4 w-4" /> Editar
                  </Button>
                  <Button variant="destructive" onClick={openCancel} className="gap-2 ml-auto">
                    <XCircle className="h-4 w-4" /> Cancelar processo
                  </Button>
                </div>
              </div>
            )}
          </AdminCard>

          <AdminCard title="Cronologia">
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem eventos registados.</p>
            ) : (
              <div className="space-y-3">
                {events.map(e => (
                  <div key={e.id} className="flex gap-3 text-sm">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                      <MessageSquare className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] capitalize">{e.event_type.replace(/_/g, " ")}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(e.created_at).toLocaleString("pt-PT")}
                        </span>
                      </div>
                      {e.payload && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {e.payload.text ?? e.payload.notes ?? (e.payload.next ? `→ ${e.payload.next}` : "")}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 pt-4 border-t flex gap-2">
              <Textarea
                placeholder="Adicionar comentário…"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
                className="flex-1"
              />
              <Button onClick={addComment} disabled={!comment.trim()}>Comentar</Button>
            </div>
          </AdminCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <AdminCard title="Informação">
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Código</dt>
                <dd className="font-mono">{process.code}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Tipo</dt>
                <dd>{typeName}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Aberto em</dt>
                <dd>{new Date(process.opened_at).toLocaleString("pt-PT")}</dd>
              </div>
              {process.due_date && (
                <div>
                  <dt className="text-xs text-muted-foreground">Prazo</dt>
                  <dd>{new Date(process.due_date).toLocaleDateString("pt-PT")}</dd>
                </div>
              )}
              {process.closed_at && (
                <div>
                  <dt className="text-xs text-muted-foreground">Fechado em</dt>
                  <dd>{new Date(process.closed_at).toLocaleString("pt-PT")}</dd>
                </div>
              )}
            </dl>
          </AdminCard>

          <AdminCard title="Progresso">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Etapas concluídas</span>
                <span className="font-semibold">
                  {steps.filter(s => s.status === "concluida").length} / {steps.length}
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${steps.length > 0 ? (steps.filter(s => s.status === "concluida").length / steps.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          </AdminCard>

          <AdminCard>
            <ProcessAttachmentsPanel processId={process.id} />
          </AdminCard>
        </div>
      </div>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Cancelar processo</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Label>Justificação</Label>
            <Textarea rows={3} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Motivo do cancelamento…" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>Voltar</Button>
            <Button variant="destructive" onClick={confirmCancel}>Cancelar processo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar processo</DialogTitle></DialogHeader>
          <form onSubmit={saveEdit} className="space-y-3">
            <div>
              <Label>Título *</Label>
              <Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} required />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea rows={3} value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Prioridade</Label>
                <Select value={editForm.priority} onValueChange={(v) => setEditForm({ ...editForm, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Prazo</Label>
                <Input type="date" value={editForm.due_date} onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
              <Button type="submit">Guardar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
