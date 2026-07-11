import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/useDebounce";
import { FileText, Paperclip, Download, X, Plus } from "lucide-react";
import {
  useDocumentLinks,
  useDocumentosList,
  useCreateDocumentLink,
  useDeleteDocumentLink,
} from "@/hooks/queries/useDocumentos";
import type { DocumentLinkDto } from "@/types/dto/documento";

interface Props {
  entityType: string;
  entityId: string;
}

/**
 * Painel de documentos anexados a uma entidade genérica (auditoria, lote, etc).
 * Assinatura pública inalterada (`entityType`/`entityId`) — usado sem alterações
 * por Auditorias, Lotes, NaoConformidades e Resultados.
 *
 * Migrado de Supabase para a camada mock (MSW): usa o recurso `document-links`
 * (fixtures + handler próprio) e reutiliza a lista de `documentos` para o
 * selector de anexação. O download é simulado (sem storage real).
 */
export function AttachedDocsPanel({ entityType, entityId }: Props) {
  const { toast } = useToast();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dSearch = useDebounce(search, 300);
  const [selected, setSelected] = useState<string>("");

  const { data: items = [], isLoading: loading } = useDocumentLinks(entityType, entityId);
  const { data: docsPage } = useDocumentosList({
    page: 1,
    perPage: 50,
    search: pickerOpen && dSearch.trim() ? dSearch.trim() : undefined,
  });
  const options = useMemo(() => docsPage?.data ?? [], [docsPage]);

  const createLink = useCreateDocumentLink();
  const deleteLink = useDeleteDocumentLink();
  const saving = createLink.isPending;

  const handleAttach = async () => {
    if (!selected) return;
    try {
      await createLink.mutateAsync({ documentId: selected, entityType, entityId });
      toast({ title: "Documento anexado" });
      setSelected("");
      setSearch("");
      setPickerOpen(false);
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Não foi possível anexar.",
        variant: "destructive",
      });
    }
  };

  const handleRemove = async (linkId: string) => {
    try {
      await deleteLink.mutateAsync({ id: linkId, entityType, entityId });
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Não foi possível remover.",
        variant: "destructive",
      });
    }
  };

  const handleDownload = (doc: DocumentLinkDto["document"]) => {
    if (!doc?.currentVersionId) {
      toast({ title: "Sem versão", description: "Documento sem ficheiro disponível.", variant: "destructive" });
      return;
    }
    // Simulação — não há storage real nesta demonstração.
    toast({ title: "Download simulado", description: doc.title });
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
          {items.map((l) => (
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
                  ) : options.map((o) => <SelectItem key={o.id} value={o.id}>{o.title}</SelectItem>)}
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
