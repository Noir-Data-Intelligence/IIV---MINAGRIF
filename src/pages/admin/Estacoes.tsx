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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { usePagination } from "@/hooks/usePagination";
import { Plus, MapPin, Pencil, Trash2, Eye } from "lucide-react";

interface Station {
  id: string; name: string; station_type: string; location: string | null;
  description: string | null; is_active: boolean; created_at: string;
}

const typeLabels: Record<string, string> = { zootecnica: "Zootécnica", experimental: "Experimental", campo: "Campo" };

export default function Estacoes() {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewItem, setViewItem] = useState<Station | null>(null);
  const [editItem, setEditItem] = useState<Station | null>(null);
  const [name, setName] = useState("");
  const [stationType, setStationType] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const { toast } = useToast();
  const pag = usePagination(20);

  const fetchData = async () => {
    setLoading(true);
    const { data, count } = await supabase
      .from("stations")
      .select("*", { count: "exact" })
      .order("name")
      .range(pag.from, pag.to);
    setStations((data as Station[]) ?? []);
    pag.setTotal(count ?? 0);
    setLoading(false);
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [pag.page, pag.pageSize]);

  const resetForm = () => { setName(""); setStationType(""); setLocation(""); setDescription(""); };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("stations").insert({ name, station_type: stationType, location: location || null, description: description || null } as any);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Estação criada com sucesso" }); setOpen(false); resetForm(); fetchData();
  };

  const openEdit = (s: Station) => {
    setEditItem(s); setName(s.name); setStationType(s.station_type); setLocation(s.location || ""); setDescription(s.description || ""); setEditOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    const { error } = await supabase.from("stations").update({ name, station_type: stationType, location: location || null, description: description || null } as any).eq("id", editItem.id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Estação actualizada" }); setEditOpen(false); setEditItem(null); resetForm(); fetchData();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("stations").delete().eq("id", deleteId);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Estação eliminada" }); setDeleteId(null); fetchData();
  };

  const formFields = (
    <>
      <div><Label>Nome</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Estação Zootécnica de Maputo" required /></div>
      <div><Label>Tipo</Label>
        <Select value={stationType} onValueChange={setStationType} required>
          <SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="zootecnica">Zootécnica</SelectItem><SelectItem value="experimental">Experimental</SelectItem><SelectItem value="campo">Campo</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div><Label>Localização</Label><Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ex: Maputo, Moçambique" /></div>
      <div><Label>Descrição</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} /></div>
    </>
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader icon={MapPin} title="Estações" description="Gestão de estações zootécnicas e experimentais">
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Nova Estação</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-serif">Cadastrar Estação</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">{formFields}<Button type="submit" className="w-full" disabled={!stationType}>Criar Estação</Button></form>
          </DialogContent>
        </Dialog>
      </AdminPageHeader>

      <Dialog open={editOpen} onOpenChange={(o) => { setEditOpen(o); if (!o) { setEditItem(null); resetForm(); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-serif">Editar Estação</DialogTitle></DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">{formFields}<Button type="submit" className="w-full" disabled={!stationType}>Guardar Alterações</Button></form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} onConfirm={handleDelete} />

      <Dialog open={!!viewItem} onOpenChange={(o) => !o && setViewItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-serif">Detalhes da Estação</DialogTitle></DialogHeader>
          {viewItem && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground">Nome:</span><p className="font-medium">{viewItem.name}</p></div>
                <div><span className="text-muted-foreground">Tipo:</span><p className="font-medium">{typeLabels[viewItem.station_type] || viewItem.station_type}</p></div>
                <div><span className="text-muted-foreground">Localização:</span><p className="font-medium">{viewItem.location || "—"}</p></div>
                <div><span className="text-muted-foreground">Estado:</span><p><Badge variant={viewItem.is_active ? "default" : "destructive"}>{viewItem.is_active ? "Activa" : "Inactiva"}</Badge></p></div>
                <div><span className="text-muted-foreground">Criada em:</span><p className="font-medium">{new Date(viewItem.created_at).toLocaleDateString("pt-AO")}</p></div>
              </div>
              {viewItem.description && <div><span className="text-muted-foreground">Descrição:</span><p className="font-medium mt-1">{viewItem.description}</p></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AdminCard title="Estações Cadastradas" icon={MapPin} loading={loading} isEmpty={stations.length === 0} emptyMessage="Nenhuma estação cadastrada.">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead><TableHead>Tipo</TableHead><TableHead>Localização</TableHead><TableHead>Estado</TableHead><TableHead className="w-24">Acções</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stations.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium"><div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" />{s.name}</div></TableCell>
                <TableCell><Badge variant="secondary">{typeLabels[s.station_type] || s.station_type}</Badge></TableCell>
                <TableCell className="text-muted-foreground text-sm">{s.location || "—"}</TableCell>
                <TableCell><Badge variant={s.is_active ? "default" : "destructive"}>{s.is_active ? "Activa" : "Inactiva"}</Badge></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setViewItem(s)}><Eye className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(s.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
