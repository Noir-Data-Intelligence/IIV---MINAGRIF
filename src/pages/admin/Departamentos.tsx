import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { TablePagination } from "@/components/admin/TablePagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { usePagination } from "@/hooks/usePagination";
import { Plus, Building2, Pencil, Trash2, Eye } from "lucide-react";

interface Department {
  id: string; name: string; description: string | null; parent_id: string | null; created_at: string;
}

export default function Departamentos() {
  const [depts, setDepts] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewItem, setViewItem] = useState<Department | null>(null);
  const [editItem, setEditItem] = useState<Department | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const { toast } = useToast();
  const pag = usePagination(20);

  const fetchData = async () => {
    setLoading(true);
    const { data, count } = await supabase
      .from("departments")
      .select("*", { count: "exact" })
      .order("name")
      .range(pag.from, pag.to);
    setDepts(data ?? []);
    pag.setTotal(count ?? 0);
    setLoading(false);
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [pag.page, pag.pageSize]);

  const resetForm = () => { setName(""); setDescription(""); };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("departments").insert({ name, description: description || null } as any);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Departamento criado com sucesso" }); setOpen(false); resetForm(); fetchData();
  };

  const openEdit = (d: Department) => {
    setEditItem(d); setName(d.name); setDescription(d.description || ""); setEditOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    const { error } = await supabase.from("departments").update({ name, description: description || null } as any).eq("id", editItem.id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Departamento actualizado" }); setEditOpen(false); setEditItem(null); resetForm(); fetchData();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("departments").delete().eq("id", deleteId);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Departamento eliminado" }); setDeleteId(null); fetchData();
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader icon={Building2} title="Gestão de Departamentos" description="Estrutura organizacional do instituto">
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Novo Departamento</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-serif">Criar Departamento</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div><Label>Nome</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Departamento de Virologia" required /></div>
              <div><Label>Descrição</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição do departamento" /></div>
              <Button type="submit" className="w-full">Criar Departamento</Button>
            </form>
          </DialogContent>
        </Dialog>
      </AdminPageHeader>

      <Dialog open={editOpen} onOpenChange={(o) => { setEditOpen(o); if (!o) { setEditItem(null); resetForm(); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-serif">Editar Departamento</DialogTitle></DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div><Label>Nome</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
            <div><Label>Descrição</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} /></div>
            <Button type="submit" className="w-full">Guardar Alterações</Button>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} onConfirm={handleDelete} />

      <Dialog open={!!viewItem} onOpenChange={(o) => !o && setViewItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-serif">Detalhes do Departamento</DialogTitle></DialogHeader>
          {viewItem && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground">Nome:</span><p className="font-medium">{viewItem.name}</p></div>
                <div><span className="text-muted-foreground">Criado em:</span><p className="font-medium">{new Date(viewItem.created_at).toLocaleDateString("pt-AO")}</p></div>
              </div>
              {viewItem.description && <div><span className="text-muted-foreground">Descrição:</span><p className="font-medium mt-1">{viewItem.description}</p></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AdminCard title="Departamentos" icon={Building2} loading={loading} isEmpty={depts.length === 0} emptyMessage="Nenhum departamento encontrado.">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead><TableHead>Descrição</TableHead><TableHead className="w-24">Acções</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {depts.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-medium">{d.name}</TableCell>
                <TableCell className="text-muted-foreground">{d.description || "—"}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setViewItem(d)}><Eye className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(d)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(d.id)}><Trash2 className="h-4 w-4" /></Button>
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
