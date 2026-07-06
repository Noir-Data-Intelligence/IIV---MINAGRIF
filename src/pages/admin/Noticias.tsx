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
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { usePagination } from "@/hooks/usePagination";
import { Plus, Newspaper, Pencil, Trash2, ExternalLink, Star } from "lucide-react";

interface Noticia {
  id: string;
  slug: string;
  titulo: string;
  resumo: string | null;
  conteudo: string | null;
  categoria: string;
  image_path: string | null;
  destaque: boolean;
  published: boolean;
  published_at: string | null;
  created_at: string;
}

const categorias = ["Geral", "Vacinação", "Infraestrutura", "Parcerias", "Vigilância", "Formação", "Investigação", "Eventos"];

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 90);
}

export default function NoticiasAdmin() {
  const [items, setItems] = useState<Noticia[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<Noticia | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    titulo: "", resumo: "", conteudo: "", categoria: "Geral",
    destaque: false, published: true, published_at: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();
  const pag = usePagination(20);

  const fetchData = async () => {
    setLoading(true);
    const { data, count } = await supabase
      .from("noticias")
      .select("*", { count: "exact" })
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .range(pag.from, pag.to);
    setItems(data ?? []);
    pag.setTotal(count ?? 0);
    setLoading(false);
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [pag.page, pag.pageSize]);

  const resetForm = () => {
    setForm({ titulo: "", resumo: "", conteudo: "", categoria: "Geral", destaque: false, published: true, published_at: new Date().toISOString().slice(0, 10) });
    setFile(null);
    setEditItem(null);
  };

  const openCreate = () => { resetForm(); setOpen(true); };
  const openEdit = (it: Noticia) => {
    setEditItem(it);
    setForm({
      titulo: it.titulo, resumo: it.resumo ?? "", conteudo: it.conteudo ?? "",
      categoria: it.categoria, destaque: it.destaque, published: it.published,
      published_at: (it.published_at ?? it.created_at).slice(0, 10),
    });
    setFile(null);
    setOpen(true);
  };

  const uploadImage = async (slug: string): Promise<string | null> => {
    if (!file) return null;
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${slug}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("noticias").upload(path, file, { contentType: file.type, upsert: true });
    if (error) throw error;
    return path;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const slug = editItem?.slug || `${slugify(form.titulo)}-${Math.random().toString(36).slice(2, 6)}`;
      let image_path = editItem?.image_path ?? null;
      if (file) image_path = await uploadImage(slug);

      const { data: { user } } = await supabase.auth.getUser();
      const payload = {
        titulo: form.titulo,
        resumo: form.resumo || null,
        conteudo: form.conteudo || null,
        categoria: form.categoria,
        destaque: form.destaque,
        published: form.published,
        published_at: form.published_at ? new Date(form.published_at).toISOString() : null,
        image_path,
      };

      if (editItem) {
        const { error } = await supabase.from("noticias").update(payload).eq("id", editItem.id);
        if (error) throw error;
        toast({ title: "Notícia actualizada" });
      } else {
        const { error } = await supabase.from("noticias").insert({ ...payload, slug, author_id: user?.id });
        if (error) throw error;
        toast({ title: "Notícia criada" });
      }
      setOpen(false); resetForm(); fetchData();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const item = items.find((i) => i.id === deleteId);
    if (item?.image_path) await supabase.storage.from("noticias").remove([item.image_path]);
    const { error } = await supabase.from("noticias").delete().eq("id", deleteId);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Notícia eliminada" }); setDeleteId(null); fetchData();
  };

  const togglePublish = async (it: Noticia) => {
    const { error } = await supabase.from("noticias").update({
      published: !it.published,
      published_at: !it.published && !it.published_at ? new Date().toISOString() : it.published_at,
    }).eq("id", it.id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    fetchData();
  };

  const imageUrl = (path: string) => supabase.storage.from("noticias").getPublicUrl(path).data.publicUrl;

  return (
    <div className="space-y-6">
      <AdminPageHeader icon={Newspaper} title="Gestão de Notícias" description="Crie, edite e publique notícias no portal público">
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Nova Notícia</Button>
      </AdminPageHeader>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-serif">{editItem ? "Editar Notícia" : "Nova Notícia"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>Título *</Label><Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} required /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Categoria</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
                  {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div><Label>Data de publicação</Label><Input type="date" value={form.published_at} onChange={(e) => setForm({ ...form, published_at: e.target.value })} /></div>
            </div>
            <div><Label>Resumo</Label><Textarea value={form.resumo} onChange={(e) => setForm({ ...form, resumo: e.target.value })} rows={2} placeholder="Resumo curto exibido no portal" /></div>
            <div><Label>Conteúdo</Label><Textarea value={form.conteudo} onChange={(e) => setForm({ ...form, conteudo: e.target.value })} rows={10} placeholder="Texto completo da notícia (parágrafos separados por linha em branco)" /></div>
            <div>
              <Label>Imagem de capa {editItem?.image_path && <span className="text-xs text-muted-foreground">(deixar vazio para manter)</span>}</Label>
              <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              {editItem?.image_path && !file && (
                <img src={imageUrl(editItem.image_path)} alt="" className="mt-2 h-32 rounded-md object-cover" />
              )}
            </div>
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={form.published} onCheckedChange={(v) => setForm({ ...form, published: v })} />
                <Label>Publicada</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.destaque} onCheckedChange={(v) => setForm({ ...form, destaque: v })} />
                <Label>Destaque</Label>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? "A guardar..." : editItem ? "Guardar Alterações" : "Criar Notícia"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} onConfirm={handleDelete} />

      <AdminCard title="Notícias" icon={Newspaper} loading={loading} isEmpty={items.length === 0} emptyMessage="Nenhuma notícia registada.">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Capa</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-32">Acções</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((it) => (
              <TableRow key={it.id}>
                <TableCell>
                  {it.image_path
                    ? <img src={imageUrl(it.image_path)} alt="" className="h-10 w-14 rounded object-cover" />
                    : <div className="h-10 w-14 rounded bg-muted" />}
                </TableCell>
                <TableCell className="max-w-sm">
                  <div className="font-medium flex items-center gap-2">
                    {it.destaque && <Star className="h-3.5 w-3.5 text-[hsl(var(--iiv-gold))] fill-current" />}
                    {it.titulo}
                  </div>
                  <div className="text-xs text-muted-foreground line-clamp-1">{it.resumo}</div>
                </TableCell>
                <TableCell><Badge variant="outline">{it.categoria}</Badge></TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {it.published_at ? new Date(it.published_at).toLocaleDateString("pt-AO") : "—"}
                </TableCell>
                <TableCell>
                  <button onClick={() => togglePublish(it)} className="cursor-pointer">
                    <Badge variant={it.published ? "default" : "secondary"}>{it.published ? "Publicada" : "Rascunho"}</Badge>
                  </button>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {it.published && (
                      <Button variant="ghost" size="icon" asChild>
                        <a href={`/noticias/${it.slug}`} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a>
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => openEdit(it)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(it.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
