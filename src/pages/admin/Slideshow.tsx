import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { TablePagination } from "@/components/admin/TablePagination";
import { useClientPagination } from "@/hooks/useClientPagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Images, Pencil, Trash2, ArrowUp, ArrowDown, ExternalLink } from "lucide-react";

const ALLOWED_HOSTS = ["iiv.gov.ao", "www.iiv.gov.ao"];

/**
 * Normaliza e valida o link do CTA.
 * - Aceita rotas internas relativas (devem começar por "/", "#" ou "?")
 * - Aceita URLs absolutas https:// apenas para domínios autorizados
 * - Rejeita javascript:, data:, file:, protocolos perigosos e domínios externos
 * Devolve a string normalizada ou lança Error com mensagem amigável.
 */
function normalizeCtaLink(raw: string): string {
  const v = (raw ?? "").trim();
  if (!v) throw new Error("O link do botão é obrigatório.");

  // Rejeitar pseudo-protocolos perigosos explicitamente
  if (/^\s*(javascript|data|vbscript|file):/i.test(v)) {
    throw new Error("Protocolo não permitido no link.");
  }

  // Âncoras e query-only são internas
  if (v.startsWith("#") || v.startsWith("?")) return v;

  // Caminhos relativos internos
  if (v.startsWith("/")) {
    // bloquear protocol-relative //evil.com
    if (v.startsWith("//")) throw new Error("Use uma rota interna (ex.: /servicos) ou um domínio autorizado.");
    return v;
  }

  // URLs absolutas — só https e domínios autorizados
  try {
    const url = new URL(v);
    if (url.protocol !== "https:") throw new Error("Apenas links https:// são permitidos.");
    const host = url.hostname.toLowerCase();
    const ok = ALLOWED_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
    if (!ok) {
      throw new Error(`Domínio não autorizado. Permitidos: ${ALLOWED_HOSTS.join(", ")}`);
    }
    return url.toString();
  } catch (e: any) {
    if (e instanceof Error && e.message) throw e;
    throw new Error("Link inválido. Use uma rota interna (ex.: /servicos) ou um URL https autorizado.");
  }
}

interface Slide {
  id: string;
  kicker: string;
  title: string;
  subtitle: string;
  cta_label: string;
  cta_link: string;
  image_path: string | null;
  image_url: string | null;
  sort_order: number;
  published: boolean;
}

const empty = {
  kicker: "", title: "", subtitle: "",
  cta_label: "Saiba mais", cta_link: "/sobre",
  published: true,
};

export default function SlideshowAdmin() {
  const [items, setItems] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<Slide | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(empty);
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();
  const pag = useClientPagination(items);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from("hero_slides").select("*").order("sort_order");
    setItems((data ?? []) as Slide[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => { setForm(empty); setFile(null); setEditItem(null); };
  const openCreate = () => { resetForm(); setOpen(true); };
  const openEdit = (it: Slide) => {
    setEditItem(it);
    setForm({
      kicker: it.kicker, title: it.title, subtitle: it.subtitle,
      cta_label: it.cta_label, cta_link: it.cta_link, published: it.published,
    });
    setFile(null);
    setOpen(true);
  };

  const uploadImage = async (): Promise<{ path: string; url: string } | null> => {
    if (!file) return null;
    const ext = file.name.split(".").pop() || "jpg";
    const path = `slide-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("slideshow").upload(path, file, {
      contentType: file.type || "image/jpeg", upsert: true,
    });
    if (error) throw error;
    const url = supabase.storage.from("slideshow").getPublicUrl(path).data.publicUrl;
    return { path, url };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const cta_link = normalizeCtaLink(form.cta_link);
      const payload = { ...form, cta_link };

      let image_path = editItem?.image_path ?? null;
      let image_url = editItem?.image_url ?? null;
      const uploaded = await uploadImage();
      if (uploaded) { image_path = uploaded.path; image_url = uploaded.url; }

      if (editItem) {
        const { error } = await supabase.from("hero_slides").update({
          ...payload, image_path, image_url,
        }).eq("id", editItem.id);
        if (error) throw error;
        toast({ title: "Slide actualizado" });
      } else {
        const max = items.reduce((m, i) => Math.max(m, i.sort_order), 0);
        const { error } = await supabase.from("hero_slides").insert({
          ...payload, image_path, image_url, sort_order: max + 1,
        });
        if (error) throw error;
        toast({ title: "Slide criado" });
      }
      setOpen(false); resetForm(); fetchData();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const item = items.find((i) => i.id === deleteId);
    if (item?.image_path) await supabase.storage.from("slideshow").remove([item.image_path]);
    const { error } = await supabase.from("hero_slides").delete().eq("id", deleteId);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Slide eliminado" }); setDeleteId(null); fetchData();
  };

  const togglePublished = async (it: Slide) => {
    await supabase.from("hero_slides").update({ published: !it.published }).eq("id", it.id);
    fetchData();
  };

  const move = async (it: Slide, dir: -1 | 1) => {
    const idx = items.findIndex((i) => i.id === it.id);
    const swap = items[idx + dir];
    if (!swap) return;
    await Promise.all([
      supabase.from("hero_slides").update({ sort_order: swap.sort_order }).eq("id", it.id),
      supabase.from("hero_slides").update({ sort_order: it.sort_order }).eq("id", swap.id),
    ]);
    fetchData();
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader icon={Images} title="Slideshow da Home" description="Gerir as imagens e textos do destaque principal do portal público">
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Novo Slide</Button>
      </AdminPageHeader>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle className="font-serif">{editItem ? "Editar Slide" : "Novo Slide"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>Categoria (kicker)</Label><Input value={form.kicker} onChange={(e) => setForm({ ...form, kicker: e.target.value })} required /></div>
            <div><Label>Título</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
            <div><Label>Subtítulo</Label><Textarea value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} rows={2} required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Texto do botão</Label><Input value={form.cta_label} onChange={(e) => setForm({ ...form, cta_label: e.target.value })} required /></div>
              <div>
                <Label>Link do botão</Label>
                <Input value={form.cta_link} onChange={(e) => setForm({ ...form, cta_link: e.target.value })} placeholder="/servicos" required />
                <p className="text-xs text-muted-foreground mt-1">Rota interna (ex.: <code>/servicos</code>) ou URL https de {ALLOWED_HOSTS.join(", ")}.</p>
              </div>
            </div>
            <div>
              <Label>Imagem {editItem?.image_url && <span className="text-xs text-muted-foreground">(deixar vazio para manter)</span>}</Label>
              <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              {editItem?.image_url && !file && (
                <a href={editItem.image_url} target="_blank" rel="noreferrer" className="text-xs text-primary inline-flex items-center gap-1 mt-1">
                  <ExternalLink className="h-3 w-3" /> Ver imagem actual
                </a>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.published} onCheckedChange={(v) => setForm({ ...form, published: v })} />
              <Label>Publicado</Label>
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? "A guardar..." : editItem ? "Guardar Alterações" : "Criar Slide"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} onConfirm={handleDelete} />

      <AdminCard title="Slides" icon={Images} loading={loading} isEmpty={items.length === 0} emptyMessage="Sem slides registados.">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Ordem</TableHead>
              <TableHead className="w-20">Imagem</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-40">Acções</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pag.pageItems.map((it, i) => {
              const idx = pag.from + i;
              return (
              <TableRow key={it.id}>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-xs w-5">{it.sort_order}</span>
                    <Button size="icon" variant="ghost" className="h-6 w-6" disabled={idx === 0} onClick={() => move(it, -1)}><ArrowUp className="h-3 w-3" /></Button>
                    <Button size="icon" variant="ghost" className="h-6 w-6" disabled={idx === items.length - 1} onClick={() => move(it, 1)}><ArrowDown className="h-3 w-3" /></Button>
                  </div>
                </TableCell>
                <TableCell>
                  {it.image_url ? (
                    <img src={it.image_url} alt="" className="h-10 w-16 object-cover rounded" />
                  ) : <span className="text-xs text-muted-foreground">—</span>}
                </TableCell>
                <TableCell className="font-medium">{it.title}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{it.kicker}</TableCell>
                <TableCell>
                  <button onClick={() => togglePublished(it)} className={`text-xs px-2 py-1 rounded-full ${it.published ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {it.published ? "Publicado" : "Rascunho"}
                  </button>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(it)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(it.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <TablePagination
          page={pag.page} pageSize={pag.pageSize} total={pag.total} totalPages={pag.totalPages}
          canPrev={pag.canPrev} canNext={pag.canNext}
          onPageChange={pag.setPage} onPageSizeChange={pag.setPageSize}
        />
      </AdminCard>
    </div>
  );
}
