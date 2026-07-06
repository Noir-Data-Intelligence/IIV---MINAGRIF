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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, Package, Wrench, Pencil, Trash2, Boxes, AlertTriangle, CircleDollarSign } from "lucide-react";
import { useClientPagination } from "@/hooks/useClientPagination";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/admin/TablePagination";

type AssetStatus = "activo" | "em_manutencao" | "avariado" | "abatido" | "reservado";
type MaintType = "preventiva" | "correctiva" | "inspeccao" | "calibracao";

interface Asset {
  id: string; code: string; name: string; category: string; description: string | null;
  location: string | null; station_id: string | null; department_id: string | null;
  responsible_user_id: string | null; acquisition_date: string | null;
  acquisition_cost: number; current_value: number | null; serial_number: string | null;
  status: AssetStatus; notes: string | null;
}
interface Maintenance {
  id: string; asset_id: string; maintenance_date: string; type: MaintType;
  description: string; cost: number; provider: string | null; next_due_date: string | null; notes: string | null;
}
interface Station { id: string; name: string }
interface Dept { id: string; name: string }

const STATUS: { value: AssetStatus; label: string }[] = [
  { value: "activo", label: "Activo" },
  { value: "em_manutencao", label: "Em manutenção" },
  { value: "avariado", label: "Avariado" },
  { value: "abatido", label: "Abatido" },
  { value: "reservado", label: "Reservado" },
];

const MAINT: { value: MaintType; label: string }[] = [
  { value: "preventiva", label: "Preventiva" },
  { value: "correctiva", label: "Correctiva" },
  { value: "inspeccao", label: "Inspecção" },
  { value: "calibracao", label: "Calibração" },
];

export default function Patrimonio() {
  const { user } = useAuth();
  const { canWrite } = useUserRole();
  const { toast } = useToast();
  const canEdit = canWrite("patrimonio");

  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [maints, setMaints] = useState<Maintenance[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [depts, setDepts] = useState<Dept[]>([]);

  const [assetOpen, setAssetOpen] = useState(false);
  const [assetEdit, setAssetEdit] = useState<Asset | null>(null);
  const [maintOpen, setMaintOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<{ table: string; id: string } | null>(null);

  const maintsPag = usePagination(20);

  const loadAll = async () => {
    setLoading(true);
    const [a, s, d] = await Promise.all([
      supabase.from("assets").select("*").order("code"),
      supabase.from("stations").select("id,name").order("name"),
      supabase.from("departments").select("id,name").order("name"),
    ]);
    if (a.data) setAssets(a.data as Asset[]);
    if (s.data) setStations(s.data as Station[]);
    if (d.data) setDepts(d.data as Dept[]);
    setLoading(false);
  };

  const loadMaints = async () => {
    const { data, count } = await supabase
      .from("asset_maintenance")
      .select("*", { count: "exact" })
      .order("maintenance_date", { ascending: false })
      .range(maintsPag.from, maintsPag.to);
    setMaints((data as Maintenance[]) ?? []);
    maintsPag.setTotal(count ?? 0);
  };

  useEffect(() => { loadAll(); }, []);
  useEffect(() => { loadMaints(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [maintsPag.page, maintsPag.pageSize]);

  const kpis = useMemo(() => {
    const total = assets.length;
    const active = assets.filter((a) => a.status === "activo").length;
    const value = assets.reduce((s, a) => s + Number(a.current_value ?? a.acquisition_cost ?? 0), 0);
    const today = new Date().toISOString().slice(0, 10);
    const dueSoon = maints.filter((m) => m.next_due_date && m.next_due_date >= today).length;
    return { total, active, value, dueSoon };
  }, [assets, maints]);

  const assetsPag = useClientPagination(assets, 20);

  const fmt = (n: number) => new Intl.NumberFormat("pt-AO", { style: "currency", currency: "AOA", maximumFractionDigits: 0 }).format(n);
  const stationName = (id: string | null) => id ? (stations.find((s) => s.id === id)?.name ?? "—") : "—";
  const assetLabel = (id: string) => { const a = assets.find((x) => x.id === id); return a ? `${a.code} — ${a.name}` : "—"; };

  const saveAsset = async (form: Partial<Asset>) => {
    if (!form.code || !form.name || !form.category) return toast({ title: "Código, nome e categoria obrigatórios", variant: "destructive" });
    const payload: any = {
      code: form.code, name: form.name, category: form.category, description: form.description || null,
      location: form.location || null, station_id: form.station_id || null, department_id: form.department_id || null,
      responsible_user_id: form.responsible_user_id || null,
      acquisition_date: form.acquisition_date || null,
      acquisition_cost: Number(form.acquisition_cost) || 0,
      current_value: form.current_value != null ? Number(form.current_value) : null,
      serial_number: form.serial_number || null, status: form.status || "activo", notes: form.notes || null,
    };
    if (!assetEdit) payload.created_by = user?.id;
    const { error } = assetEdit
      ? await supabase.from("assets").update(payload).eq("id", assetEdit.id)
      : await supabase.from("assets").insert(payload);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    toast({ title: assetEdit ? "Activo actualizado" : "Activo criado" });
    setAssetOpen(false); setAssetEdit(null); loadAll();
  };

  const saveMaint = async (form: Partial<Maintenance>) => {
    if (!form.asset_id || !form.description) return toast({ title: "Activo e descrição obrigatórios", variant: "destructive" });
    const payload = {
      asset_id: form.asset_id,
      maintenance_date: form.maintenance_date || new Date().toISOString().slice(0, 10),
      type: form.type || "preventiva",
      description: form.description, cost: Number(form.cost) || 0,
      provider: form.provider || null, performed_by: user?.id || null,
      next_due_date: form.next_due_date || null, notes: form.notes || null,
    };
    const { error } = await supabase.from("asset_maintenance").insert(payload);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    toast({ title: "Manutenção registada" });
    setMaintOpen(false); loadMaints();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from(deleteId.table as any).delete().eq("id", deleteId.id);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else toast({ title: "Registo apagado" });
    setDeleteId(null); loadAll(); loadMaints();
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader icon={Package} title="Património" description="Inventário de bens, ativos e manutenções." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AdminCard variant="gradient-green-gold" icon={Boxes} title="Total de activos" metric={kpis.total} stagger={1} />
        <AdminCard variant="glass" icon={Package} title="Em uso" metric={kpis.active} stagger={2} />
        <AdminCard variant="glass" icon={CircleDollarSign} title="Valor patrimonial" metric={fmt(kpis.value)} stagger={3} />
        <AdminCard variant="glass" icon={AlertTriangle} title="Manutenções agendadas" metric={kpis.dueSoon} stagger={4} />
      </div>

      <Tabs defaultValue="activos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="activos"><Boxes className="h-4 w-4 mr-1" /> Activos</TabsTrigger>
          <TabsTrigger value="manutencoes"><Wrench className="h-4 w-4 mr-1" /> Manutenções</TabsTrigger>
        </TabsList>

        <TabsContent value="activos">
          <AdminCard title="Inventário" loading={loading} isEmpty={!loading && assets.length === 0} emptyMessage="Sem activos registados.">
            <div className="flex justify-end mb-3">
              {canEdit && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setMaintOpen(true)} disabled={assets.length === 0}><Wrench className="h-4 w-4 mr-1" /> Manutenção</Button>
                  <Button size="sm" onClick={() => { setAssetEdit(null); setAssetOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Novo Activo</Button>
                </div>
              )}
            </div>
            <Table>
              <TableHeader><TableRow>
                <TableHead>Código</TableHead><TableHead>Nome</TableHead><TableHead>Categoria</TableHead>
                <TableHead>Estação</TableHead><TableHead>Aquisição</TableHead><TableHead>Valor</TableHead><TableHead>Estado</TableHead>
                {canEdit && <TableHead className="w-24">Acções</TableHead>}
              </TableRow></TableHeader>
              <TableBody>
                {assetsPag.pageItems.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.code}</TableCell>
                    <TableCell>{a.name}</TableCell>
                    <TableCell><Badge variant="outline">{a.category}</Badge></TableCell>
                    <TableCell>{stationName(a.station_id)}</TableCell>
                    <TableCell>{a.acquisition_date ?? "—"}</TableCell>
                    <TableCell>{fmt(Number(a.current_value ?? a.acquisition_cost))}</TableCell>
                    <TableCell><Badge variant={a.status === "activo" ? "default" : "outline"}>{STATUS.find((s) => s.value === a.status)?.label}</Badge></TableCell>
                    {canEdit && (
                      <TableCell>
                        <Button size="icon" variant="ghost" onClick={() => { setAssetEdit(a); setAssetOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => setDeleteId({ table: "assets", id: a.id })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination page={assetsPag.page} pageSize={assetsPag.pageSize} total={assetsPag.total} totalPages={assetsPag.totalPages} canPrev={assetsPag.canPrev} canNext={assetsPag.canNext} onPageChange={assetsPag.setPage} onPageSizeChange={assetsPag.setPageSize} />
          </AdminCard>
        </TabsContent>

        <TabsContent value="manutencoes">
          <AdminCard title="Histórico de manutenções" loading={loading} isEmpty={!loading && maintsPag.total === 0} emptyMessage="Sem manutenções registadas.">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Data</TableHead><TableHead>Activo</TableHead><TableHead>Tipo</TableHead>
                <TableHead>Descrição</TableHead><TableHead>Custo</TableHead><TableHead>Fornecedor</TableHead><TableHead>Próxima</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {maints.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>{m.maintenance_date}</TableCell>
                    <TableCell className="text-xs">{assetLabel(m.asset_id)}</TableCell>
                    <TableCell><Badge variant="outline">{MAINT.find((x) => x.value === m.type)?.label}</Badge></TableCell>
                    <TableCell className="max-w-[260px] truncate" title={m.description}>{m.description}</TableCell>
                    <TableCell>{fmt(Number(m.cost))}</TableCell>
                    <TableCell>{m.provider ?? "—"}</TableCell>
                    <TableCell>{m.next_due_date ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination page={maintsPag.page} pageSize={maintsPag.pageSize} total={maintsPag.total} totalPages={maintsPag.totalPages} canPrev={maintsPag.canPrev} canNext={maintsPag.canNext} onPageChange={maintsPag.setPage} onPageSizeChange={maintsPag.setPageSize} />
          </AdminCard>
        </TabsContent>
      </Tabs>

      <AssetDialog open={assetOpen} onOpenChange={(v) => { setAssetOpen(v); if (!v) setAssetEdit(null); }} asset={assetEdit} stations={stations} depts={depts} onSave={saveAsset} />
      <MaintDialog open={maintOpen} onOpenChange={setMaintOpen} assets={assets} onSave={saveMaint} />

      <DeleteConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}
        title="Apagar registo?" description="Esta acção é permanente." onConfirm={confirmDelete} />
    </div>
  );
}

function AssetDialog({ open, onOpenChange, asset, stations, depts, onSave }: {
  open: boolean; onOpenChange: (v: boolean) => void; asset: Asset | null;
  stations: Station[]; depts: Dept[]; onSave: (f: Partial<Asset>) => void;
}) {
  const [form, setForm] = useState<Partial<Asset>>({});
  useEffect(() => { setForm(asset ?? { status: "activo", acquisition_cost: 0 }); }, [asset, open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{asset ? "Editar Activo" : "Novo Activo"}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Código *</Label><Input value={form.code || ""} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="Ex.: PAT-0001" /></div>
          <div><Label>Categoria *</Label><Input value={form.category || ""} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Ex.: Equipamento, Viatura, Mobiliário" /></div>
          <div className="col-span-2"><Label>Nome *</Label><Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>Localização</Label><Input value={form.location || ""} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
          <div><Label>Nº de série</Label><Input value={form.serial_number || ""} onChange={(e) => setForm({ ...form, serial_number: e.target.value })} /></div>
          <div><Label>Estação</Label>
            <Select value={form.station_id ?? "none"} onValueChange={(v) => setForm({ ...form, station_id: v === "none" ? null : v })}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {stations.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Departamento</Label>
            <Select value={form.department_id ?? "none"} onValueChange={(v) => setForm({ ...form, department_id: v === "none" ? null : v })}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {depts.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Data de aquisição</Label><Input type="date" value={form.acquisition_date || ""} onChange={(e) => setForm({ ...form, acquisition_date: e.target.value })} /></div>
          <div><Label>Custo de aquisição</Label><Input type="number" step="0.01" value={form.acquisition_cost ?? 0} onChange={(e) => setForm({ ...form, acquisition_cost: Number(e.target.value) })} /></div>
          <div><Label>Valor actual</Label><Input type="number" step="0.01" value={form.current_value ?? ""} onChange={(e) => setForm({ ...form, current_value: e.target.value === "" ? null : Number(e.target.value) })} /></div>
          <div><Label>Estado</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as AssetStatus })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STATUS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="col-span-2"><Label>Descrição</Label><Textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="col-span-2"><Label>Notas</Label><Textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => onSave(form)}>Guardar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MaintDialog({ open, onOpenChange, assets, onSave }: { open: boolean; onOpenChange: (v: boolean) => void; assets: Asset[]; onSave: (f: Partial<Maintenance>) => void }) {
  const [form, setForm] = useState<Partial<Maintenance>>({ type: "preventiva", maintenance_date: new Date().toISOString().slice(0, 10), cost: 0 });
  useEffect(() => { if (open) setForm({ type: "preventiva", maintenance_date: new Date().toISOString().slice(0, 10), cost: 0 }); }, [open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Registar Manutenção</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Activo *</Label>
            <Select value={form.asset_id} onValueChange={(v) => setForm({ ...form, asset_id: v })}>
              <SelectTrigger><SelectValue placeholder="Escolher" /></SelectTrigger>
              <SelectContent>{assets.map((a) => <SelectItem key={a.id} value={a.id}>{a.code} — {a.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div><Label>Data</Label><Input type="date" value={form.maintenance_date || ""} onChange={(e) => setForm({ ...form, maintenance_date: e.target.value })} /></div>
            <div><Label>Tipo</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as MaintType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{MAINT.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Custo</Label><Input type="number" step="0.01" value={form.cost ?? 0} onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })} /></div>
          </div>
          <div><Label>Descrição *</Label><Input value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Fornecedor</Label><Input value={form.provider || ""} onChange={(e) => setForm({ ...form, provider: e.target.value })} /></div>
            <div><Label>Próxima manutenção</Label><Input type="date" value={form.next_due_date || ""} onChange={(e) => setForm({ ...form, next_due_date: e.target.value })} /></div>
          </div>
          <div><Label>Notas</Label><Textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => onSave(form)}>Registar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
