import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  ClipboardCheck, Plus, Pencil, Trash2, Award, Users, CheckCircle2,
  Send, ThumbsUp, ThumbsDown, RotateCcw, History, FileText, ShieldCheck,
} from "lucide-react";

interface Cycle { id: string; name: string; year: number; start_date: string; end_date: string; status: string; description: string | null }
interface Criteria { id: string; cycle_id: string; name: string; weight: number; description: string | null; display_order: number | null }
interface Evaluation {
  id: string; cycle_id: string; employee_id: string; evaluator_id: string | null;
  evaluation_date: string | null; global_score: number | null;
  strengths: string | null; improvements: string | null; general_comments: string | null;
  status: string; submitted_at: string | null; approved_at: string | null;
  approved_by: string | null; rejection_reason: string | null; acknowledged_at: string | null;
}
interface Score { id: string; evaluation_id: string; criteria_id: string; score: number; comment: string | null }
interface HistoryRow { id: string; evaluation_id: string; actor_id: string | null; action: string; from_status: string | null; to_status: string | null; comment: string | null; changes: any; created_at: string }

const STATUS_COLORS: Record<string, string> = {
  rascunho: "bg-muted text-muted-foreground",
  submetida: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  aprovada: "bg-green-500/15 text-green-700 border-green-500/30",
  rejeitada: "bg-red-500/15 text-red-700 border-red-500/30",
  validada: "bg-primary/15 text-primary border-primary/30",
};

export default function Avaliacoes() {
  const { user } = useAuth();
  const { canWrite, role } = useUserRole();
  const { toast } = useToast();
  const canEdit = canWrite("avaliacoes");
  const isApprover = role === "admin" || role === "diretor";

  const [tab, setTab] = useState("avaliacoes");
  const [loading, setLoading] = useState(true);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [criteria, setCriteria] = useState<Criteria[]>([]);
  const [evals, setEvals] = useState<Evaluation[]>([]);
  const [profiles, setProfiles] = useState<{ user_id: string; full_name: string }[]>([]);

  const [cycleOpen, setCycleOpen] = useState(false);
  const [cycleEdit, setCycleEdit] = useState<Cycle | null>(null);
  const [critOpen, setCritOpen] = useState(false);
  const [critEdit, setCritEdit] = useState<Criteria | null>(null);
  const [evalOpen, setEvalOpen] = useState(false);
  const [evalEdit, setEvalEdit] = useState<Evaluation | null>(null);
  const [del, setDel] = useState<{ table: string; id: string } | null>(null);
  const [detail, setDetail] = useState<Evaluation | null>(null);
  const [rejectOpen, setRejectOpen] = useState<Evaluation | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const load = async () => {
    setLoading(true);
    const [c, k, e, p] = await Promise.all([
      supabase.from("evaluation_cycles").select("*").order("year", { ascending: false }),
      supabase.from("evaluation_criteria").select("*").order("display_order"),
      supabase.from("employee_evaluations").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id, full_name").order("full_name"),
    ]);
    if (c.data) setCycles(c.data as Cycle[]);
    if (k.data) setCriteria(k.data as Criteria[]);
    if (e.data) setEvals(e.data as Evaluation[]);
    if (p.data) setProfiles(p.data as any);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const profileName = (id: string | null) => id ? (profiles.find((p) => p.user_id === id)?.full_name || id.slice(0, 8)) : "—";
  const activeCycle = cycles.find((c) => c.status === "aberto");

  const kpis = useMemo(() => {
    const inActive = evals.filter((e) => e.cycle_id === activeCycle?.id);
    const approved = inActive.filter((e) => e.status === "aprovada" || e.status === "validada").length;
    const pending = inActive.filter((e) => e.status === "submetida").length;
    const avg = inActive.filter((e) => e.global_score != null);
    return {
      cycle: activeCycle?.name ?? "—",
      total: inActive.length,
      pending,
      approvedPct: inActive.length ? Math.round((approved / inActive.length) * 100) : 0,
      avgScore: avg.length ? (avg.reduce((s, e) => s + Number(e.global_score), 0) / avg.length).toFixed(1) : "—",
    };
  }, [evals, activeCycle]);

  const logActivity = async (action: string, entity_id: string, details?: any) => {
    if (!user) return;
    await supabase.from("activity_logs").insert({
      user_id: user.id, action, entity_type: "employee_evaluation",
      entity_id, details: details ?? null,
    });
  };

  const saveCycle = async (f: Partial<Cycle>) => {
    if (!f.name || !f.start_date || !f.end_date) return toast({ title: "Preencha nome e datas", variant: "destructive" });
    const payload = { name: f.name, year: f.year || new Date().getFullYear(), start_date: f.start_date, end_date: f.end_date, status: f.status || "planeado", description: f.description || null, ...(cycleEdit ? {} : { created_by: user?.id }) };
    const { error } = cycleEdit
      ? await supabase.from("evaluation_cycles").update(payload).eq("id", cycleEdit.id)
      : await supabase.from("evaluation_cycles").insert(payload);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    toast({ title: "Ciclo guardado" });
    setCycleOpen(false); setCycleEdit(null); load();
  };

  const saveCrit = async (f: Partial<Criteria>) => {
    if (!f.cycle_id || !f.name) return toast({ title: "Selecciona ciclo e nome", variant: "destructive" });
    const payload = { cycle_id: f.cycle_id, name: f.name, weight: f.weight ?? 1, description: f.description || null, display_order: f.display_order ?? 0 };
    const { error } = critEdit
      ? await supabase.from("evaluation_criteria").update(payload).eq("id", critEdit.id)
      : await supabase.from("evaluation_criteria").insert(payload);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    toast({ title: "Critério guardado" });
    setCritOpen(false); setCritEdit(null); load();
  };

  const saveEval = async (f: Partial<Evaluation>) => {
    if (!f.cycle_id || !f.employee_id) return toast({ title: "Ciclo e colaborador são obrigatórios", variant: "destructive" });
    const payload: any = {
      cycle_id: f.cycle_id, employee_id: f.employee_id,
      evaluator_id: f.evaluator_id || user?.id, evaluation_date: f.evaluation_date || null,
      global_score: f.global_score ?? null, strengths: f.strengths || null,
      improvements: f.improvements || null, general_comments: f.general_comments || null,
      status: f.status || "rascunho",
    };
    const { data, error } = evalEdit
      ? await supabase.from("employee_evaluations").update(payload).eq("id", evalEdit.id).select().single()
      : await supabase.from("employee_evaluations").insert(payload).select().single();
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    if (data) await logActivity(evalEdit ? "evaluation.updated" : "evaluation.created", data.id);
    toast({ title: "Avaliação guardada" });
    setEvalOpen(false); setEvalEdit(null); load();
  };

  const transition = async (ev: Evaluation, patch: Partial<Evaluation>, action: string) => {
    const { error } = await supabase.from("employee_evaluations").update(patch).eq("id", ev.id);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    await logActivity(action, ev.id, patch);
    toast({ title: "Estado actualizado" });
    load();
    if (detail?.id === ev.id) setDetail({ ...ev, ...patch } as Evaluation);
  };

  const submit = (ev: Evaluation) => transition(ev, { status: "submetida", submitted_at: new Date().toISOString() } as any, "evaluation.submitted");
  const approve = (ev: Evaluation) => transition(ev, { status: "aprovada", approved_by: user?.id, approved_at: new Date().toISOString(), rejection_reason: null } as any, "evaluation.approved");
  const reopen = (ev: Evaluation) => transition(ev, { status: "rascunho", approved_by: null, approved_at: null, rejection_reason: null, acknowledged_at: null } as any, "evaluation.reopened");
  const acknowledge = (ev: Evaluation) => transition(ev, { acknowledged_at: new Date().toISOString(), status: "validada" } as any, "evaluation.acknowledged");
  const doReject = async () => {
    if (!rejectOpen) return;
    if (!rejectReason.trim()) return toast({ title: "Indique o motivo", variant: "destructive" });
    await transition(rejectOpen, { status: "rejeitada", rejection_reason: rejectReason } as any, "evaluation.rejected");
    setRejectOpen(null); setRejectReason("");
  };

  const confirmDelete = async () => {
    if (!del) return;
    const { error } = await supabase.from(del.table as any).delete().eq("id", del.id);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else toast({ title: "Removido" });
    setDel(null); load();
  };

  const renderActions = (e: Evaluation) => {
    const isEvaluator = e.evaluator_id === user?.id;
    const isEmployee = e.employee_id === user?.id;
    return (
      <div className="flex items-center gap-1 flex-wrap">
        <Button size="icon" variant="ghost" title="Detalhes" onClick={() => setDetail(e)}><FileText className="h-4 w-4" /></Button>
        {(canEdit || isEvaluator) && ["rascunho", "rejeitada"].includes(e.status) && (
          <Button size="icon" variant="ghost" title="Editar" onClick={() => { setEvalEdit(e); setEvalOpen(true); }}><Pencil className="h-4 w-4" /></Button>
        )}
        {(canEdit || isEvaluator) && ["rascunho", "rejeitada"].includes(e.status) && (
          <Button size="icon" variant="ghost" title="Submeter" onClick={() => submit(e)}><Send className="h-4 w-4 text-blue-600" /></Button>
        )}
        {isApprover && e.status === "submetida" && (
          <>
            <Button size="icon" variant="ghost" title="Aprovar" onClick={() => approve(e)}><ThumbsUp className="h-4 w-4 text-green-600" /></Button>
            <Button size="icon" variant="ghost" title="Rejeitar" onClick={() => { setRejectOpen(e); setRejectReason(""); }}><ThumbsDown className="h-4 w-4 text-red-600" /></Button>
          </>
        )}
        {isApprover && ["aprovada", "validada", "rejeitada"].includes(e.status) && (
          <Button size="icon" variant="ghost" title="Reabrir" onClick={() => reopen(e)}><RotateCcw className="h-4 w-4" /></Button>
        )}
        {isEmployee && e.status === "aprovada" && !e.acknowledged_at && (
          <Button size="sm" variant="outline" onClick={() => acknowledge(e)}><ShieldCheck className="h-4 w-4 mr-1" /> Reconhecer</Button>
        )}
        {canEdit && (
          <Button size="icon" variant="ghost" title="Eliminar" onClick={() => setDel({ table: "employee_evaluations", id: e.id })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader icon={ClipboardCheck} title="Avaliações de Desempenho" description="Ciclos, critérios, fluxo de submissão e aprovação com auditoria." />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <AdminCard variant="gradient-green-gold" icon={Award} title="Ciclo activo" metric={kpis.cycle} stagger={1} />
        <AdminCard variant="glass" icon={Users} title="Avaliações" metric={kpis.total} stagger={2} />
        <AdminCard variant="glass" icon={Send} title="Pendentes" metric={kpis.pending} stagger={3} />
        <AdminCard variant="glass" icon={CheckCircle2} title="% aprovadas" metric={`${kpis.approvedPct}%`} stagger={4} />
        <AdminCard variant="glass" icon={Award} title="Média global" metric={kpis.avgScore} stagger={5} />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="avaliacoes">Avaliações</TabsTrigger>
          <TabsTrigger value="ciclos">Ciclos</TabsTrigger>
          <TabsTrigger value="criterios">Critérios</TabsTrigger>
        </TabsList>

        <TabsContent value="avaliacoes">
          <AdminCard title="Avaliações" loading={loading} isEmpty={!loading && evals.length === 0} emptyMessage="Sem avaliações.">
            <div className="flex justify-end mb-3">
              <Button size="sm" onClick={() => { setEvalEdit(null); setEvalOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Nova Avaliação</Button>
            </div>
            <Table>
              <TableHeader><TableRow>
                <TableHead>Colaborador</TableHead><TableHead>Avaliador</TableHead><TableHead>Ciclo</TableHead>
                <TableHead>Data</TableHead><TableHead>Nota</TableHead><TableHead>Estado</TableHead>
                <TableHead className="w-64">Acções</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {evals.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{profileName(e.employee_id)}</TableCell>
                    <TableCell>{profileName(e.evaluator_id)}</TableCell>
                    <TableCell className="text-xs">{cycles.find((c) => c.id === e.cycle_id)?.name ?? "—"}</TableCell>
                    <TableCell className="text-xs">{e.evaluation_date ?? "—"}</TableCell>
                    <TableCell>{e.global_score ?? "—"}</TableCell>
                    <TableCell><Badge variant="outline" className={STATUS_COLORS[e.status]}>{e.status}</Badge></TableCell>
                    <TableCell>{renderActions(e)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AdminCard>
        </TabsContent>

        <TabsContent value="ciclos">
          <AdminCard title="Ciclos de Avaliação" loading={loading} isEmpty={!loading && cycles.length === 0} emptyMessage="Sem ciclos.">
            <div className="flex justify-end mb-3">
              {canEdit && <Button size="sm" onClick={() => { setCycleEdit(null); setCycleOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Novo Ciclo</Button>}
            </div>
            <Table>
              <TableHeader><TableRow>
                <TableHead>Nome</TableHead><TableHead>Ano</TableHead><TableHead>Período</TableHead><TableHead>Estado</TableHead>
                {canEdit && <TableHead className="w-24">Acções</TableHead>}
              </TableRow></TableHeader>
              <TableBody>
                {cycles.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.year}</TableCell>
                    <TableCell className="text-xs">{c.start_date} → {c.end_date}</TableCell>
                    <TableCell><Badge variant="outline">{c.status}</Badge></TableCell>
                    {canEdit && (
                      <TableCell>
                        <Button size="icon" variant="ghost" onClick={() => { setCycleEdit(c); setCycleOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => setDel({ table: "evaluation_cycles", id: c.id })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AdminCard>
        </TabsContent>

        <TabsContent value="criterios">
          <AdminCard title="Critérios de Avaliação" loading={loading} isEmpty={!loading && criteria.length === 0} emptyMessage="Sem critérios.">
            <div className="flex justify-end mb-3">
              {canEdit && <Button size="sm" onClick={() => { setCritEdit(null); setCritOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Novo Critério</Button>}
            </div>
            <Table>
              <TableHeader><TableRow>
                <TableHead>Ciclo</TableHead><TableHead>Nome</TableHead><TableHead>Peso</TableHead><TableHead>Descrição</TableHead>
                {canEdit && <TableHead className="w-24">Acções</TableHead>}
              </TableRow></TableHeader>
              <TableBody>
                {criteria.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="text-xs">{cycles.find((x) => x.id === c.cycle_id)?.name ?? "—"}</TableCell>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.weight}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-md truncate">{c.description ?? "—"}</TableCell>
                    {canEdit && (
                      <TableCell>
                        <Button size="icon" variant="ghost" onClick={() => { setCritEdit(c); setCritOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => setDel({ table: "evaluation_criteria", id: c.id })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AdminCard>
        </TabsContent>
      </Tabs>

      <CycleDialog open={cycleOpen} onOpenChange={(v) => { setCycleOpen(v); if (!v) setCycleEdit(null); }} row={cycleEdit} onSave={saveCycle} />
      <CritDialog open={critOpen} onOpenChange={(v) => { setCritOpen(v); if (!v) setCritEdit(null); }} row={critEdit} cycles={cycles} onSave={saveCrit} />
      <EvalDialog open={evalOpen} onOpenChange={(v) => { setEvalOpen(v); if (!v) setEvalEdit(null); }} row={evalEdit} cycles={cycles} profiles={profiles} onSave={saveEval} />
      <DetailDialog
        open={!!detail} onOpenChange={(o) => !o && setDetail(null)} evaluation={detail}
        criteria={criteria} profileName={profileName} cycles={cycles}
        cycleName={(id) => cycles.find((c) => c.id === id)?.name ?? "—"}
      />

      <Dialog open={!!rejectOpen} onOpenChange={(o) => { if (!o) { setRejectOpen(null); setRejectReason(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar avaliação</DialogTitle>
            <DialogDescription>Indique o motivo. O avaliador poderá rever e voltar a submeter.</DialogDescription>
          </DialogHeader>
          <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Motivo da rejeição..." rows={4} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setRejectOpen(null); setRejectReason(""); }}>Cancelar</Button>
            <Button variant="destructive" onClick={doReject}><ThumbsDown className="h-4 w-4 mr-1" /> Rejeitar</Button>
          </div>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog open={!!del} onOpenChange={(o) => !o && setDel(null)} title="Remover?" description="Esta acção é permanente." onConfirm={confirmDelete} />
    </div>
  );
}

function CycleDialog({ open, onOpenChange, row, onSave }: any) {
  const [f, setF] = useState<Partial<Cycle>>({});
  useEffect(() => { setF(row ?? { status: "planeado", year: new Date().getFullYear() }); }, [row, open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{row ? "Editar Ciclo" : "Novo Ciclo"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Nome *</Label><Input value={f.name || ""} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Ano</Label><Input type="number" value={f.year ?? ""} onChange={(e) => setF({ ...f, year: Number(e.target.value) })} /></div>
            <div><Label>Início *</Label><Input type="date" value={f.start_date || ""} onChange={(e) => setF({ ...f, start_date: e.target.value })} /></div>
            <div><Label>Fim *</Label><Input type="date" value={f.end_date || ""} onChange={(e) => setF({ ...f, end_date: e.target.value })} /></div>
          </div>
          <div><Label>Estado</Label>
            <Select value={f.status} onValueChange={(v) => setF({ ...f, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="planeado">Planeado</SelectItem>
                <SelectItem value="aberto">Aberto</SelectItem>
                <SelectItem value="fechado">Fechado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Descrição</Label><Textarea value={f.description || ""} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
        </div>
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => onSave(f)}>Guardar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CritDialog({ open, onOpenChange, row, cycles, onSave }: any) {
  const [f, setF] = useState<Partial<Criteria>>({});
  useEffect(() => { setF(row ?? { weight: 1, display_order: 0 }); }, [row, open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{row ? "Editar Critério" : "Novo Critério"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Ciclo *</Label>
            <Select value={f.cycle_id || ""} onValueChange={(v) => setF({ ...f, cycle_id: v })}>
              <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>{cycles.map((c: Cycle) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Nome *</Label><Input value={f.name || ""} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Peso</Label><Input type="number" step="0.1" value={f.weight ?? 1} onChange={(e) => setF({ ...f, weight: Number(e.target.value) })} /></div>
            <div><Label>Ordem</Label><Input type="number" value={f.display_order ?? 0} onChange={(e) => setF({ ...f, display_order: Number(e.target.value) })} /></div>
          </div>
          <div><Label>Descrição</Label><Textarea value={f.description || ""} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
        </div>
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => onSave(f)}>Guardar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EvalDialog({ open, onOpenChange, row, cycles, profiles, onSave }: any) {
  const [f, setF] = useState<Partial<Evaluation>>({});
  useEffect(() => { setF(row ?? { status: "rascunho" }); }, [row, open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{row ? "Editar Avaliação" : "Nova Avaliação"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Ciclo *</Label>
              <Select value={f.cycle_id || ""} onValueChange={(v) => setF({ ...f, cycle_id: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>{cycles.map((c: Cycle) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Colaborador *</Label>
              <Select value={f.employee_id || ""} onValueChange={(v) => setF({ ...f, employee_id: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>{profiles.map((p: any) => <SelectItem key={p.user_id} value={p.user_id}>{p.full_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Data</Label><Input type="date" value={f.evaluation_date || ""} onChange={(e) => setF({ ...f, evaluation_date: e.target.value })} /></div>
            <div><Label>Nota Global (0-20)</Label><Input type="number" step="0.1" min={0} max={20} value={f.global_score ?? ""} onChange={(e) => setF({ ...f, global_score: Number(e.target.value) })} /></div>
          </div>
          <div><Label>Pontos fortes</Label><Textarea value={f.strengths || ""} onChange={(e) => setF({ ...f, strengths: e.target.value })} /></div>
          <div><Label>Áreas a melhorar</Label><Textarea value={f.improvements || ""} onChange={(e) => setF({ ...f, improvements: e.target.value })} /></div>
          <div><Label>Comentários gerais</Label><Textarea value={f.general_comments || ""} onChange={(e) => setF({ ...f, general_comments: e.target.value })} /></div>
          <p className="text-xs text-muted-foreground">Ao guardar, a avaliação fica em <strong>rascunho</strong>. Use a acção <em>Submeter</em> na lista para enviar para aprovação.</p>
        </div>
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => onSave(f)}>Guardar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DetailDialog({ open, onOpenChange, evaluation, criteria, profileName, cycleName }: any) {
  const [scores, setScores] = useState<Score[]>([]);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const ev: Evaluation | null = evaluation;

  useEffect(() => {
    if (!open || !ev) return;
    setLoading(true);
    Promise.all([
      supabase.from("evaluation_scores").select("*").eq("evaluation_id", ev.id),
      supabase.from("evaluation_history").select("*").eq("evaluation_id", ev.id).order("created_at", { ascending: false }),
    ]).then(([s, h]) => {
      if (s.data) setScores(s.data as Score[]);
      if (h.data) setHistory(h.data as HistoryRow[]);
      setLoading(false);
    });
  }, [open, ev?.id]);

  if (!ev) return null;
  const cycleCriteria = criteria.filter((c: Criteria) => c.cycle_id === ev.cycle_id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" /> Avaliação — {profileName(ev.employee_id)}
          </DialogTitle>
          <DialogDescription>
            Ciclo: {cycleName(ev.cycle_id)} · Avaliador: {profileName(ev.evaluator_id)} ·{" "}
            <Badge variant="outline" className={STATUS_COLORS[ev.status]}>{ev.status}</Badge>
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="resumo">
          <TabsList>
            <TabsTrigger value="resumo">Resumo</TabsTrigger>
            <TabsTrigger value="notas">Notas por critério</TabsTrigger>
            <TabsTrigger value="historico"><History className="h-4 w-4 mr-1" /> Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="resumo" className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <Info label="Data" value={ev.evaluation_date ?? "—"} />
              <Info label="Nota global" value={ev.global_score?.toString() ?? "—"} />
              <Info label="Submetida em" value={ev.submitted_at ? new Date(ev.submitted_at).toLocaleString("pt-PT") : "—"} />
              <Info label="Aprovada em" value={ev.approved_at ? new Date(ev.approved_at).toLocaleString("pt-PT") : "—"} />
              <Info label="Aprovada por" value={profileName(ev.approved_by)} />
              <Info label="Reconhecida em" value={ev.acknowledged_at ? new Date(ev.acknowledged_at).toLocaleString("pt-PT") : "—"} />
            </div>
            {ev.rejection_reason && (
              <div className="border border-red-500/30 bg-red-500/10 rounded-md p-3">
                <p className="font-medium text-red-700 text-sm">Motivo da rejeição</p>
                <p className="text-sm">{ev.rejection_reason}</p>
              </div>
            )}
            <Block title="Pontos fortes" text={ev.strengths} />
            <Block title="Áreas a melhorar" text={ev.improvements} />
            <Block title="Comentários gerais" text={ev.general_comments} />
          </TabsContent>

          <TabsContent value="notas">
            {cycleCriteria.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Sem critérios definidos para este ciclo.</p>
            ) : (
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Critério</TableHead><TableHead>Peso</TableHead><TableHead>Nota</TableHead><TableHead>Comentário</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {cycleCriteria.map((c: Criteria) => {
                    const s = scores.find((x) => x.criteria_id === c.id);
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell>{c.weight}</TableCell>
                        <TableCell>{s?.score ?? "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{s?.comment ?? "—"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="historico">
            {loading ? <p className="text-sm text-muted-foreground py-4">A carregar…</p> :
             history.length === 0 ? <p className="text-sm text-muted-foreground py-8 text-center">Sem eventos registados.</p> : (
              <ol className="relative border-l border-border ml-3 space-y-4">
                {history.map((h) => (
                  <li key={h.id} className="ml-4">
                    <div className="absolute -left-1.5 mt-1 h-3 w-3 rounded-full bg-primary" />
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{new Date(h.created_at).toLocaleString("pt-PT")}</span>
                      <span>·</span>
                      <span>{profileName(h.actor_id)}</span>
                    </div>
                    <div className="mt-1 text-sm">
                      <Badge variant="outline" className="mr-2 capitalize">{h.action}</Badge>
                      {h.from_status && h.to_status && h.from_status !== h.to_status && (
                        <span className="text-muted-foreground">{h.from_status} → <strong className="text-foreground">{h.to_status}</strong></span>
                      )}
                    </div>
                    {h.comment && <p className="text-sm mt-1 italic">"{h.comment}"</p>}
                    {h.changes && (
                      <pre className="text-[10px] text-muted-foreground mt-1 bg-muted/40 rounded p-2 overflow-x-auto">
                        {JSON.stringify(h.changes, null, 2)}
                      </pre>
                    )}
                  </li>
                ))}
              </ol>
             )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
function Block({ title, text }: { title: string; text: string | null }) {
  if (!text) return null;
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1">{title}</p>
      <p className="text-sm whitespace-pre-wrap bg-muted/30 rounded p-2">{text}</p>
    </div>
  );
}
