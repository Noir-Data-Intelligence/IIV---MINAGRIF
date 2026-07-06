import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Paperclip, Upload, FileText, Download, X, Plus } from "lucide-react";

interface Props { processId: string }

interface Attachment {
  id: string; process_id: string; label: string;
  file_path: string | null; document_id: string | null;
  uploaded_by: string | null; created_at: string;
  document?: { id: string; title: string; current_version_id: string | null } | null;
}

interface DocOption { id: string; title: string }

export function ProcessAttachmentsPanel({ processId }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"document" | "upload">("document");
  const [docOptions, setDocOptions] = useState<DocOption[]>([]);
  const [selectedDoc, setSelectedDoc] = useState("");
  const [label, setLabel] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchAll = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("process_attachments")
      .select("*, document:documents(id, title, current_version_id)")
      .eq("process_id", processId)
      .order("created_at", { ascending: false });
    setItems((data ?? []) as any);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
    supabase.from("documents").select("id, title").order("title").limit(100)
      .then(({ data }) => setDocOptions((data ?? []) as DocOption[]));
    // eslint-disable-next-line
  }, [processId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      if (mode === "document") {
        if (!selectedDoc) throw new Error("Seleccione um documento");
        const doc = docOptions.find(d => d.id === selectedDoc);
        await supabase.from("process_attachments").insert({
          process_id: processId, document_id: selectedDoc,
          label: label.trim() || doc?.title || "Documento", uploaded_by: user.id,
        });
      } else {
        if (!file || !label.trim()) throw new Error("Ficheiro e descrição obrigatórios");
        const path = `processes/${processId}/${Date.now()}_${file.name}`;
        const { error: upErr } = await supabase.storage.from("documents").upload(path, file);
        if (upErr) throw upErr;
        await supabase.from("process_attachments").insert({
          process_id: processId, file_path: path, label: label.trim(), uploaded_by: user.id,
        });
      }
      toast({ title: "Anexo adicionado" });
      setOpen(false); setSelectedDoc(""); setLabel(""); setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      fetchAll();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async (a: Attachment) => {
    let path = a.file_path;
    if (!path && a.document?.current_version_id) {
      const { data: v } = await supabase.from("document_versions")
        .select("file_path").eq("id", a.document.current_version_id).maybeSingle();
      path = v?.file_path ?? null;
    }
    if (!path) { toast({ title: "Ficheiro indisponível", variant: "destructive" }); return; }
    const { data } = await supabase.storage.from("documents").createSignedUrl(path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  const handleRemove = async (a: Attachment) => {
    if (a.file_path && !a.document_id) {
      await supabase.storage.from("documents").remove([a.file_path]);
    }
    await supabase.from("process_attachments").delete().eq("id", a.id);
    fetchAll();
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold flex items-center gap-2">
          <Paperclip className="h-4 w-4" /> Anexos do processo
        </p>
        <Button size="sm" variant="outline" className="gap-1" onClick={() => setOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> Anexar
        </Button>
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground">A carregar…</p>
      ) : items.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">Sem anexos.</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map(a => (
            <li key={a.id} className="flex items-center justify-between gap-2 text-sm bg-muted/30 rounded px-2 py-1.5">
              <span className="flex items-center gap-2 truncate">
                <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="truncate">{a.label}</span>
                {a.document_id && <span className="text-[10px] text-muted-foreground">(da Gestão Documental)</span>}
              </span>
              <span className="flex gap-1 shrink-0">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDownload(a)}>
                  <Download className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleRemove(a)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adicionar anexo</DialogTitle></DialogHeader>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="flex gap-2">
              <Button type="button" size="sm" variant={mode === "document" ? "default" : "outline"} onClick={() => setMode("document")}>
                Documento existente
              </Button>
              <Button type="button" size="sm" variant={mode === "upload" ? "default" : "outline"} onClick={() => setMode("upload")}>
                Carregar ficheiro
              </Button>
            </div>

            {mode === "document" ? (
              <div>
                <Label>Documento</Label>
                <Select value={selectedDoc} onValueChange={setSelectedDoc}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar documento" /></SelectTrigger>
                  <SelectContent>
                    {docOptions.map(d => <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div>
                <Label>Ficheiro *</Label>
                <Input ref={fileRef} type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              </div>
            )}

            <div>
              <Label>Descrição</Label>
              <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex.: Parecer técnico" />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving} className="gap-2">
                <Upload className="h-4 w-4" />{saving ? "A guardar…" : "Anexar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
