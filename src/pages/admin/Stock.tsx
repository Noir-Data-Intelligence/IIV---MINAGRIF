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
import { Plus, Boxes, Pencil, Trash2, Warehouse, ArrowLeftRight, AlertTriangle, Package } from "lucide-react";
import { useClientPagination } from "@/hooks/useClientPagination";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/admin/TablePagination";

type StockCategory = "laboratorio" | "vacinas" | "agricola" | "pecuaria" | "administrativo" | "semen" | "combustivel";
type MovementType = "entrada" | "saida" | "transferencia" | "ajuste";

interface StockLocation { id: string; name: string; description: string | null; is_active: boolean }
interface StockItem {
  id: string; name: string; category: StockCategory; sku: string | null; unit: string;
  quantity: number; min_stock: number; location_id: string | null; expiry_date: string | null;
  supplier: string | null; unit_cost: number | null; notes: string | null;
}
interface StockMovement {
  id: string; item_id: string; type: MovementType; quantity: number;
  from_location_id: string | null; to_location_id: string | null; reason: string | null;
  performed_by: string | null; movement_date: string;
}

const CATS: { value: StockCategory; label: string }[] = [
  { value: "laboratorio", label: "Laboratório" },
  { value: "vacinas", label: "Vacinas" },
  { value: "agricola", label: "Agrícola" },
  { value: "pecuaria", label: "Pecuária" },
  { value: "administrativo", label: "Administrativo" },
  { value: "semen", label: "Sémen" },
  { value: "combustivel", label: "Combustível" },
];
const catLabel = (c: StockCategory) => CATS.find((x) => x.value === c)?.label ?? c;

const MOV_TYPES: { value: MovementType; label: string }[] = [
  { value: "entrada", label: "Entrada" },
  { value: "saida", label: "Saída" },
  { value: "transferencia", label: "Transferência" },
  { value: "ajuste", label: "Ajuste" },
];

export default function Stock() {
  const { user } = useAuth();
  const { canWrite } = useUserRole();
  const { toast } = useToast();
  const canEdit = canWrite("stock");

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<StockItem[]>([]);
  const [locations, setLocations] = useState<StockLocation[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);

  const [filterCat, setFilterCat] = useState<StockCategory | "all">("all");

  const [itemOpen, setItemOpen] = useState(false);
  const [itemEdit, setItemEdit] = useState<StockItem | null>(null);
  const [locOpen, setLocOpen] = useState(false);
  const [locEdit, setLocEdit] = useState<StockLocation | null>(null);
  const [movOpen, setMovOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<{ table: string; id: string } | null>(null);

  const movsPag = usePagination(20);

  const loadAll = async () => {
    setLoading(true);
    const [i, l] = await Promise.all([
      supabase.from("stock_items").select("*").order("name"),
      supabase.from("stock_locations").select("*").order("name"),
    ]);
    if (i.data) setItems(i.data as StockItem[]);
    if (l.data) setLocations(l.data as StockLocation[]);
    setLoading(false);
  };

  const loadMovements = async () => {
    const { data, count } = await supabase
      .from("stock_movements")
      .select("*", { count: "exact" })
      .order("movement_date", { ascending: false })
      .range(movsPag.from, movsPag.to);
    setMovements((data as StockMovement[]) ?? []);
    movsPag.setTotal(count ?? 0);
  };

  useEffect(() => { loadAll(); }, []);
  useEffect(() => { loadMovements(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [movsPag.page, movsPag.pageSize]);

  const filteredItems = useMemo(
    () => (filterCat === "all" ? items : items.filter((i) => i.category === filterCat)),
    [items, filterCat]
  );

  const itemsPag = useClientPagination(filteredItems, 20);
  const locsPag = useClientPagination(locations, 20);

  const kpis = useMemo(() => {
    const total = items.length;
    const low = items.filter((i) => Number(i.quantity) <= Number(i.min_stock) && Number(i.min_stock) > 0).length;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const in30 = new Date(today); in30.setDate(in30.getDate() + 30);
    const expiring = items.filter((i) => i.expiry_date && new Date(i.expiry_date) <= in30).length;
    const value = items.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.unit_cost) || 0), 0);
    return { total, low, expiring, value };
  }, [items]);

  const locName = (id: string | null) => (id ? locations.find((l) => l.id === id)?.name ?? "—" : "—");
  const itemName = (id: string) => items.find((i) => i.id === id)?.name ?? "—";

  // Save handlers
  const saveItem = async (form: Partial<StockItem>) => {
    if (!form.name || !form.category) return toast({ title: "Preencha os campos obrigatórios", variant: "destructive" });
    const payload = {
      name: form.name, category: form.category, sku: form.sku || null,
      unit: form.unit || "unidade", quantity: Number(form.quantity) || 0, min_stock: Number(form.min_stock) || 0,
      location_id: form.location_id || null, expiry_date: form.expiry_date || null,
      supplier: form.supplier || null, unit_cost: form.unit_cost != null ? Number(form.unit_cost) : null,
      notes: form.notes || null,
    };
    const { error } = itemEdit
      ? await supabase.from("stock_items").update(payload).eq("id", itemEdit.id)
      : await supabase.from("stock_items").insert(payload);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    toast({ title: itemEdit ? "Item actualizado" : "Item criado" });
    setItemOpen(false); setItemEdit(null); loadAll();
  };

  const saveLoc = async (form: Partial<StockLocation>) => {
    if (!form.name) return toast({ title: "Nome obrigatório", variant: "destructive" });
    const payload = { name: form.name, description: form.description || null, is_active: form.is_active ?? true };
    const { error } = locEdit
      ? await supabase.from("stock_locations").update(payload).eq("id", locEdit.id)
      : await supabase.from("stock_locations").insert(payload);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    toast({ title: locEdit ? "Localização actualizada" : "Localização criada" });
    setLocOpen(false); setLocEdit(null); loadAll();
  };

  const saveMov = async (form: Partial<StockMovement>) => {
    if (!form.item_id || !form.type || !form.quantity) return toast({ title: "Item, tipo e quantidade obrigatórios", variant: "destructive" });
    const qty = Number(form.quantity);
    const item = items.find((i) => i.id === form.item_id);
    if (!item) return;
    const payload = {
      item_id: form.item_id, type: form.type, quantity: qty,
      from_location_id: form.from_location_id || null, to_location_id: form.to_location_id || null,
      reason: form.reason || null, performed_by: user?.id || null,
      movement_date: form.movement_date || new Date().toISOString().slice(0, 10),
    };
    const { error } = await supabase.from("stock_movements").insert(payload);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });

    // Adjust item quantity
    let delta = 0;
    if (form.type === "entrada" || form.type === "ajuste") delta = qty;
    else if (form.type === "saida") delta = -qty;
    if (delta !== 0) {
      const newQty = Math.max(0, Number(item.quantity) + delta);
      await supabase.from("stock_items").update({ quantity: newQty }).eq("id", item.id);
    }
    toast({ title: "Movimento registado" });
    setMovOpen(false); loadAll(); loadMovements();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from(deleteId.table as any).delete().eq("id", deleteId.id);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else toast({ title: "Registo apagado" });
    setDeleteId(null); loadAll(); if (deleteId.table === "stock_movements") loadMovements();
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader icon={Boxes} title="Stock Integrado" description="Inventário unificado: laboratório, vacinas, agrícola, pecuária e administrativo." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AdminCard variant="gradient-green-gold" icon={Package} title="Total de Itens" metric={kpis.total} stagger={1} />
        <AdminCard variant={kpis.low > 0 ? "gradient-gold" : "glass"} icon={AlertTriangle} title="Stock Baixo" metric={kpis.low} stagger={2} />
        <AdminCard variant={kpis.expiring > 0 ? "gradient-gold" : "glass"} icon={AlertTriangle} title="A expirar (30d)" metric={kpis.expiring} stagger={3} />
        <AdminCard variant="glass" icon={Boxes} title="Valor estimado" metric={`${kpis.value.toLocaleString("pt-PT")} Kz`} stagger={4} />
      </div>

      <Tabs defaultValue="itens" className="space-y-4">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="itens"><Package className="h-4 w-4 mr-1" /> Itens</TabsTrigger>
          <TabsTrigger value="locais"><Warehouse className="h-4 w-4 mr-1" /> Localizações</TabsTrigger>
          <TabsTrigger value="movimentos"><ArrowLeftRight className="h-4 w-4 mr-1" /> Movimentos</TabsTrigger>
        </TabsList>

        {/* ITENS */}
        <TabsContent value="itens">
          <AdminCard title="Inventário" loading={loading} isEmpty={!loading && filteredItems.length === 0} emptyMessage="Sem itens nesta categoria.">
            <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
              <Select value={filterCat} onValueChange={(v) => setFilterCat(v as any)}>
                <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {CATS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
              {canEdit && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setMovOpen(true)} disabled={items.length === 0}>
                    <ArrowLeftRight className="h-4 w-4 mr-1" /> Novo Movimento
                  </Button>
                  <Button size="sm" onClick={() => { setItemEdit(null); setItemOpen(true); }}>
                    <Plus className="h-4 w-4 mr-1" /> Novo Item
                  </Button>
                </div>
              )}
            </div>
            <Table>
              <TableHeader><TableRow>
                <TableHead>Nome</TableHead><TableHead>Categoria</TableHead><TableHead>Qtd</TableHead>
                <TableHead>Mín.</TableHead><TableHead>Localização</TableHead><TableHead>Validade</TableHead>
                {canEdit && <TableHead className="w-24">Acções</TableHead>}
              </TableRow></TableHeader>
              <TableBody>
                {itemsPag.pageItems.map((i) => {
                  const low = Number(i.quantity) <= Number(i.min_stock) && Number(i.min_stock) > 0;
                  return (
                    <TableRow key={i.id}>
                      <TableCell className="font-medium">{i.name}{i.sku && <span className="text-xs text-muted-foreground ml-1">({i.sku})</span>}</TableCell>
                      <TableCell><Badge variant="outline">{catLabel(i.category)}</Badge></TableCell>
                      <TableCell className={low ? "text-destructive font-medium" : ""}>{i.quantity} {i.unit}</TableCell>
                      <TableCell>{i.min_stock}</TableCell>
                      <TableCell>{locName(i.location_id)}</TableCell>
                      <TableCell>{i.expiry_date ?? "—"}</TableCell>
                      {canEdit && (
                        <TableCell>
                          <Button size="icon" variant="ghost" onClick={() => { setItemEdit(i); setItemOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => setDeleteId({ table: "stock_items", id: i.id })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <TablePagination page={itemsPag.page} pageSize={itemsPag.pageSize} total={itemsPag.total} totalPages={itemsPag.totalPages} canPrev={itemsPag.canPrev} canNext={itemsPag.canNext} onPageChange={itemsPag.setPage} onPageSizeChange={itemsPag.setPageSize} />
          </AdminCard>
        </TabsContent>

        {/* LOCAIS */}
        <TabsContent value="locais">
          <AdminCard title="Localizações" loading={loading} isEmpty={!loading && locations.length === 0} emptyMessage="Sem localizações.">
            <div className="flex justify-end mb-3">
              {canEdit && <Button size="sm" onClick={() => { setLocEdit(null); setLocOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Nova Localização</Button>}
            </div>
            <Table>
              <TableHeader><TableRow>
                <TableHead>Nome</TableHead><TableHead>Descrição</TableHead><TableHead>Estado</TableHead>
                {canEdit && <TableHead className="w-24">Acções</TableHead>}
              </TableRow></TableHeader>
              <TableBody>
                {locsPag.pageItems.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{l.name}</TableCell>
                    <TableCell>{l.description ?? "—"}</TableCell>
                    <TableCell><Badge variant={l.is_active ? "default" : "secondary"}>{l.is_active ? "Activo" : "Inactivo"}</Badge></TableCell>
                    {canEdit && (
                      <TableCell>
                        <Button size="icon" variant="ghost" onClick={() => { setLocEdit(l); setLocOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => setDeleteId({ table: "stock_locations", id: l.id })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination page={locsPag.page} pageSize={locsPag.pageSize} total={locsPag.total} totalPages={locsPag.totalPages} canPrev={locsPag.canPrev} canNext={locsPag.canNext} onPageChange={locsPag.setPage} onPageSizeChange={locsPag.setPageSize} />
          </AdminCard>
        </TabsContent>

        {/* MOVIMENTOS */}
        <TabsContent value="movimentos">
          <AdminCard title="Histórico de Movimentos" loading={loading} isEmpty={!loading && movsPag.total === 0} emptyMessage="Sem movimentos.">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Data</TableHead><TableHead>Item</TableHead><TableHead>Tipo</TableHead>
                <TableHead>Qtd</TableHead><TableHead>De → Para</TableHead><TableHead>Motivo</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {movements.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>{m.movement_date}</TableCell>
                    <TableCell>{itemName(m.item_id)}</TableCell>
                    <TableCell><Badge variant="outline">{m.type}</Badge></TableCell>
                    <TableCell>{m.quantity}</TableCell>
                    <TableCell className="text-xs">{locName(m.from_location_id)} → {locName(m.to_location_id)}</TableCell>
                    <TableCell>{m.reason ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination page={movsPag.page} pageSize={movsPag.pageSize} total={movsPag.total} totalPages={movsPag.totalPages} canPrev={movsPag.canPrev} canNext={movsPag.canNext} onPageChange={movsPag.setPage} onPageSizeChange={movsPag.setPageSize} />
          </AdminCard>
        </TabsContent>
      </Tabs>

      {/* DIALOG ITEM */}
      <ItemDialog open={itemOpen} onOpenChange={(v) => { setItemOpen(v); if (!v) setItemEdit(null); }}
        item={itemEdit} locations={locations} onSave={saveItem} />

      {/* DIALOG LOCATION */}
      <LocationDialog open={locOpen} onOpenChange={(v) => { setLocOpen(v); if (!v) setLocEdit(null); }}
        location={locEdit} onSave={saveLoc} />

      {/* DIALOG MOVEMENT */}
      <MovementDialog open={movOpen} onOpenChange={setMovOpen} items={items} locations={locations} onSave={saveMov} />

      <DeleteConfirmDialog
        open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}
        title="Apagar registo?" description="Esta acção é permanente." onConfirm={confirmDelete}
      />
    </div>
  );
}

// ----- Dialogs -----

function ItemDialog({ open, onOpenChange, item, locations, onSave }: {
  open: boolean; onOpenChange: (v: boolean) => void; item: StockItem | null;
  locations: StockLocation[]; onSave: (f: Partial<StockItem>) => void;
}) {
  const [form, setForm] = useState<Partial<StockItem>>({});
  useEffect(() => {
    setForm(item ?? { category: "laboratorio", unit: "unidade", quantity: 0, min_stock: 0 });
  }, [item, open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{item ? "Editar Item" : "Novo Item"}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Label>Nome *</Label><Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>Categoria *</Label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as StockCategory })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CATS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>SKU</Label><Input value={form.sku || ""} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></div>
          <div><Label>Unidade</Label><Input value={form.unit || ""} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></div>
          <div><Label>Quantidade</Label><Input type="number" value={form.quantity ?? 0} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} /></div>
          <div><Label>Stock Mínimo</Label><Input type="number" value={form.min_stock ?? 0} onChange={(e) => setForm({ ...form, min_stock: Number(e.target.value) })} /></div>
          <div><Label>Validade</Label><Input type="date" value={form.expiry_date || ""} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} /></div>
          <div><Label>Localização</Label>
            <Select value={form.location_id || "_none"} onValueChange={(v) => setForm({ ...form, location_id: v === "_none" ? null : v })}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">—</SelectItem>
                {locations.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Fornecedor</Label><Input value={form.supplier || ""} onChange={(e) => setForm({ ...form, supplier: e.target.value })} /></div>
          <div><Label>Custo Unit. (Kz)</Label><Input type="number" value={form.unit_cost ?? ""} onChange={(e) => setForm({ ...form, unit_cost: e.target.value === "" ? null : Number(e.target.value) })} /></div>
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

function LocationDialog({ open, onOpenChange, location, onSave }: {
  open: boolean; onOpenChange: (v: boolean) => void; location: StockLocation | null; onSave: (f: Partial<StockLocation>) => void;
}) {
  const [form, setForm] = useState<Partial<StockLocation>>({});
  useEffect(() => { setForm(location ?? { is_active: true }); }, [location, open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{location ? "Editar Localização" : "Nova Localização"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Nome *</Label><Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>Descrição</Label><Textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        </div>
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => onSave(form)}>Guardar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MovementDialog({ open, onOpenChange, items, locations, onSave }: {
  open: boolean; onOpenChange: (v: boolean) => void; items: StockItem[]; locations: StockLocation[]; onSave: (f: Partial<StockMovement>) => void;
}) {
  const [form, setForm] = useState<Partial<StockMovement>>({ type: "entrada", movement_date: new Date().toISOString().slice(0, 10) });
  useEffect(() => { if (open) setForm({ type: "entrada", movement_date: new Date().toISOString().slice(0, 10) }); }, [open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Novo Movimento</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Label>Item *</Label>
            <Select value={form.item_id} onValueChange={(v) => setForm({ ...form, item_id: v })}>
              <SelectTrigger><SelectValue placeholder="Escolher item" /></SelectTrigger>
              <SelectContent>{items.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Tipo</Label>
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as MovementType })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{MOV_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Quantidade *</Label><Input type="number" value={form.quantity ?? ""} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} /></div>
          <div><Label>Origem</Label>
            <Select value={form.from_location_id || "_none"} onValueChange={(v) => setForm({ ...form, from_location_id: v === "_none" ? null : v })}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">—</SelectItem>
                {locations.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Destino</Label>
            <Select value={form.to_location_id || "_none"} onValueChange={(v) => setForm({ ...form, to_location_id: v === "_none" ? null : v })}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">—</SelectItem>
                {locations.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Data</Label><Input type="date" value={form.movement_date || ""} onChange={(e) => setForm({ ...form, movement_date: e.target.value })} /></div>
          <div className="col-span-2"><Label>Motivo</Label><Textarea value={form.reason || ""} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
        </div>
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => onSave(form)}>Registar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
