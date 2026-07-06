import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { TablePagination } from "@/components/admin/TablePagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { usePagination } from "@/hooks/usePagination";
import { Plus, AlertTriangle, Package, Pencil, Trash2, Eye } from "lucide-react";

interface Lab { id: string; name: string; }
interface Supply {
  id: string; laboratory_id: string; name: string; quantity: number;
  unit: string; min_stock: number; expiry_date: string | null;
}

export default function Insumos() {
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewItem, setViewItem] = useState<Supply | null>(null);
  const [editItem, setEditItem] = useState<Supply | null>(null);
  const { toast } = useToast();
  const pag = usePagination(20);

  const [labId, setLabId] = useState("");
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("unidade");
  const [minStock, setMinStock] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  const fetchData = async () => {
    setLoading(true);
    const [{ data: sData, count }, { data: lData }] = await Promise.all([
      supabase.from("lab_supplies").select("*", { count: "exact" }).order("name").range(pag.from, pag.to),
      supabase.from("laboratories").select("id, name").order("name"),
    ]);
    setSupplies((sData as Supply[]) ?? []);
    pag.setTotal(count ?? 0);
    setLabs((lData as Lab[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [pag.page, pag.pageSize]);
  const labNameMap = Object.fromEntries(labs.map((l) => [l.id, l.name]));

  const resetForm = () => { setLabId(""); setName(""); setQuantity(""); setUnit("unidade"); setMinStock(""); setExpiryDate(""); };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("lab_supplies").insert({
      laboratory_id: labId, name, quantity: parseInt(quantity), unit,
      min_stock: parseInt(minStock) || 0, expiry_date: expiryDate || null,
    } as any);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Insumo adicionado com sucesso" }); setOpen(false); resetForm(); fetchData();
  };

  const openEdit = (s: Supply) => {
    setEditItem(s); setLabId(s.laboratory_id); setName(s.name); setQuantity(String(s.quantity));
    setUnit(s.unit); setMinStock(String(s.min_stock)); setExpiryDate(s.expiry_date || ""); setEditOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    const { error } = await supabase.from("lab_supplies").update({
      laboratory_id: labId, name, quantity: parseInt(quantity), unit,
      min_stock: parseInt(minStock) || 0, expiry_date: expiryDate || null,
    } as any).eq("id", editItem.id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Insumo actualizado" }); setEditOpen(false); setEditItem(null); resetForm(); fetchData();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("lab_supplies").delete().eq("id", deleteId);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Insumo eliminado" }); setDeleteId(null); fetchData();
  };

  const formFields = (
    <>
      <div><Label>Laboratório</Label>
        <Select value={labId} onValueChange={setLabId} required>
          <SelectTrigger><SelectValue placeholder="Seleccionar laboratório" /></SelectTrigger>
          <SelectContent>{labs.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div><Label>Nome do Insumo</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Agar Mueller-Hinton" required /></div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div><Label>Quantidade</Label><Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} required min="0" /></div>
        <div><Label>Unidade</Label><Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="unidade" /></div>
        <div><Label>Stock Mínimo</Label><Input type="number" value={minStock} onChange={(e) => setMinStock(e.target.value)} min="0" /></div>
      </div>
      <div><Label>Data de Validade</Label><Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} /></div>
    </>
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader icon={Package} title="Insumos e Reagentes" description="Controlo de inventário laboratorial">
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Novo Insumo</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-serif">Adicionar Insumo</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">{formFields}<Button type="submit" className="w-full">Adicionar Insumo</Button></form>
          </DialogContent>
        </Dialog>
      </AdminPageHeader>

      <Dialog open={editOpen} onOpenChange={(o) => { setEditOpen(o); if (!o) { setEditItem(null); resetForm(); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-serif">Editar Insumo</DialogTitle></DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">{formFields}<Button type="submit" className="w-full">Guardar Alterações</Button></form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} onConfirm={handleDelete} />

      <Dialog open={!!viewItem} onOpenChange={(o) => !o && setViewItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-serif">Detalhes do Insumo</DialogTitle></DialogHeader>
          {viewItem && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground">Nome:</span><p className="font-medium">{viewItem.name}</p></div>
                <div><span className="text-muted-foreground">Laboratório:</span><p className="font-medium">{labNameMap[viewItem.laboratory_id] ?? "—"}</p></div>
                <div><span className="text-muted-foreground">Quantidade:</span><p className="font-medium">{viewItem.quantity} {viewItem.unit}</p></div>
                <div><span className="text-muted-foreground">Stock Mínimo:</span><p className="font-medium">{viewItem.min_stock} {viewItem.unit}</p></div>
                <div><span className="text-muted-foreground">Validade:</span><p className="font-medium">{viewItem.expiry_date ? new Date(viewItem.expiry_date).toLocaleDateString("pt-AO") : "—"}</p></div>
                <div><span className="text-muted-foreground">Estado:</span><p>{viewItem.expiry_date && new Date(viewItem.expiry_date) < new Date() ? <Badge variant="destructive">Expirado</Badge> : viewItem.quantity <= viewItem.min_stock ? <Badge variant="destructive">Stock Baixo</Badge> : <Badge variant="default">OK</Badge>}</p></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AdminCard title="Inventário de Insumos" icon={Package} loading={loading} isEmpty={supplies.length === 0} emptyMessage="Nenhum insumo cadastrado.">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead><TableHead>Laboratório</TableHead>
                <TableHead>Quantidade</TableHead><TableHead>Validade</TableHead><TableHead>Estado</TableHead><TableHead className="w-24">Acções</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {supplies.map((s) => {
                const isLow = s.quantity <= s.min_stock;
                const isExpired = s.expiry_date && new Date(s.expiry_date) < new Date();
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{labNameMap[s.laboratory_id] ?? "—"}</TableCell>
                    <TableCell>{s.quantity} {s.unit}</TableCell>
                    <TableCell>{s.expiry_date ? new Date(s.expiry_date).toLocaleDateString("pt-AO") : "—"}</TableCell>
                    <TableCell>
                      {isExpired ? <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> Expirado</Badge>
                        : isLow ? <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> Stock Baixo</Badge>
                        : <Badge variant="default">OK</Badge>}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setViewItem(s)}><Eye className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(s.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <TablePagination
          page={pag.page}
          pageSize={pag.pageSize}
          total={pag.total}
          totalPages={pag.totalPages}
          canPrev={pag.canPrev}
          canNext={pag.canNext}
          onPageChange={pag.setPage}
          onPageSizeChange={pag.setPageSize}
        />
      </AdminCard>
    </div>
  );
}
