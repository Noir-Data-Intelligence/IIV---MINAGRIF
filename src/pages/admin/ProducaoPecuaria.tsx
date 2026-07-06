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
import { Plus, Beef, Pencil, Trash2, Milk, Egg } from "lucide-react";

interface Prod {
  id: string; station_id: string; product_type: string;
  production_date: string; quantity: number; unit: string;
  recorded_by: string | null; notes: string | null;
}
interface Station { id: string; name: string }

const PRODUCT_TYPES = ["Leite", "Ovos", "Carne", "Mel", "Outro"];

export default function ProducaoPecuaria() {
  const { user } = useAuth();
  const { canWrite } = useUserRole();
  const { toast } = useToast();
  const canEdit = canWrite("pecuaria");

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Prod[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Prod | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadAll = async () => {
    setLoading(true);
    const [p, s] = await Promise.all([
      supabase.from("livestock_production").select("*").order("production_date", { ascending: false }).limit(300),
      supabase.from("stations").select("id,name").order("name"),
    ]);
    if (p.data) setRows(p.data as Prod[]);
    if (s.data) setStations(s.data as Station[]);
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  const kpis = useMemo(() => {
    const now = new Date(); const monthAgo = new Date(now); monthAgo.setMonth(monthAgo.getMonth() - 1);
    const inMonth = rows.filter((r) => new Date(r.production_date) >= monthAgo);
    const milk = rows.filter((r) => r.product_type.toLowerCase().includes("leite")).reduce((s, r) => s + Number(r.quantity || 0), 0);
    const eggs = rows.filter((r) => r.product_type.toLowerCase().includes("ovo")).reduce((s, r) => s + Number(r.quantity || 0), 0);
    return { total: rows.length, monthCount: inMonth.length, milk, eggs };
  }, [rows]);

  const stationName = (id: string) => stations.find((s) => s.id === id)?.name ?? "—";

  const save = async (form: Partial<Prod>) => {
    if (!form.station_id || !form.product_type || !form.quantity) return toast({ title: "Preencha estação, tipo e quantidade", variant: "destructive" });
    const payload = {
      station_id: form.station_id, product_type: form.product_type,
      production_date: form.production_date || new Date().toISOString().slice(0, 10),
      quantity: Number(form.quantity) || 0, unit: form.unit || "kg",
      recorded_by: user?.id || null, notes: form.notes || null,
    };
    const { error } = edit
      ? await supabase.from("livestock_production").update(payload).eq("id", edit.id)
      : await supabase.from("livestock_production").insert(payload);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    toast({ title: edit ? "Registo actualizado" : "Registo criado" });
    setOpen(false); setEdit(null); loadAll();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("livestock_production").delete().eq("id", deleteId);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else toast({ title: "Registo apagado" });
    setDeleteId(null); loadAll();
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader icon={Beef} title="Produção Pecuária" description="Registo de leite, ovos, carne e outras produções por estação.">
        {canEdit && <Button size="sm" onClick={() => { setEdit(null); setOpen(true); }} disabled={stations.length === 0}>
          <Plus className="h-4 w-4 mr-1" /> Novo Registo
        </Button>}
      </AdminPageHeader>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AdminCard variant="gradient-green-gold" icon={Beef} title="Registos totais" metric={kpis.total} stagger={1} />
        <AdminCard variant="glass" icon={Beef} title="Último mês" metric={kpis.monthCount} stagger={2} />
        <AdminCard variant="glass" icon={Milk} title="Leite total" metric={`${kpis.milk}`} stagger={3} />
        <AdminCard variant="glass" icon={Egg} title="Ovos totais" metric={`${kpis.eggs}`} stagger={4} />
      </div>

      <AdminCard title="Produção registada" loading={loading} isEmpty={!loading && rows.length === 0} emptyMessage="Sem produção registada.">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Data</TableHead><TableHead>Estação</TableHead><TableHead>Produto</TableHead>
            <TableHead>Quantidade</TableHead><TableHead>Notas</TableHead>
            {canEdit && <TableHead className="w-24">Acções</TableHead>}
          </TableRow></TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.production_date}</TableCell>
                <TableCell>{stationName(r.station_id)}</TableCell>
                <TableCell><Badge variant="outline">{r.product_type}</Badge></TableCell>
                <TableCell>{r.quantity} {r.unit}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{r.notes ?? "—"}</TableCell>
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

      <ProdDialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEdit(null); }} row={edit} stations={stations} onSave={save} />
      <DeleteConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}
        title="Apagar registo?" description="Esta acção é permanente." onConfirm={confirmDelete} />
    </div>
  );
}

function ProdDialog({ open, onOpenChange, row, stations, onSave }: {
  open: boolean; onOpenChange: (v: boolean) => void; row: Prod | null; stations: Station[]; onSave: (f: Partial<Prod>) => void;
}) {
  const [form, setForm] = useState<Partial<Prod>>({});
  useEffect(() => {
    setForm(row ?? { production_date: new Date().toISOString().slice(0, 10), unit: "kg", product_type: "Leite" });
  }, [row, open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{row ? "Editar Registo" : "Novo Registo de Produção"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Estação *</Label>
            <Select value={form.station_id} onValueChange={(v) => setForm({ ...form, station_id: v })}>
              <SelectTrigger><SelectValue placeholder="Escolher" /></SelectTrigger>
              <SelectContent>{stations.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Tipo de produto *</Label>
              <Select value={form.product_type} onValueChange={(v) => setForm({ ...form, product_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PRODUCT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Data</Label><Input type="date" value={form.production_date || ""} onChange={(e) => setForm({ ...form, production_date: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Quantidade *</Label><Input type="number" step="0.01" value={form.quantity ?? ""} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} /></div>
            <div><Label>Unidade</Label><Input value={form.unit || ""} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></div>
          </div>
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
