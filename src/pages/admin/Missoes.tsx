import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Plane, Pencil, Trash2, Calendar, Wallet, FileText, Send, Workflow,
  Download, Upload, AlertTriangle, ExternalLink, Eye,
} from "lucide-react";
import { generateMissionGuidePdf } from "@/lib/missionGuidePdf";

type MissionStatus = "planeada" | "submetida" | "aprovada" | "em_curso" | "concluida" | "cancelada";
type ExpenseCat = "transporte" | "alojamento" | "alimentacao" | "combustivel" | "outro";

interface Mission {
  id: string; title: string; destination: string; purpose: string | null;
  start_date: string; end_date: string; status: MissionStatus;
  budget: number; currency: string; created_by: string | null; notes: string | null;
}
interface Guide {
  id: string; mission_id: string; guide_number: string; issue_date: string;
  per_diem: number; transport: string | null; notes: string | null;
}
interface Participant {
  id: string; mission_id: string; user_id: string; role: string; per_diem: number;
  full_name?: string;
}
interface Expense {
  id: string; mission_id: string; category: ExpenseCat; description: string | null;
  amount: number; currency: string; expense_date: string; receipt_url: string | null;
}
interface Report {
  id: string; mission_id: string; report_date: string; summary: string | null;
  outcomes: string | null; status: string; report_url: string | null;
  submitted_by: string | null; approved_by: string | null; approved_at: string | null;
}

const STATUS_LABEL: Record<MissionStatus, string> = {
  planeada: "Planeada", submetida: "Submetida", aprovada: "Aprovada",
  em_curso: "Em curso", concluida: "Concluída", cancelada: "Cancelada",
};
const STATUS_TONE: Record<MissionStatus, string> = {
  planeada: "bg-muted text-muted-foreground",
  submetida: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  aprovada: "bg-primary/15 text-primary",
  em_curso: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  concluida: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  cancelada: "bg-destructive/15 text-destructive",
};
const EXPENSE_LABEL: Record<ExpenseCat, string> = {
  transporte: "Transporte", alojamento: "Alojamento", alimentacao: "Alimentação",
  combustivel: "Combustível", outro: "Outro",
};

export default function Missoes() {
  const { user } = useAuth();
  const { canWrite } = useUserRole();
  const { toast } = useToast();
  const canEdit = canWrite("missoes");

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Mission[]>([]);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Mission | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("missions").select("*").order("start_date", { ascending: false }).limit(300);
    if (data) setRows(data as Mission[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const kpis = useMemo(() => {
    const active = rows.filter((r) => r.status === "em_curso").length;
    const planned = rows.filter((r) => r.status === "planeada" || r.status === "submetida" || r.status === "aprovada").length;
    const budget = rows.filter((r) => r.status !== "cancelada").reduce((s, r) => s + Number(r.budget || 0), 0);
    return { total: rows.length, active, planned, budget };
  }, [rows]);

  const save = async (form: Partial<Mission>) => {
    if (!form.title || !form.destination || !form.start_date || !form.end_date)
      return toast({ title: "Preencha título, destino e datas", variant: "destructive" });
    const payload = {
      title: form.title, destination: form.destination, purpose: form.purpose || null,
      start_date: form.start_date, end_date: form.end_date,
      status: (form.status || "planeada") as MissionStatus,
      budget: Number(form.budget) || 0, currency: form.currency || "AOA",
      notes: form.notes || null,
      ...(edit ? {} : { created_by: user?.id || null }),
    };
    const { error } = edit
      ? await supabase.from("missions").update(payload).eq("id", edit.id)
      : await supabase.from("missions").insert(payload);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    toast({ title: edit ? "Missão actualizada" : "Missão criada" });
    setOpen(false); setEdit(null); load();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("missions").delete().eq("id", deleteId);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else toast({ title: "Missão apagada" });
    setDeleteId(null); load();
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader icon={Plane} title="Missões de Serviço" description="Planeamento, aprovação BPM e prestação de contas de deslocações.">
        {canEdit && <Button size="sm" onClick={() => { setEdit(null); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Nova Missão
        </Button>}
      </AdminPageHeader>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AdminCard variant="gradient-green-gold" icon={Plane} title="Total" metric={kpis.total} stagger={1} />
        <AdminCard variant="glass" icon={Calendar} title="Em curso" metric={kpis.active} stagger={2} />
        <AdminCard variant="glass" icon={Calendar} title="Planeadas/Submetidas/Aprovadas" metric={kpis.planned} stagger={3} />
        <AdminCard variant="glass" icon={Wallet} title="Orçamento (AOA)" metric={kpis.budget.toLocaleString("pt-PT")} stagger={4} />
      </div>

      <AdminCard title="Missões" loading={loading} isEmpty={!loading && rows.length === 0} emptyMessage="Sem missões registadas.">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Título</TableHead><TableHead>Destino</TableHead>
            <TableHead>Início</TableHead><TableHead>Fim</TableHead>
            <TableHead>Estado</TableHead><TableHead>Orçamento</TableHead>
            <TableHead className="w-32">Acções</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.title}</TableCell>
                <TableCell>{r.destination}</TableCell>
                <TableCell>{r.start_date}</TableCell>
                <TableCell>{r.end_date}</TableCell>
                <TableCell><Badge className={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge></TableCell>
                <TableCell>{Number(r.budget).toLocaleString("pt-PT")} {r.currency}</TableCell>
                <TableCell>
                  <Button size="icon" variant="ghost" title="Detalhes" onClick={() => setDetailId(r.id)}><Eye className="h-4 w-4" /></Button>
                  {canEdit && <>
                    <Button size="icon" variant="ghost" onClick={() => { setEdit(r); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => setDeleteId(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminCard>

      <MissionDialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEdit(null); }} row={edit} onSave={save} />
      <DeleteConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}
        title="Apagar missão?" description="Esta acção é permanente." onConfirm={confirmDelete} />

      <MissionDetailDialog
        missionId={detailId}
        onOpenChange={(o) => { if (!o) { setDetailId(null); load(); } }}
        canEdit={canEdit}
      />
    </div>
  );
}

/* ---------------- Mission create/edit dialog ---------------- */
function MissionDialog({ open, onOpenChange, row, onSave }: {
  open: boolean; onOpenChange: (v: boolean) => void; row: Mission | null; onSave: (f: Partial<Mission>) => void;
}) {
  const [form, setForm] = useState<Partial<Mission>>({});
  useEffect(() => {
    setForm(row ?? {
      start_date: new Date().toISOString().slice(0, 10),
      end_date: new Date().toISOString().slice(0, 10),
      currency: "AOA", status: "planeada", budget: 0,
    });
  }, [row, open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{row ? "Editar Missão" : "Nova Missão"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Título *</Label><Input value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><Label>Destino *</Label><Input value={form.destination || ""} onChange={(e) => setForm({ ...form, destination: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Início *</Label><Input type="date" value={form.start_date || ""} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
            <div><Label>Fim *</Label><Input type="date" value={form.end_date || ""} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Estado</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as MissionStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{(Object.keys(STATUS_LABEL) as MissionStatus[]).map((k) => <SelectItem key={k} value={k}>{STATUS_LABEL[k]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Orçamento</Label><Input type="number" step="0.01" value={form.budget ?? 0} onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })} /></div>
          </div>
          <div><Label>Objectivo</Label><Textarea value={form.purpose || ""} onChange={(e) => setForm({ ...form, purpose: e.target.value })} /></div>
          <div><Label>Notas</Label><Textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => onSave(form)}>Guardar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Detail dialog with tabs ---------------- */
function MissionDetailDialog({ missionId, onOpenChange, canEdit }: {
  missionId: string | null; onOpenChange: (o: boolean) => void; canEdit: boolean;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [mission, setMission] = useState<Mission | null>(null);
  const [process, setProcess] = useState<any | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [profiles, setProfiles] = useState<{ user_id: string; full_name: string }[]>([]);
  const [guide, setGuide] = useState<Guide | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);

  const reload = async (id: string) => {
    setLoading(true);
    const [m, p, pr, g, ex, rep, profs] = await Promise.all([
      supabase.from("missions").select("*").eq("id", id).maybeSingle(),
      supabase.from("processes").select("*").eq("mission_id", id).maybeSingle(),
      supabase.from("mission_participants").select("*").eq("mission_id", id),
      supabase.from("mission_guides").select("*").eq("mission_id", id).maybeSingle(),
      supabase.from("mission_expenses").select("*").eq("mission_id", id).order("expense_date", { ascending: false }),
      supabase.from("mission_reports").select("*").eq("mission_id", id).maybeSingle(),
      supabase.from("profiles").select("user_id, full_name").order("full_name"),
    ]);
    setMission(m.data as Mission | null);
    setProcess(pr.data);
    const profMap = new Map((profs.data ?? []).map((x: any) => [x.user_id, x.full_name]));
    setParticipants(((p.data ?? []) as Participant[]).map((x) => ({ ...x, full_name: profMap.get(x.user_id) || "Utilizador" })));
    setProfiles((profs.data ?? []) as any);
    setGuide(g.data as Guide | null);
    setExpenses((ex.data ?? []) as Expense[]);
    setReport(rep.data as Report | null);
    setLoading(false);
  };

  useEffect(() => { if (missionId) reload(missionId); else { setMission(null); setProcess(null); } }, [missionId]);

  /* ------ Submit for approval (creates BPM process) ------ */
  const submitForApproval = async () => {
    if (!mission || !user) return;
    try {
      const { data: pt } = await supabase.from("process_types").select("id").eq("name", "Missão de Serviço").maybeSingle();
      if (!pt) throw new Error("Tipo 'Missão de Serviço' não configurado");

      const { data: proc, error: pErr } = await supabase.from("processes").insert({
        type_id: pt.id, title: `Missão: ${mission.title}`,
        description: mission.purpose, requester_id: user.id, priority: "normal",
        due_date: mission.start_date, status: "aberto", code: "",
        linked_entity_type: "mission", linked_entity_id: mission.id, mission_id: mission.id,
      } as any).select().single();
      if (pErr) throw pErr;

      const { data: typeSteps } = await supabase.from("process_type_steps")
        .select("*").eq("process_type_id", pt.id).order("order_index");
      if (typeSteps?.length) {
        const rows = typeSteps.map((s: any, i: number) => ({
          process_id: proc.id, type_step_id: s.id, order_index: s.order_index, name: s.name,
          assignee_role: s.default_role,
          status: (i === 0 ? "em_curso" : "pendente") as "em_curso" | "pendente",
          started_at: i === 0 ? new Date().toISOString() : null,
          due_at: s.sla_days ? new Date(Date.now() + s.sla_days * 86400000).toISOString() : null,
        }));
        const { data: inserted } = await supabase.from("process_steps").insert(rows).select();
        const first = (inserted ?? []).sort((a: any, b: any) => a.order_index - b.order_index)[0];
        if (first) await supabase.from("processes").update({ current_step_id: first.id, status: "em_curso" }).eq("id", proc.id);
      }
      await supabase.from("process_events").insert({
        process_id: proc.id, actor_id: user.id, event_type: "aberto",
        payload: { title: mission.title, source: "mission" },
      });
      await supabase.from("missions").update({ status: "submetida" }).eq("id", mission.id);

      await supabase.from("activity_logs").insert({
        user_id: user.id, action: "mission_submitted",
        entity_type: "mission", entity_id: mission.id,
        details: { mission_title: mission.title, process_id: proc.id },
      });
      await supabase.from("notifications").insert({
        user_id: user.id, type: "info",
        title: "Missão submetida para aprovação",
        message: `A missão "${mission.title}" entrou no circuito BPM.`,
        link: `/admin/processos/${proc.id}`,
      });

      toast({ title: "Submetida para aprovação", description: "Processo BPM criado." });
      reload(mission.id);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  if (!missionId) return null;
  return (
    <Dialog open={!!missionId} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif">
            <Plane className="h-5 w-5" />
            {mission?.title || "Missão"}
            {mission && <Badge className={STATUS_TONE[mission.status]}>{STATUS_LABEL[mission.status]}</Badge>}
          </DialogTitle>
        </DialogHeader>

        {loading || !mission ? <div className="p-8 text-center text-muted-foreground">A carregar…</div> : (
          <Tabs defaultValue="resumo">
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="resumo">Resumo</TabsTrigger>
              <TabsTrigger value="participantes">Participantes</TabsTrigger>
              <TabsTrigger value="guia">Guia de Marcha</TabsTrigger>
              <TabsTrigger value="contas">Prestação de Contas</TabsTrigger>
              <TabsTrigger value="bpm">BPM</TabsTrigger>
            </TabsList>

            {/* RESUMO */}
            <TabsContent value="resumo" className="space-y-3 pt-3">
              <Field label="Destino" value={mission.destination} />
              <Field label="Objectivo" value={mission.purpose || "—"} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Início" value={mission.start_date} />
                <Field label="Fim" value={mission.end_date} />
                <Field label="Orçamento" value={`${Number(mission.budget).toLocaleString("pt-PT")} ${mission.currency}`} />
                <Field label="Estado" value={STATUS_LABEL[mission.status]} />
              </div>
              {mission.notes && <Field label="Notas" value={mission.notes} />}

              <div className="flex gap-2 pt-3 border-t">
                {mission.status === "planeada" && !process && canEdit && (
                  <Button onClick={submitForApproval}><Send className="h-4 w-4 mr-1" /> Submeter para aprovação</Button>
                )}
                {process && (
                  <Button asChild variant="outline">
                    <Link to={`/admin/processos/${process.id}`}><Workflow className="h-4 w-4 mr-1" /> Ver processo BPM <ExternalLink className="h-3 w-3 ml-1" /></Link>
                  </Button>
                )}
              </div>
            </TabsContent>

            {/* PARTICIPANTES */}
            <TabsContent value="participantes" className="pt-3">
              <ParticipantsTab
                missionId={mission.id} participants={participants} profiles={profiles}
                canEdit={canEdit} currency={mission.currency} onChange={() => reload(mission.id)}
              />
            </TabsContent>

            {/* GUIA */}
            <TabsContent value="guia" className="pt-3">
              <GuideTab
                mission={mission} guide={guide} participants={participants}
                canEdit={canEdit} onChange={() => reload(mission.id)}
              />
            </TabsContent>

            {/* CONTAS */}
            <TabsContent value="contas" className="pt-3">
              <AccountabilityTab
                mission={mission} expenses={expenses} report={report}
                canEdit={canEdit} onChange={() => reload(mission.id)}
              />
            </TabsContent>

            {/* BPM */}
            <TabsContent value="bpm" className="pt-3">
              {!process ? (
                <p className="text-sm text-muted-foreground">Esta missão ainda não foi submetida ao circuito BPM.</p>
              ) : (
                <div className="space-y-2">
                  <Field label="Código do Processo" value={process.code} />
                  <Field label="Estado" value={process.status} />
                  <Field label="Prioridade" value={process.priority} />
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/admin/processos/${process.id}`}><Workflow className="h-4 w-4 mr-1" /> Abrir processo completo</Link>
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <p className="text-sm">{value}</p>
    </div>
  );
}

/* ---------------- Participants tab ---------------- */
function ParticipantsTab({ missionId, participants, profiles, canEdit, currency, onChange }: {
  missionId: string; participants: Participant[];
  profiles: { user_id: string; full_name: string }[];
  canEdit: boolean; currency: string; onChange: () => void;
}) {
  const { toast } = useToast();
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState("");
  const [perDiem, setPerDiem] = useState(0);

  const add = async () => {
    if (!userId) return toast({ title: "Seleccione utilizador", variant: "destructive" });
    const { error } = await supabase.from("mission_participants").insert({
      mission_id: missionId, user_id: userId, role: role || "Participante", per_diem: perDiem,
    });
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    setUserId(""); setRole(""); setPerDiem(0); onChange();
  };
  const remove = async (id: string) => {
    await supabase.from("mission_participants").delete().eq("id", id);
    onChange();
  };

  return (
    <div className="space-y-3">
      {canEdit && (
        <div className="grid grid-cols-12 gap-2 items-end p-3 rounded-md border bg-muted/30">
          <div className="col-span-5">
            <Label>Utilizador</Label>
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>{profiles.map((p) => <SelectItem key={p.user_id} value={p.user_id}>{p.full_name || p.user_id}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="col-span-4"><Label>Função</Label><Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Responsável, Apoio…" /></div>
          <div className="col-span-2"><Label>Per Diem</Label><Input type="number" value={perDiem} onChange={(e) => setPerDiem(Number(e.target.value))} /></div>
          <div className="col-span-1"><Button onClick={add} size="icon"><Plus className="h-4 w-4" /></Button></div>
        </div>
      )}

      <Table>
        <TableHeader><TableRow>
          <TableHead>Nome</TableHead><TableHead>Função</TableHead><TableHead>Per Diem</TableHead>
          {canEdit && <TableHead className="w-10" />}
        </TableRow></TableHeader>
        <TableBody>
          {participants.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-4">Sem participantes.</TableCell></TableRow>}
          {participants.map((p) => (
            <TableRow key={p.id}>
              <TableCell>{p.full_name}</TableCell>
              <TableCell>{p.role}</TableCell>
              <TableCell>{Number(p.per_diem).toLocaleString("pt-PT")} {currency}</TableCell>
              {canEdit && <TableCell><Button size="icon" variant="ghost" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/* ---------------- Guide tab ---------------- */
function GuideTab({ mission, guide, participants, canEdit, onChange }: {
  mission: Mission; guide: Guide | null; participants: Participant[];
  canEdit: boolean; onChange: () => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState<Partial<Guide>>({});
  useEffect(() => {
    setForm(guide ?? {
      guide_number: `GM-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
      issue_date: new Date().toISOString().slice(0, 10),
      per_diem: 0, transport: "", notes: "",
    });
  }, [guide]);

  const locked = mission.status !== "aprovada" && mission.status !== "em_curso" && mission.status !== "concluida";

  const save = async () => {
    if (!form.guide_number) return toast({ title: "Nº da guia obrigatório", variant: "destructive" });
    const payload: any = {
      mission_id: mission.id, guide_number: form.guide_number,
      issue_date: form.issue_date, per_diem: Number(form.per_diem) || 0,
      transport: form.transport || null, notes: form.notes || null,
      issued_by: user?.id || null,
    };
    const { error } = guide
      ? await supabase.from("mission_guides").update(payload).eq("id", guide.id)
      : await supabase.from("mission_guides").insert(payload);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    toast({ title: "Guia guardada" });
    onChange();
  };

  const downloadPdf = async () => {
    if (!form.guide_number) return toast({ title: "Guarde a guia primeiro", variant: "destructive" });
    await generateMissionGuidePdf({
      mission: {
        title: mission.title, destination: mission.destination, purpose: mission.purpose,
        start_date: mission.start_date, end_date: mission.end_date,
        budget: mission.budget, currency: mission.currency,
      },
      guide: {
        guide_number: form.guide_number || "",
        issue_date: form.issue_date || new Date().toISOString().slice(0, 10),
        per_diem: Number(form.per_diem) || 0,
        transport: form.transport || null, notes: form.notes || null,
      },
      participants: participants.map((p) => ({ full_name: p.full_name || "—", role: p.role, per_diem: Number(p.per_diem) || 0 })),
    });
  };

  if (locked) {
    return (
      <div className="p-4 rounded-md border bg-amber-500/10 text-amber-700 dark:text-amber-300 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4" /> A Guia de Marcha só pode ser emitida após aprovação da missão.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Nº da Guia *</Label><Input value={form.guide_number || ""} onChange={(e) => setForm({ ...form, guide_number: e.target.value })} disabled={!canEdit} /></div>
        <div><Label>Data de Emissão</Label><Input type="date" value={form.issue_date || ""} onChange={(e) => setForm({ ...form, issue_date: e.target.value })} disabled={!canEdit} /></div>
        <div><Label>Per Diem base</Label><Input type="number" value={form.per_diem ?? 0} onChange={(e) => setForm({ ...form, per_diem: Number(e.target.value) })} disabled={!canEdit} /></div>
        <div><Label>Transporte</Label><Input value={form.transport || ""} onChange={(e) => setForm({ ...form, transport: e.target.value })} disabled={!canEdit} placeholder="Viatura IIV-1234" /></div>
      </div>
      <div><Label>Notas</Label><Textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} disabled={!canEdit} /></div>

      <div className="flex gap-2">
        {canEdit && <Button onClick={save}><FileText className="h-4 w-4 mr-1" /> Guardar Guia</Button>}
        <Button variant="outline" onClick={downloadPdf}><Download className="h-4 w-4 mr-1" /> Gerar PDF</Button>
      </div>
    </div>
  );
}

/* ---------------- Accountability tab ---------------- */
function AccountabilityTab({ mission, expenses, report, canEdit, onChange }: {
  mission: Mission; expenses: Expense[]; report: Report | null; canEdit: boolean; onChange: () => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();

  const total = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const budget = Number(mission.budget || 0);
  const pct = budget > 0 ? Math.min(100, Math.round((total / budget) * 100)) : 0;
  const overspent = total > budget && budget > 0;

  /* Expense form */
  const [exp, setExp] = useState<Partial<Expense>>({
    category: "transporte", description: "", amount: 0,
    expense_date: new Date().toISOString().slice(0, 10), currency: mission.currency,
  });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const addExpense = async () => {
    if (!exp.amount || Number(exp.amount) <= 0) return toast({ title: "Valor inválido", variant: "destructive" });
    let receipt_url: string | null = null;
    if (receiptFile && user) {
      const path = `missions/${mission.id}/receipts/${Date.now()}-${receiptFile.name}`;
      const { error: upErr } = await supabase.storage.from("documents").upload(path, receiptFile, { upsert: false });
      if (upErr) return toast({ title: "Erro no recibo", description: upErr.message, variant: "destructive" });
      receipt_url = path;
    }
    const { error } = await supabase.from("mission_expenses").insert({
      mission_id: mission.id,
      category: exp.category as ExpenseCat,
      description: exp.description || null,
      amount: Number(exp.amount),
      currency: exp.currency || mission.currency,
      expense_date: exp.expense_date,
      receipt_url, recorded_by: user?.id || null,
    });
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    toast({ title: "Despesa registada" });
    setExp({ category: "transporte", description: "", amount: 0, expense_date: new Date().toISOString().slice(0, 10), currency: mission.currency });
    setReceiptFile(null); onChange();
  };

  const removeExpense = async (id: string) => {
    await supabase.from("mission_expenses").delete().eq("id", id);
    onChange();
  };

  const viewReceipt = async (path: string) => {
    const { data } = await supabase.storage.from("documents").createSignedUrl(path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  /* Report form */
  const [repForm, setRepForm] = useState<Partial<Report>>({});
  const [reportFile, setReportFile] = useState<File | null>(null);
  useEffect(() => {
    setRepForm(report ?? {
      report_date: new Date().toISOString().slice(0, 10),
      summary: "", outcomes: "", status: "rascunho",
    });
  }, [report]);

  const saveReport = async (submitting: boolean) => {
    let report_url = repForm.report_url || null;
    if (reportFile && user) {
      const path = `missions/${mission.id}/reports/${Date.now()}-${reportFile.name}`;
      const { error: upErr } = await supabase.storage.from("documents").upload(path, reportFile, { upsert: true });
      if (upErr) return toast({ title: "Erro no anexo", description: upErr.message, variant: "destructive" });
      report_url = path;
    }
    const payload: any = {
      mission_id: mission.id,
      report_date: repForm.report_date || new Date().toISOString().slice(0, 10),
      summary: repForm.summary || null,
      outcomes: repForm.outcomes || null,
      status: submitting ? "submetido" : (repForm.status || "rascunho"),
      submitted_by: user?.id || null,
      report_url,
    };
    const { error } = report
      ? await supabase.from("mission_reports").update(payload).eq("id", report.id)
      : await supabase.from("mission_reports").insert(payload);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    toast({ title: submitting ? "Relatório submetido" : "Relatório guardado" });
    setReportFile(null); onChange();
  };

  const openReport = async () => {
    if (!report?.report_url) return;
    const { data } = await supabase.storage.from("documents").createSignedUrl(report.report_url, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-md border bg-muted/30">
          <p className="text-xs text-muted-foreground">Orçamento</p>
          <p className="text-lg font-semibold">{budget.toLocaleString("pt-PT")} {mission.currency}</p>
        </div>
        <div className="p-3 rounded-md border bg-muted/30">
          <p className="text-xs text-muted-foreground">Total gasto</p>
          <p className={`text-lg font-semibold ${overspent ? "text-destructive" : ""}`}>{total.toLocaleString("pt-PT")} {mission.currency}</p>
        </div>
        <div className="p-3 rounded-md border bg-muted/30">
          <p className="text-xs text-muted-foreground">Saldo</p>
          <p className={`text-lg font-semibold ${overspent ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"}`}>
            {(budget - total).toLocaleString("pt-PT")} {mission.currency}
          </p>
        </div>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span>Execução orçamental</span>
          <span className={overspent ? "text-destructive font-semibold" : ""}>{pct}%{overspent && " (excedido)"}</span>
        </div>
        <Progress value={pct} className={overspent ? "[&>div]:bg-destructive" : ""} />
      </div>

      {/* Despesas */}
      <div>
        <h4 className="font-semibold mb-2">Despesas</h4>
        {canEdit && (
          <div className="grid grid-cols-12 gap-2 items-end p-3 rounded-md border bg-muted/30 mb-3">
            <div className="col-span-3"><Label>Categoria</Label>
              <Select value={exp.category} onValueChange={(v) => setExp({ ...exp, category: v as ExpenseCat })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{(Object.keys(EXPENSE_LABEL) as ExpenseCat[]).map((k) => <SelectItem key={k} value={k}>{EXPENSE_LABEL[k]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-4"><Label>Descrição</Label><Input value={exp.description || ""} onChange={(e) => setExp({ ...exp, description: e.target.value })} /></div>
            <div className="col-span-2"><Label>Valor</Label><Input type="number" step="0.01" value={exp.amount ?? 0} onChange={(e) => setExp({ ...exp, amount: Number(e.target.value) })} /></div>
            <div className="col-span-2"><Label>Data</Label><Input type="date" value={exp.expense_date || ""} onChange={(e) => setExp({ ...exp, expense_date: e.target.value })} /></div>
            <div className="col-span-1"><Button onClick={addExpense} size="icon"><Plus className="h-4 w-4" /></Button></div>
            <div className="col-span-12">
              <Label className="text-xs">Recibo (opcional)</Label>
              <Input type="file" accept="image/*,application/pdf" onChange={(e) => setReceiptFile(e.target.files?.[0] || null)} />
            </div>
          </div>
        )}

        <Table>
          <TableHeader><TableRow>
            <TableHead>Data</TableHead><TableHead>Categoria</TableHead><TableHead>Descrição</TableHead>
            <TableHead>Valor</TableHead><TableHead>Recibo</TableHead>{canEdit && <TableHead className="w-10" />}
          </TableRow></TableHeader>
          <TableBody>
            {expenses.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-4">Sem despesas registadas.</TableCell></TableRow>}
            {expenses.map((e) => (
              <TableRow key={e.id}>
                <TableCell>{e.expense_date}</TableCell>
                <TableCell><Badge variant="outline">{EXPENSE_LABEL[e.category]}</Badge></TableCell>
                <TableCell>{e.description || "—"}</TableCell>
                <TableCell>{Number(e.amount).toLocaleString("pt-PT")} {e.currency}</TableCell>
                <TableCell>{e.receipt_url ? <Button size="sm" variant="ghost" onClick={() => viewReceipt(e.receipt_url!)}><Eye className="h-3.5 w-3.5" /></Button> : "—"}</TableCell>
                {canEdit && <TableCell><Button size="icon" variant="ghost" onClick={() => removeExpense(e.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Relatório final */}
      <div>
        <h4 className="font-semibold mb-2">Relatório Final</h4>
        {report?.status === "aprovado" && (
          <div className="mb-2 p-2 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-sm">
            ✓ Relatório aprovado em {report.approved_at ? new Date(report.approved_at).toLocaleDateString("pt-AO") : "—"}.
          </div>
        )}
        {report?.status === "submetido" && (
          <div className="mb-2 p-2 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-300 text-sm">
            Submetido — a aguardar aprovação da Direcção.
          </div>
        )}
        <div className="space-y-3">
          <div><Label>Resumo</Label><Textarea rows={3} value={repForm.summary || ""} onChange={(e) => setRepForm({ ...repForm, summary: e.target.value })} disabled={!canEdit || report?.status === "aprovado"} /></div>
          <div><Label>Resultados / Outcomes</Label><Textarea rows={3} value={repForm.outcomes || ""} onChange={(e) => setRepForm({ ...repForm, outcomes: e.target.value })} disabled={!canEdit || report?.status === "aprovado"} /></div>
          {canEdit && report?.status !== "aprovado" && (
            <div>
              <Label className="text-xs">Anexar relatório (PDF/DOC)</Label>
              <Input type="file" accept="application/pdf,.doc,.docx" onChange={(e) => setReportFile(e.target.files?.[0] || null)} />
            </div>
          )}
          <div className="flex gap-2">
            {report?.report_url && <Button variant="outline" size="sm" onClick={openReport}><Eye className="h-4 w-4 mr-1" /> Ver anexo actual</Button>}
            {canEdit && report?.status !== "aprovado" && <>
              <Button variant="outline" onClick={() => saveReport(false)}><Upload className="h-4 w-4 mr-1" /> Guardar rascunho</Button>
              <Button onClick={() => saveReport(true)}><Send className="h-4 w-4 mr-1" /> Submeter relatório</Button>
            </>}
          </div>
        </div>
      </div>
    </div>
  );
}
