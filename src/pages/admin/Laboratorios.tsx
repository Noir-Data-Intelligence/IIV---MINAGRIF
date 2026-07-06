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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { usePagination } from "@/hooks/usePagination";
import { Plus, FlaskConical, Pencil, Trash2, Eye } from "lucide-react";

interface Laboratory {
  id: string; name: string; type: string; description: string | null; is_active: boolean; created_at: string;
}

export default function Laboratorios() {
  const [labs, setLabs] = useState<Laboratory[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewItem, setViewItem] = useState<Laboratory | null>(null);
  const [editItem, setEditItem] = useState<Laboratory | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const { toast } = useToast();
  const pag = usePagination(20);

  const fetchLabs = async () => {
    setLoading(true);
    const { data, count } = await supabase
      .from("laboratories")
      .select("*", { count: "exact" })
      .order("name")
      .range(pag.from, pag.to);
    setLabs((data as Laboratory[]) ?? []);
    pag.setTotal(count ?? 0);
    setLoading(false);
  };

  useEffect(() => { fetchLabs(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [pag.page, pag.pageSize]);

  const resetForm = () => { setName(""); setType(""); setDescription(""); };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("laboratories").insert({ name, type, description: description || null } as any);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Laboratório criado com sucesso" }); setOpen(false); resetForm(); fetchLabs();
  };

  const openEdit = (l: Laboratory) => {
    setEditItem(l); setName(l.name); setType(l.type); setDescription(l.description || ""); setEditOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    const { error } = await supabase.from("laboratories").update({ name, type, description: description || null } as any).eq("id", editItem.id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Laboratório actualizado" }); setEditOpen(false); setEditItem(null); resetForm(); fetchLabs();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("laboratories").delete().eq("id", deleteId);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Laboratório eliminado" }); setDeleteId(null); fetchLabs();
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader icon={FlaskConical} title="Laboratórios" description="Gestão dos laboratórios do instituto">
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Novo Laboratório</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-serif">Cadastrar Laboratório</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div><Label>Nome</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Laboratório de Virologia" required /></div>
              <div><Label>Tipo</Label><Input value={type} onChange={(e) => setType(e.target.value)} placeholder="Ex: virologia, bacteriologia" required /></div>
              <div><Label>Descrição</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição do laboratório" /></div>
              <Button type="submit" className="w-full">Criar Laboratório</Button>
            </form>
          </DialogContent>
        </Dialog>
      </AdminPageHeader>

      <Dialog open={editOpen} onOpenChange={(o) => { setEditOpen(o); if (!o) { setEditItem(null); resetForm(); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-serif">Editar Laboratório</DialogTitle></DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div><Label>Nome</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
            <div><Label>Tipo</Label><Input value={type} onChange={(e) => setType(e.target.value)} required /></div>
            <div><Label>Descrição</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} /></div>
            <Button type="submit" className="w-full">Guardar Alterações</Button>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} onConfirm={handleDelete} />

      <Dialog open={!!viewItem} onOpenChange={(o) => !o && setViewItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-serif">Detalhes do Laboratório</DialogTitle></DialogHeader>
          {viewItem && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground">Nome:</span><p className="font-medium">{viewItem.name}</p></div>
                <div><span className="text-muted-foreground">Tipo:</span><p className="font-medium capitalize">{viewItem.type}</p></div>
                <div><span className="text-muted-foreground">Estado:</span><p><Badge variant={viewItem.is_active ? "default" : "destructive"}>{viewItem.is_active ? "Activo" : "Inactivo"}</Badge></p></div>
                <div><span className="text-muted-foreground">Criado em:</span><p className="font-medium">{new Date(viewItem.created_at).toLocaleDateString("pt-AO")}</p></div>
              </div>
              {viewItem.description && <div><span className="text-muted-foreground">Descrição:</span><p className="font-medium mt-1">{viewItem.description}</p></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AdminCard title="Laboratórios Cadastrados" icon={FlaskConical} loading={loading} isEmpty={labs.length === 0} emptyMessage="Nenhum laboratório cadastrado.">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead><TableHead>Tipo</TableHead><TableHead>Estado</TableHead><TableHead>Descrição</TableHead><TableHead className="w-24">Acções</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {labs.map((l) => (
              <TableRow key={l.id}>
                <TableCell className="font-medium"><div className="flex items-center gap-2"><FlaskConical className="h-4 w-4 text-primary" />{l.name}</div></TableCell>
                <TableCell><Badge variant="secondary" className="capitalize">{l.type}</Badge></TableCell>
                <TableCell><Badge variant={l.is_active ? "default" : "destructive"}>{l.is_active ? "Activo" : "Inactivo"}</Badge></TableCell>
                <TableCell className="text-muted-foreground text-sm max-w-xs truncate">{l.description || "—"}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setViewItem(l)}><Eye className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(l)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(l.id)}><Trash2 className="h-4 w-4" /></Button>
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
