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
import { Plus, Sprout, Pencil, Trash2, Wheat, MapPin, Tractor } from "lucide-react";

type FieldStatus = "planeado" | "plantado" | "em_crescimento" | "colhido" | "abandonado";

interface Crop { id: string; name: string; scientific_name: string | null; cycle_days: number | null; notes: string | null }
interface Field {
  id: string; station_id: string; crop_id: string; field_code: string | null;
  area_ha: number; planting_date: string | null; expected_harvest: string | null;
  status: FieldStatus; notes: string | null;
}
interface Harvest {
  id: string; field_id: string; harvest_date: string; quantity: number; unit: string;
  quality_grade: string | null; notes: string | null;
}
interface Station { id: string; name: string }

const STATUS: { value: FieldStatus; label: string }[] = [
  { value: "planeado", label: "Planeado" },
  { value: "plantado", label: "Plantado" },
  { value: "em_crescimento", label: "Em crescimento" },
  { value: "colhido", label: "Colhido" },
  { value: "abandonado", label: "Abandonado" },
];

export default function Agricultura() {
  const { user } = useAuth();
  const { canWrite } = useUserRole();
  const { toast } = useToast();
  const canEdit = canWrite("agricultura");

  const [loading, setLoading] = useState(true);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [stations, setStations] = useState<Station[]>([]);

  const [cropOpen, setCropOpen] = useState(false);
  const [cropEdit, setCropEdit] = useState<Crop | null>(null);
  const [fieldOpen, setFieldOpen] = useState(false);
  const [fieldEdit, setFieldEdit] = useState<Field | null>(null);
  const [harvestOpen, setHarvestOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<{ table: string; id: string } | null>(null);

  const loadAll = async () => {
    setLoading(true);
    const [c, f, h, s] = await Promise.all([
      supabase.from("crops").select("*").order("name"),
      supabase.from("crop_fields").select("*").order("planting_date", { ascending: false }),
      supabase.from("harvests").select("*").order("harvest_date", { ascending: false }).limit(200),
      supabase.from("stations").select("id,name").order("name"),
    ]);
    if (c.data) setCrops(c.data as Crop[]);
    if (f.data) setFields(f.data as Field[]);
    if (h.data) setHarvests(h.data as Harvest[]);
    if (s.data) setStations(s.data as Station[]);
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  const kpis = useMemo(() => {
    const totalArea = fields.reduce((sum, f) => sum + (Number(f.area_ha) || 0), 0);
    const active = fields.filter((f) => f.status === "plantado" || f.status === "em_crescimento").length;
    const totalHarvest = harvests.reduce((sum, h) => sum + (Number(h.quantity) || 0), 0);
    const productivity = totalArea > 0 ? Math.round(totalHarvest / totalArea) : 0;
    return { totalArea, active, totalHarvest, productivity };
  }, [fields, harvests]);

  const cropName = (id: string) => crops.find((c) => c.id === id)?.name ?? "—";
  const stationName = (id: string) => stations.find((s) => s.id === id)?.name ?? "—";
  const fieldLabel = (id: string) => {
    const f = fields.find((x) => x.id === id);
    if (!f) return "—";
    return `${f.field_code || ""} ${cropName(f.crop_id)} (${stationName(f.station_id)})`.trim();
  };

  // Save handlers
  const saveCrop = async (form: Partial<Crop>) => {
    if (!form.name) return toast({ title: "Nome obrigatório", variant: "destructive" });
    const payload = { name: form.name, scientific_name: form.scientific_name || null, cycle_days: form.cycle_days ?? null, notes: form.notes || null };
    const { error } = cropEdit
      ? await supabase.from("crops").update(payload).eq("id", cropEdit.id)
      : await supabase.from("crops").insert(payload);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    toast({ title: cropEdit ? "Cultura actualizada" : "Cultura criada" });
    setCropOpen(false); setCropEdit(null); loadAll();
  };

  const saveField = async (form: Partial<Field>) => {
    if (!form.station_id || !form.crop_id) return toast({ title: "Estação e cultura obrigatórias", variant: "destructive" });
    const payload = {
      station_id: form.station_id, crop_id: form.crop_id, field_code: form.field_code || null,
      area_ha: Number(form.area_ha) || 0, planting_date: form.planting_date || null,
      expected_harvest: form.expected_harvest || null, status: form.status || "planeado", notes: form.notes || null,
    };
    const { error } = fieldEdit
      ? await supabase.from("crop_fields").update(payload).eq("id", fieldEdit.id)
      : await supabase.from("crop_fields").insert(payload);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    toast({ title: fieldEdit ? "Talhão actualizado" : "Talhão criado" });
    setFieldOpen(false); setFieldEdit(null); loadAll();
  };

  const saveHarvest = async (form: Partial<Harvest>) => {
    if (!form.field_id || !form.quantity) return toast({ title: "Talhão e quantidade obrigatórios", variant: "destructive" });
    const payload = {
      field_id: form.field_id, harvest_date: form.harvest_date || new Date().toISOString().slice(0, 10),
      quantity: Number(form.quantity) || 0, unit: form.unit || "kg",
      quality_grade: form.quality_grade || null, recorded_by: user?.id || null, notes: form.notes || null,
    };
    const { error } = await supabase.from("harvests").insert(payload);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    toast({ title: "Colheita registada" });
    setHarvestOpen(false); loadAll();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from(deleteId.table as any).delete().eq("id", deleteId.id);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else toast({ title: "Registo apagado" });
    setDeleteId(null); loadAll();
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader icon={Sprout} title="Agricultura" description="Culturas, talhões e colheitas das estações zootécnicas." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AdminCard variant="gradient-green-gold" icon={MapPin} title="Área total" metric={`${kpis.totalArea} ha`} stagger={1} />
        <AdminCard variant="glass" icon={Sprout} title="Talhões activos" metric={kpis.active} stagger={2} />
        <AdminCard variant="glass" icon={Wheat} title="Colheita acumulada" metric={`${kpis.totalHarvest}`} stagger={3} />
        <AdminCard variant="glass" icon={Tractor} title="Produtividade média" metric={`${kpis.productivity}/ha`} stagger={4} />
      </div>

      <Tabs defaultValue="talhoes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="talhoes"><MapPin className="h-4 w-4 mr-1" /> Talhões</TabsTrigger>
          <TabsTrigger value="culturas"><Sprout className="h-4 w-4 mr-1" /> Culturas</TabsTrigger>
          <TabsTrigger value="colheitas"><Wheat className="h-4 w-4 mr-1" /> Colheitas</TabsTrigger>
        </TabsList>

        <TabsContent value="talhoes">
          <AdminCard title="Talhões" loading={loading} isEmpty={!loading && fields.length === 0} emptyMessage="Sem talhões registados.">
            <div className="flex justify-end mb-3">
              {canEdit && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setHarvestOpen(true)} disabled={fields.length === 0}><Wheat className="h-4 w-4 mr-1" /> Nova Colheita</Button>
                  <Button size="sm" onClick={() => { setFieldEdit(null); setFieldOpen(true); }} disabled={crops.length === 0 || stations.length === 0}>
                    <Plus className="h-4 w-4 mr-1" /> Novo Talhão
                  </Button>
                </div>
              )}
            </div>
            <Table>
              <TableHeader><TableRow>
                <TableHead>Código</TableHead><TableHead>Estação</TableHead><TableHead>Cultura</TableHead>
                <TableHead>Área (ha)</TableHead><TableHead>Plantação</TableHead><TableHead>Colheita</TableHead><TableHead>Estado</TableHead>
                {canEdit && <TableHead className="w-24">Acções</TableHead>}
              </TableRow></TableHeader>
              <TableBody>
                {fields.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.field_code ?? "—"}</TableCell>
                    <TableCell>{stationName(f.station_id)}</TableCell>
                    <TableCell>{cropName(f.crop_id)}</TableCell>
                    <TableCell>{f.area_ha}</TableCell>
                    <TableCell>{f.planting_date ?? "—"}</TableCell>
                    <TableCell>{f.expected_harvest ?? "—"}</TableCell>
                    <TableCell><Badge variant="outline">{STATUS.find((s) => s.value === f.status)?.label}</Badge></TableCell>
                    {canEdit && (
                      <TableCell>
                        <Button size="icon" variant="ghost" onClick={() => { setFieldEdit(f); setFieldOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => setDeleteId({ table: "crop_fields", id: f.id })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AdminCard>
        </TabsContent>

        <TabsContent value="culturas">
          <AdminCard title="Culturas" loading={loading} isEmpty={!loading && crops.length === 0} emptyMessage="Sem culturas registadas.">
            <div className="flex justify-end mb-3">
              {canEdit && <Button size="sm" onClick={() => { setCropEdit(null); setCropOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Nova Cultura</Button>}
            </div>
            <Table>
              <TableHeader><TableRow>
                <TableHead>Nome</TableHead><TableHead>Nome científico</TableHead><TableHead>Ciclo (dias)</TableHead>
                {canEdit && <TableHead className="w-24">Acções</TableHead>}
              </TableRow></TableHeader>
              <TableBody>
                {crops.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="italic">{c.scientific_name ?? "—"}</TableCell>
                    <TableCell>{c.cycle_days ?? "—"}</TableCell>
                    {canEdit && (
                      <TableCell>
                        <Button size="icon" variant="ghost" onClick={() => { setCropEdit(c); setCropOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => setDeleteId({ table: "crops", id: c.id })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AdminCard>
        </TabsContent>

        <TabsContent value="colheitas">
          <AdminCard title="Histórico de Colheitas" loading={loading} isEmpty={!loading && harvests.length === 0} emptyMessage="Sem colheitas registadas.">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Data</TableHead><TableHead>Talhão</TableHead><TableHead>Quantidade</TableHead><TableHead>Qualidade</TableHead><TableHead>Notas</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {harvests.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell>{h.harvest_date}</TableCell>
                    <TableCell>{fieldLabel(h.field_id)}</TableCell>
                    <TableCell>{h.quantity} {h.unit}</TableCell>
                    <TableCell>{h.quality_grade ?? "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{h.notes ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AdminCard>
        </TabsContent>
      </Tabs>

      {/* Crop dialog */}
      <CropDialog open={cropOpen} onOpenChange={(v) => { setCropOpen(v); if (!v) setCropEdit(null); }} crop={cropEdit} onSave={saveCrop} />
      {/* Field dialog */}
      <FieldDialog open={fieldOpen} onOpenChange={(v) => { setFieldOpen(v); if (!v) setFieldEdit(null); }} field={fieldEdit} crops={crops} stations={stations} onSave={saveField} />
      {/* Harvest dialog */}
      <HarvestDialog open={harvestOpen} onOpenChange={setHarvestOpen} fields={fields} fieldLabel={fieldLabel} onSave={saveHarvest} />

      <DeleteConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}
        title="Apagar registo?" description="Esta acção é permanente." onConfirm={confirmDelete} />
    </div>
  );
}

function CropDialog({ open, onOpenChange, crop, onSave }: { open: boolean; onOpenChange: (v: boolean) => void; crop: Crop | null; onSave: (f: Partial<Crop>) => void }) {
  const [form, setForm] = useState<Partial<Crop>>({});
  useEffect(() => { setForm(crop ?? {}); }, [crop, open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{crop ? "Editar Cultura" : "Nova Cultura"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Nome *</Label><Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>Nome científico</Label><Input value={form.scientific_name || ""} onChange={(e) => setForm({ ...form, scientific_name: e.target.value })} /></div>
          <div><Label>Ciclo (dias)</Label><Input type="number" value={form.cycle_days ?? ""} onChange={(e) => setForm({ ...form, cycle_days: e.target.value === "" ? null : Number(e.target.value) })} /></div>
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

function FieldDialog({ open, onOpenChange, field, crops, stations, onSave }: {
  open: boolean; onOpenChange: (v: boolean) => void; field: Field | null;
  crops: Crop[]; stations: Station[]; onSave: (f: Partial<Field>) => void;
}) {
  const [form, setForm] = useState<Partial<Field>>({});
  useEffect(() => { setForm(field ?? { status: "planeado", area_ha: 0 }); }, [field, open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>{field ? "Editar Talhão" : "Novo Talhão"}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Estação *</Label>
            <Select value={form.station_id} onValueChange={(v) => setForm({ ...form, station_id: v })}>
              <SelectTrigger><SelectValue placeholder="Escolher" /></SelectTrigger>
              <SelectContent>{stations.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Cultura *</Label>
            <Select value={form.crop_id} onValueChange={(v) => setForm({ ...form, crop_id: v })}>
              <SelectTrigger><SelectValue placeholder="Escolher" /></SelectTrigger>
              <SelectContent>{crops.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Código</Label><Input value={form.field_code || ""} onChange={(e) => setForm({ ...form, field_code: e.target.value })} /></div>
          <div><Label>Área (ha)</Label><Input type="number" step="0.01" value={form.area_ha ?? 0} onChange={(e) => setForm({ ...form, area_ha: Number(e.target.value) })} /></div>
          <div><Label>Data de plantação</Label><Input type="date" value={form.planting_date || ""} onChange={(e) => setForm({ ...form, planting_date: e.target.value })} /></div>
          <div><Label>Colheita prevista</Label><Input type="date" value={form.expected_harvest || ""} onChange={(e) => setForm({ ...form, expected_harvest: e.target.value })} /></div>
          <div className="col-span-2"><Label>Estado</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as FieldStatus })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STATUS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
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

function HarvestDialog({ open, onOpenChange, fields, fieldLabel, onSave }: {
  open: boolean; onOpenChange: (v: boolean) => void; fields: Field[]; fieldLabel: (id: string) => string; onSave: (f: Partial<Harvest>) => void;
}) {
  const [form, setForm] = useState<Partial<Harvest>>({ unit: "kg", harvest_date: new Date().toISOString().slice(0, 10) });
  useEffect(() => { if (open) setForm({ unit: "kg", harvest_date: new Date().toISOString().slice(0, 10) }); }, [open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Registar Colheita</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Talhão *</Label>
            <Select value={form.field_id} onValueChange={(v) => setForm({ ...form, field_id: v })}>
              <SelectTrigger><SelectValue placeholder="Escolher" /></SelectTrigger>
              <SelectContent>{fields.map((f) => <SelectItem key={f.id} value={f.id}>{fieldLabel(f.id)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div><Label>Data</Label><Input type="date" value={form.harvest_date || ""} onChange={(e) => setForm({ ...form, harvest_date: e.target.value })} /></div>
            <div><Label>Quantidade *</Label><Input type="number" value={form.quantity ?? ""} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} /></div>
            <div><Label>Unidade</Label><Input value={form.unit || ""} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></div>
          </div>
          <div><Label>Qualidade</Label><Input value={form.quality_grade || ""} onChange={(e) => setForm({ ...form, quality_grade: e.target.value })} placeholder="Ex.: A, B, C" /></div>
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
