import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/useDebounce";
import { FileText, Paperclip, Download, X, Plus } from "lucide-react";

interface Props {
  entityType: string;
  entityId: string;
}

interface LinkedDoc {
  id: string; // link id
  document_id: string;
  document?: { id: string; title: string; current_version_id: string | null } | null;
}

interface DocOption {
  id: string;
  title: string;
  current_version_id: string | null;
}

export function AttachedDocsPanel({ entityType, entityId }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<LinkedDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dSearch = useDebounce(search, 300);
  const [options, setOptions] = useState<DocOption[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const fetchLinks = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("document_links")
      .select("id, document_id, document:documents(id, title, current_version_id)")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .order("created_at", { ascending: false });
    setItems((data ?? []) as any);
    setLoading(false);
  };

  const fetchOptions = async () => {
    let q = supabase.from("documents").select("id, title, current_version_id").order("title").limit(50);
    if (dSearch.trim()) q = q.ilike("title", `%${dSearch.trim()}%`);
    const { data } = await q;
    setOptions((data ?? []) as DocOption[]);
  };

  useEffect(() => { fetchLinks(); /* eslint-disable-next-line */ }, [entityType, entityId]);
  useEffect(() => { if (pickerOpen) fetchOptions(); /* eslint-disable-next-line */ }, [pickerOpen, dSearch]);

  const handleAttach = async () => {
    if (!selected || !user) return;
    setSaving(true);
    const { error } = await supabase.from("document_links").insert({
      document_id: selected, entity_type: entityType, entity_id: entityId, created_by: user.id,
    });
    setSaving(false);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Documento anexado" });
    setSelected(""); setSearch(""); setPickerOpen(false);
    fetchLinks();
  };

  const handleRemove = async (linkId: string) => {
    const { error } = await supabase.from("document_links").delete().eq("id", linkId);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    fetchLinks();
  };

  const handleDownload = async (doc: LinkedDoc["document"]) => {
    if (!doc?.current_version_id) {
      toast({ title: "Sem versão", description: "Documento sem ficheiro disponível.", variant: "destructive" });
      return;
    }
    const { data: ver } = await supabase
      .from("document_versions").select("file_path").eq("id", doc.current_version_id).maybeSingle();
    if (!ver?.file_path) return;
    const { data: signed } = await supabase.storage.from("documents").createSignedUrl(ver.file_path, 60);
    if (signed?.signedUrl) window.open(signed.signedUrl, "_blank");
  };

  return (
    <div className="rounded-lg border border-border/50 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Paperclip className="h-3 w-3" /> Documentos anexados
        </p>
        <Button size="sm" variant="outline" className="h-7 gap-1" onClick={() => setPickerOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> Anexar
        </Button>
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground">A carregar…</p>
      ) : items.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">Sem documentos anexados.</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map(l => (
            <li key={l.id} className="flex items-center justify-between gap-2 text-sm bg-muted/30 rounded px-2 py-1.5">
              <span className="flex items-center gap-2 truncate">
                <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="truncate">{l.document?.title ?? "—"}</span>
              </span>
              <span className="flex gap-1 shrink-0">
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleDownload(l.document)}>
                  <Download className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => handleRemove(l.id)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Anexar documento existente</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Pesquisar</Label>
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Título do documento…" />
            </div>
            <div>
              <Label>Documento</Label>
              <Select value={selected} onValueChange={setSelected}>
                <SelectTrigger><SelectValue placeholder="Seleccionar documento" /></SelectTrigger>
                <SelectContent>
                  {options.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">Sem resultados</div>
                  ) : options.map(o => <SelectItem key={o.id} value={o.id}>{o.title}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Para criar um novo documento, vá a Gestão &gt; Documentos.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPickerOpen(false)}>Cancelar</Button>
            <Button onClick={handleAttach} disabled={!selected || saving}>{saving ? "A anexar…" : "Anexar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
