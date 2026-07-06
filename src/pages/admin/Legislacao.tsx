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
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { usePagination } from "@/hooks/usePagination";
import { Plus, ScrollText, Pencil, Trash2, FileUp, ExternalLink } from "lucide-react";

interface Legislation {
  id: string;
  num: string;
  slug: string;
  titulo: string;
  descricao: string | null;
  tipo: string;
  ano: string;
  pdf_path: string | null;
  published: boolean;
}

const tipos = ["Lei", "Decreto", "Regulamento", "Norma", "Portaria"];

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

export default function LegislacaoAdmin() {
  const [items, setItems] = useState<Legislation[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<Legislation | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ num: "", titulo: "", descricao: "", tipo: "Lei", ano: "", published: true });
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();
  const pag = usePagination(20);

  const fetchData = async () => {
    setLoading(true);
    const { data, count } = await supabase
      .from("legislation")
      .select("*", { count: "exact" })
      .order("ano", { ascending: false })
      .range(pag.from, pag.to);
    setItems(data ?? []);
    pag.setTotal(count ?? 0);
    setLoading(false);
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [pag.page, pag.pageSize]);

  const resetForm = () => {
    setForm({ num: "", titulo: "", descricao: "", tipo: "Lei", ano: "", published: true });
    setFile(null);
    setEditItem(null);
  };

  const openCreate = () => { resetForm(); setOpen(true); };
  const openEdit = (it: Legislation) => {
    setEditItem(it);
    setForm({
      num: it.num, titulo: it.titulo, descricao: it.descricao || "",
      tipo: it.tipo, ano: it.ano, published: it.published,
    });
    setFile(null);
    setOpen(true);
  };

  const uploadPdf = async (slug: string): Promise<string | null> => {
    if (!file) return null;
    const ext = file.name.split(".").pop() || "pdf";
    const path = `${slug}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("legislation").upload(path, file, {
      contentType: file.type || "application/pdf",
      upsert: true,
    });
    if (error) throw error;
    return path;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      const slug = editItem?.slug || slugify(form.titulo);
      let pdf_path = editItem?.pdf_path ?? null;
      if (file) pdf_path = await uploadPdf(slug);

      if (editItem) {
        const { error } = await supabase.from("legislation").update({
          num: form.num, titulo: form.titulo, descricao: form.descricao || null,
          tipo: form.tipo, ano: form.ano, published: form.published, pdf_path,
        }).eq("id", editItem.id);
        if (error) throw error;
        toast({ title: "Diploma actualizado" });
      } else {
        const { error } = await supabase.from("legislation").insert({
          num: form.num, slug, titulo: form.titulo, descricao: form.descricao || null,
          tipo: form.tipo, ano: form.ano, published: form.published, pdf_path,
        });
        if (error) throw error;
        toast({ title: "Diploma criado" });
      }
      setOpen(false); resetForm(); fetchData();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const item = items.find((i) => i.id === deleteId);
    if (item?.pdf_path) {
      await supabase.storage.from("legislation").remove([item.pdf_path]);
    }
    const { error } = await supabase.from("legislation").delete().eq("id", deleteId);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Diploma eliminado" }); setDeleteId(null); fetchData();
  };

  const publicUrl = (path: string) => supabase.storage.from("legislation").getPublicUrl(path).data.publicUrl;

  return (
    <div className="space-y-6">
      <AdminPageHeader icon={ScrollText} title="Gestão de Legislação" description="Diplomas e regulamentos do sector veterinário">
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Novo Diploma</Button>
      </AdminPageHeader>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle className="font-serif">{editItem ? "Editar Diploma" : "Novo Diploma"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div><Label>Número</Label><Input value={form.num} onChange={(e) => setForm({ ...form, num: e.target.value })} placeholder="Ex: 01" required /></div>
              <div>
                <Label>Tipo</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                  {tipos.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div><Label>Ano</Label><Input value={form.ano} onChange={(e) => setForm({ ...form, ano: e.target.value })} placeholder="2024" required /></div>
            </div>
            <div><Label>Título</Label><Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} required /></div>
            <div><Label>Descrição</Label><Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} rows={3} /></div>
            <div>
              <Label>Ficheiro PDF {editItem?.pdf_path && <span className="text-xs text-muted-foreground">(deixar vazio para manter)</span>}</Label>
              <Input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              {editItem?.pdf_path && !file && (
                <a href={publicUrl(editItem.pdf_path)} target="_blank" rel="noreferrer" className="text-xs text-primary inline-flex items-center gap-1 mt-1">
                  <ExternalLink className="h-3 w-3" /> Ver PDF actual
                </a>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.published} onCheckedChange={(v) => setForm({ ...form, published: v })} />
              <Label>Publicado no portal público</Label>
            </div>
            <Button type="submit" className="w-full" disabled={uploading}>
              {uploading ? "A guardar..." : editItem ? "Guardar Alterações" : "Criar Diploma"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} onConfirm={handleDelete} />

      <AdminCard title="Diplomas" icon={ScrollText} loading={loading} isEmpty={items.length === 0} emptyMessage="Nenhum diploma registado.">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Nº</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Ano</TableHead>
              <TableHead>PDF</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-24">Acções</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((it) => (
              <TableRow key={it.id}>
                <TableCell className="font-mono text-xs">{it.num}</TableCell>
                <TableCell className="font-medium">{it.titulo}</TableCell>
                <TableCell>{it.tipo}</TableCell>
                <TableCell>{it.ano}</TableCell>
                <TableCell>
                  {it.pdf_path ? (
                    <a href={publicUrl(it.pdf_path)} target="_blank" rel="noreferrer" className="text-primary inline-flex items-center gap-1 text-xs">
                      <FileUp className="h-3 w-3" /> Ver
                    </a>
                  ) : <span className="text-xs text-muted-foreground">—</span>}
                </TableCell>
                <TableCell>
                  <span className={`text-xs px-2 py-1 rounded-full ${it.published ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {it.published ? "Publicado" : "Rascunho"}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(it)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(it.id)}><Trash2 className="h-4 w-4" /></Button>
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
