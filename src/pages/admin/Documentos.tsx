import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { TablePagination } from "@/components/admin/TablePagination";
import { RowActions } from "@/components/admin/RowActions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { usePagination } from "@/hooks/usePagination";
import { useDebounce } from "@/hooks/useDebounce";
import {
  FileStack, Plus, Upload, Download, Trash2, History, Send, CheckCircle2,
  XCircle, Eye, Calendar, AlertCircle, FileText,
} from "lucide-react";
import { DocumentPermissionsPanel } from "@/components/admin/DocumentPermissionsPanel";

interface DocCategory { id: string; name: string; icon: string | null }
interface Doc {
  id: string; title: string; description: string | null;
  category_id: string | null; owner_id: string;
  status: "rascunho"|"submetido"|"aprovado"|"rejeitado"|"arquivado";
  visibility: "publico"|"departamento"|"privado";
  expiry_date: string | null; tags: string[];
  current_version_id: string | null;
  created_at: string; updated_at: string;
}
interface DocVersion {
  id: string; document_id: string; version_number: number;
  file_path: string; file_size: number | null; mime_type: string | null;
  change_notes: string | null; created_at: string; uploaded_by: string;
}

const statusVariant: Record<string, "default"|"secondary"|"destructive"|"outline"> = {
  rascunho: "outline", submetido: "secondary", aprovado: "default",
  rejeitado: "destructive", arquivado: "outline",
};

const statusLabel: Record<string, string> = {
  rascunho: "Rascunho", submetido: "Submetido", aprovado: "Aprovado",
  rejeitado: "Rejeitado", arquivado: "Arquivado",
};

export default function Documentos() {
  const { user } = useAuth();
  const { toast } = useToast();
  const pag = usePagination(20);

  const [items, setItems] = useState<Doc[]>([]);
  const [categories, setCategories] = useState<DocCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const dSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [catFilter, setCatFilter] = useState<string>("todas");

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", category_id: "", visibility: "publico",
    expiry_date: "", tags: "", change_notes: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [viewDoc, setViewDoc] = useState<Doc | null>(null);
  const [versions, setVersions] = useState<DocVersion[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewMime, setPreviewMime] = useState<string | null>(null);
  const [newVerFile, setNewVerFile] = useState<File | null>(null);
  const [newVerNotes, setNewVerNotes] = useState("");
  const [uploadingVer, setUploadingVer] = useState(false);
  const newVerInputRef = useRef<HTMLInputElement>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchCategories = async () => {
    const { data } = await supabase.from("document_categories").select("*").order("sort_order");
    setCategories(data ?? []);
  };

  const fetchData = async () => {
    setLoading(true);
    let q = supabase.from("documents").select("*", { count: "exact" })
      .order("updated_at", { ascending: false });
    if (statusFilter !== "todos") q = q.eq("status", statusFilter as any);
    if (catFilter !== "todas") q = q.eq("category_id", catFilter);
    if (dSearch.trim()) {
      const s = `%${dSearch.trim()}%`;
      q = q.or(`title.ilike.${s},description.ilike.${s}`);
    }
    const { data, count, error } = await q.range(pag.from, pag.to);
    if (error) toast({ title: "Erro ao carregar", description: error.message, variant: "destructive" });
    setItems((data ?? []) as Doc[]);
    pag.setTotal(count ?? 0);
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchData(); }, [pag.page, pag.pageSize, dSearch, statusFilter, catFilter]);

  const resetForm = () => {
    setForm({ title: "", description: "", category_id: "", visibility: "publico",
      expiry_date: "", tags: "", change_notes: "" });
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const openCreate = () => { resetForm(); setOpen(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.title.trim() || !file) {
      toast({ title: "Campos obrigatórios", description: "Título e ficheiro são obrigatórios.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      // 1) Insert document
      const tags = form.tags.split(",").map(t => t.trim()).filter(Boolean);
      const { data: doc, error: dErr } = await supabase.from("documents").insert({
        title: form.title.trim(),
        description: form.description.trim() || null,
        category_id: form.category_id || null,
        owner_id: user.id,
        visibility: form.visibility as any,
        expiry_date: form.expiry_date || null,
        tags,
        status: "rascunho",
      }).select().single();
      if (dErr) throw dErr;

      // 2) Upload file
      const ext = file.name.split(".").pop() || "bin";
      const path = `${user.id}/${doc.id}/v1.${ext}`;
      const { error: upErr } = await supabase.storage.from("documents")
        .upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;

      // 3) Insert version
      const { data: ver, error: vErr } = await supabase.from("document_versions").insert({
        document_id: doc.id,
        version_number: 1,
        file_path: path,
        file_size: file.size,
        mime_type: file.type,
        uploaded_by: user.id,
        change_notes: form.change_notes.trim() || "Versão inicial",
      }).select().single();
      if (vErr) throw vErr;

      // 4) Update current_version_id
      await supabase.from("documents").update({ current_version_id: ver.id }).eq("id", doc.id);

      // 5) Activity log
      await supabase.from("activity_logs").insert({
        user_id: user.id, action: "create", entity_type: "document", entity_id: doc.id,
        details: { title: form.title },
      });

      toast({ title: "Documento criado", description: form.title });
      setOpen(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleView = async (doc: Doc) => {
    setViewDoc(doc);
    setPreviewUrl(null); setPreviewMime(null);
    const { data: vs } = await supabase.from("document_versions")
      .select("*").eq("document_id", doc.id).order("version_number", { ascending: false });
    const list = (vs ?? []) as DocVersion[];
    setVersions(list);
    const current = list.find(v => v.id === doc.current_version_id) ?? list[0];
    if (current) {
      const { data: signed } = await supabase.storage.from("documents")
        .createSignedUrl(current.file_path, 600);
      if (signed?.signedUrl) {
        setPreviewUrl(signed.signedUrl);
        setPreviewMime(current.mime_type ?? null);
      }
    }
  };

  const uploadNewVersion = async () => {
    if (!viewDoc || !user || !newVerFile) return;
    setUploadingVer(true);
    try {
      const nextNum = (versions[0]?.version_number ?? 0) + 1;
      const ext = newVerFile.name.split(".").pop() || "bin";
      const path = `${user.id}/${viewDoc.id}/v${nextNum}.${ext}`;
      const { error: upErr } = await supabase.storage.from("documents")
        .upload(path, newVerFile, { contentType: newVerFile.type });
      if (upErr) throw upErr;
      const { data: ver, error: vErr } = await supabase.from("document_versions").insert({
        document_id: viewDoc.id, version_number: nextNum, file_path: path,
        file_size: newVerFile.size, mime_type: newVerFile.type,
        uploaded_by: user.id, change_notes: newVerNotes.trim() || `Versão ${nextNum}`,
      }).select().single();
      if (vErr) throw vErr;
      await supabase.from("documents").update({
        current_version_id: ver.id, status: "rascunho", updated_at: new Date().toISOString(),
      }).eq("id", viewDoc.id);
      await supabase.from("activity_logs").insert({
        user_id: user.id, action: "new_version", entity_type: "document",
        entity_id: viewDoc.id, details: { version: nextNum },
      });
      toast({ title: `Versão ${nextNum} carregada` });
      setNewVerFile(null); setNewVerNotes("");
      if (newVerInputRef.current) newVerInputRef.current.value = "";
      handleView(viewDoc);
      fetchData();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setUploadingVer(false);
    }
  };

  const handleDownload = async (path: string, label: string) => {
    const { data, error } = await supabase.storage.from("documents")
      .createSignedUrl(path, 300);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    window.open(data.signedUrl, "_blank");
    toast({ title: "Download iniciado", description: label });
  };

  const updateStatus = async (doc: Doc, status: Doc["status"]) => {
    const patch: any = { status };
    if (status === "aprovado" || status === "rejeitado") {
      patch.reviewer_id = user?.id;
      patch.reviewed_at = new Date().toISOString();
    }
    const { error } = await supabase.from("documents").update(patch).eq("id", doc.id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    await supabase.from("activity_logs").insert({
      user_id: user!.id, action: `status:${status}`, entity_type: "document", entity_id: doc.id,
    });
    // Notifications
    if (status === "submetido") {
      const { data: gestores } = await supabase.from("user_roles").select("user_id").in("role", ["admin", "gestor"]);
      const ids = Array.from(new Set((gestores ?? []).map((g: any) => g.user_id).filter((u: string) => u !== user?.id)));
      if (ids.length) {
        await supabase.from("notifications").insert(ids.map(uid => ({
          user_id: uid, title: "Documento para aprovação",
          message: doc.title, link: `/admin/documentos`, type: "info" as const,
        })));
      }
    } else if (status === "aprovado" || status === "rejeitado") {
      if (doc.owner_id !== user?.id) {
        await supabase.from("notifications").insert({
          user_id: doc.owner_id,
          title: `Documento ${status}`, message: doc.title,
          link: `/admin/documentos`, type: (status === "aprovado" ? "success" : "warning") as any,
        });
      }
    }
    toast({ title: "Estado actualizado", description: statusLabel[status] });
    fetchData();
    if (viewDoc?.id === doc.id) setViewDoc({ ...viewDoc, ...patch });
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("documents").delete().eq("id", deleteId);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Documento eliminado" });
    setDeleteId(null);
    fetchData();
  };

  const categoryName = (id: string | null) => categories.find(c => c.id === id)?.name ?? "—";

  const expiringSoon = (date: string | null) => {
    if (!date) return false;
    const d = new Date(date).getTime();
    const now = Date.now();
    const days = (d - now) / (1000 * 60 * 60 * 24);
    return days >= 0 && days <= 30;
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={FileStack}
        title="Gestão Documental"
        description="Repositório institucional com versões, permissões e aprovação."
      >
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Novo documento
        </Button>
      </AdminPageHeader>

      <AdminCard>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <Input
            placeholder="Pesquisar por título ou descrição…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:max-w-sm"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="sm:w-[180px]"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os estados</SelectItem>
              {Object.entries(statusLabel).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger className="sm:w-[200px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas categorias</SelectItem>
              {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <AdminCard loading />
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            Nenhum documento encontrado.
          </div>
        ) : (
          <div className="rounded-lg border border-border/40 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Título</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead>Actualizado</TableHead>
                  <TableHead className="text-right">Acções</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((d) => (
                  <TableRow key={d.id} className="cursor-pointer" onClick={() => handleView(d)}>
                    <TableCell className="font-medium max-w-[280px]">
                      <div className="truncate">{d.title}</div>
                      {d.tags.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {d.tags.slice(0, 3).map(t => (
                            <Badge key={t} variant="outline" className="text-[10px] h-4 px-1">{t}</Badge>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{categoryName(d.category_id)}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[d.status]}>{statusLabel[d.status]}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {d.expiry_date ? (
                        <span className={expiringSoon(d.expiry_date) ? "text-destructive flex items-center gap-1" : ""}>
                          {expiringSoon(d.expiry_date) && <AlertCircle className="h-3.5 w-3.5" />}
                          {new Date(d.expiry_date).toLocaleDateString("pt-PT")}
                        </span>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(d.updated_at).toLocaleDateString("pt-PT")}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <RowActions
                        primary={{ label: "Ver", icon: Eye, onClick: () => handleView(d) }}
                        actions={[
                          { label: "Submeter para aprovação", icon: Send, onClick: () => updateStatus(d, "submetido"), hidden: d.status !== "rascunho" },
                          { label: "Aprovar", icon: CheckCircle2, onClick: () => updateStatus(d, "aprovado"), hidden: d.status !== "submetido" },
                          { label: "Rejeitar", icon: XCircle, onClick: () => updateStatus(d, "rejeitado"), hidden: d.status !== "submetido" },
                          { label: "Arquivar", icon: History, onClick: () => updateStatus(d, "arquivado"), hidden: d.status === "arquivado" || d.status === "rascunho" },
                          { label: "Eliminar", icon: Trash2, onClick: () => setDeleteId(d.id), destructive: true, hidden: d.owner_id !== user?.id },
                        ]}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <TablePagination
          page={pag.page} pageSize={pag.pageSize} total={pag.total} totalPages={pag.totalPages}
          canPrev={pag.canPrev} canNext={pag.canNext}
          onPageChange={pag.setPage} onPageSizeChange={pag.setPageSize}
        />
      </AdminCard>

      {/* Create dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Novo documento</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Título *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Categoria</Label>
                <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Visibilidade</Label>
                <Select value={form.visibility} onValueChange={(v) => setForm({ ...form, visibility: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="publico">Público (todos autenticados após aprovação)</SelectItem>
                    <SelectItem value="departamento">Departamento</SelectItem>
                    <SelectItem value="privado">Privado (apenas autor + permissões)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Data de validade</Label>
                <Input type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} />
              </div>
              <div>
                <Label>Tags (separadas por vírgula)</Label>
                <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="qualidade, iso, 2026" />
              </div>
            </div>
            <div>
              <Label>Ficheiro *</Label>
              <Input ref={fileInputRef} type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} required />
              {file && <p className="text-xs text-muted-foreground mt-1">{file.name} · {(file.size / 1024).toFixed(0)} KB</p>}
            </div>
            <div>
              <Label>Notas da versão</Label>
              <Input value={form.change_notes} onChange={(e) => setForm({ ...form, change_notes: e.target.value })} placeholder="Versão inicial" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving} className="gap-2">
                <Upload className="h-4 w-4" />{saving ? "A guardar…" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View dialog */}
      <Dialog open={!!viewDoc} onOpenChange={(o) => !o && setViewDoc(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {viewDoc && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileStack className="h-5 w-5" /> {viewDoc.title}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Categoria</p>
                    <p className="font-medium">{categoryName(viewDoc.category_id)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Estado</p>
                    <Badge variant={statusVariant[viewDoc.status]}>{statusLabel[viewDoc.status]}</Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Visibilidade</p>
                    <p className="font-medium capitalize">{viewDoc.visibility}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" />Validade</p>
                    <p className="font-medium">{viewDoc.expiry_date ? new Date(viewDoc.expiry_date).toLocaleDateString("pt-PT") : "—"}</p>
                  </div>
                </div>

                {viewDoc.description && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Descrição</p>
                    <p className="text-sm">{viewDoc.description}</p>
                  </div>
                )}

                {viewDoc.tags.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {viewDoc.tags.map(t => <Badge key={t} variant="outline">{t}</Badge>)}
                  </div>
                )}

                {previewUrl && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" /> Pré-visualização
                    </h4>
                    {previewMime?.startsWith("image/") ? (
                      <img src={previewUrl} alt={viewDoc.title} className="max-h-[400px] rounded border border-border/40 mx-auto" />
                    ) : previewMime === "application/pdf" ? (
                      <iframe src={previewUrl} title={viewDoc.title} className="w-full h-[420px] rounded border border-border/40" />
                    ) : (
                      <div className="rounded border border-border/40 p-4 text-sm text-muted-foreground bg-muted/30">
                        Pré-visualização não suportada para este formato. Use o botão "Descarregar".
                      </div>
                    )}
                  </div>
                )}

                <div className="rounded-lg border border-border/40 p-3 bg-muted/20">
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <Upload className="h-4 w-4" /> Nova versão
                  </h4>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input ref={newVerInputRef} type="file" onChange={(e) => setNewVerFile(e.target.files?.[0] ?? null)} className="flex-1" />
                    <Input placeholder="Notas da versão (opcional)" value={newVerNotes} onChange={(e) => setNewVerNotes(e.target.value)} className="flex-1" />
                    <Button size="sm" onClick={uploadNewVersion} disabled={!newVerFile || uploadingVer} className="gap-1">
                      <Upload className="h-3.5 w-3.5" /> {uploadingVer ? "A carregar…" : "Carregar"}
                    </Button>
                  </div>
                </div>

                <DocumentPermissionsPanel documentId={viewDoc.id} />

                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <History className="h-4 w-4" /> Histórico de versões
                  </h4>
                  <div className="rounded-lg border border-border/40">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/40">
                          <TableHead>Versão</TableHead>
                          <TableHead>Notas</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Tamanho</TableHead>
                          <TableHead className="text-right">Acção</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {versions.map(v => (
                          <TableRow key={v.id}>
                            <TableCell><Badge variant="outline">v{v.version_number}</Badge></TableCell>
                            <TableCell className="text-sm">{v.change_notes ?? "—"}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(v.created_at).toLocaleString("pt-PT")}
                            </TableCell>
                            <TableCell className="text-sm">{v.file_size ? `${(v.file_size / 1024).toFixed(0)} KB` : "—"}</TableCell>
                            <TableCell className="text-right">
                              <Button size="sm" variant="outline" onClick={() => handleDownload(v.file_path, `v${v.version_number}`)} className="gap-1">
                                <Download className="h-3.5 w-3.5" /> Descarregar
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-4 border-t">
                  {viewDoc.status === "rascunho" && (
                    <Button size="sm" variant="default" className="gap-1" onClick={() => updateStatus(viewDoc, "submetido")}>
                      <Send className="h-3.5 w-3.5" /> Submeter
                    </Button>
                  )}
                  {viewDoc.status === "submetido" && (
                    <>
                      <Button size="sm" className="gap-1" onClick={() => updateStatus(viewDoc, "aprovado")}>
                        <CheckCircle2 className="h-3.5 w-3.5" /> Aprovar
                      </Button>
                      <Button size="sm" variant="destructive" className="gap-1" onClick={() => updateStatus(viewDoc, "rejeitado")}>
                        <XCircle className="h-3.5 w-3.5" /> Rejeitar
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar documento?"
        description="Esta acção é permanente e remove todas as versões."
      />
    </div>
  );
}
