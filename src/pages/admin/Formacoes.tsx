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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, GraduationCap, Pencil, Trash2, Clock, CheckCircle2 } from "lucide-react";

type TStatus = "planeada" | "em_curso" | "concluida" | "cancelada";
interface Training {
  id: string; title: string; description: string | null; trainer: string | null;
  location: string | null; start_date: string; end_date: string;
  hours: number; status: TStatus; notes: string | null; created_by: string | null;
}

const STATUS_LABEL: Record<TStatus, string> = {
  planeada: "Planeada", em_curso: "Em curso", concluida: "Concluída", cancelada: "Cancelada",
};
const STATUS_TONE: Record<TStatus, string> = {
  planeada: "bg-muted text-muted-foreground",
  em_curso: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  concluida: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  cancelada: "bg-destructive/15 text-destructive",
};

export default function Formacoes() {
  const { user } = useAuth();
  const { canWrite } = useUserRole();
  const { toast } = useToast();
  const canEdit = canWrite("formacoes");

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Training[]>([]);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Training | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("trainings").select("*").order("start_date", { ascending: false }).limit(300);
    if (data) setRows(data as Training[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const kpis = useMemo(() => ({
    total: rows.length,
    inProgress: rows.filter((r) => r.status === "em_curso").length,
    completed: rows.filter((r) => r.status === "concluida").length,
    totalHours: rows.reduce((s, r) => s + Number(r.hours || 0), 0),
  }), [rows]);

  const save = async (f: Partial<Training>) => {
    if (!f.title || !f.start_date || !f.end_date) return toast({ title: "Preencha título e datas", variant: "destructive" });
    const payload: any = {
      title: f.title, description: f.description || null, trainer: f.trainer || null,
      location: f.location || null, start_date: f.start_date, end_date: f.end_date,
      hours: Number(f.hours) || 0, status: (f.status || "planeada") as TStatus,
      notes: f.notes || null,
      ...(edit ? {} : { created_by: user?.id || null }),
    };
    const { error } = edit
      ? await supabase.from("trainings").update(payload).eq("id", edit.id)
      : await supabase.from("trainings").insert(payload);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    toast({ title: edit ? "Formação actualizada" : "Formação criada" });
    setOpen(false); setEdit(null); load();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("trainings").delete().eq("id", deleteId);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else toast({ title: "Formação apagada" });
    setDeleteId(null); load();
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader icon={GraduationCap} title="Formações" description="Catálogo de formações, capacitações e workshops.">
        {canEdit && <Button size="sm" onClick={() => { setEdit(null); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Nova Formação
        </Button>}
      </AdminPageHeader>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AdminCard variant="gradient-green-gold" icon={GraduationCap} title="Total" metric={kpis.total} stagger={1} />
        <AdminCard variant="glass" icon={Clock} title="Em curso" metric={kpis.inProgress} stagger={2} />
        <AdminCard variant="glass" icon={CheckCircle2} title="Concluídas" metric={kpis.completed} stagger={3} />
        <AdminCard variant="glass" icon={Clock} title="Horas totais" metric={`${kpis.totalHours}h`} stagger={4} />
      </div>

      <AdminCard title="Formações" loading={loading} isEmpty={!loading && rows.length === 0} emptyMessage="Sem formações registadas.">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Título</TableHead><TableHead>Formador</TableHead><TableHead>Local</TableHead>
            <TableHead>Início</TableHead><TableHead>Fim</TableHead><TableHead>Horas</TableHead><TableHead>Estado</TableHead>
            {canEdit && <TableHead className="w-24">Acções</TableHead>}
          </TableRow></TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.title}</TableCell>
                <TableCell>{r.trainer ?? "—"}</TableCell>
                <TableCell>{r.location ?? "—"}</TableCell>
                <TableCell>{r.start_date}</TableCell>
                <TableCell>{r.end_date}</TableCell>
                <TableCell>{r.hours}h</TableCell>
                <TableCell><Badge className={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge></TableCell>
                {canEdit && (
                  <TableCell>
                    <Button size="icon" variant="ghost" onClick={() => { setEdit(r); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => setDeleteId(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminCard>

      <TrainingDialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEdit(null); }} row={edit} onSave={save} />
      <DeleteConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}
        title="Apagar formação?" description="Esta acção é permanente." onConfirm={confirmDelete} />
    </div>
  );
}

function TrainingDialog({ open, onOpenChange, row, onSave }: {
  open: boolean; onOpenChange: (v: boolean) => void; row: Training | null; onSave: (f: Partial<Training>) => void;
}) {
  const [form, setForm] = useState<Partial<Training>>({});
  useEffect(() => {
    setForm(row ?? {
      status: "planeada", hours: 0,
      start_date: new Date().toISOString().slice(0, 10),
      end_date: new Date().toISOString().slice(0, 10),
    });
  }, [row, open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{row ? "Editar Formação" : "Nova Formação"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Título *</Label><Input value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Formador</Label><Input value={form.trainer || ""} onChange={(e) => setForm({ ...form, trainer: e.target.value })} /></div>
            <div><Label>Local</Label><Input value={form.location || ""} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
            <div><Label>Início *</Label><Input type="date" value={form.start_date || ""} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
            <div><Label>Fim *</Label><Input type="date" value={form.end_date || ""} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
            <div><Label>Horas</Label><Input type="number" step="0.5" value={form.hours ?? 0} onChange={(e) => setForm({ ...form, hours: Number(e.target.value) })} /></div>
            <div><Label>Estado</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as TStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{(Object.keys(STATUS_LABEL) as TStatus[]).map((k) => <SelectItem key={k} value={k}>{STATUS_LABEL[k]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Descrição</Label><Textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
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
