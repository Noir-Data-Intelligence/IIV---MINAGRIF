import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Paperclip, Upload, FileText, Download, X, Plus } from "lucide-react";
import { useDocumentosList } from "@/hooks/queries/useDocumentos";
import {
  useCreateProcessAttachment,
  useDeleteProcessAttachment,
  useProcessAttachments,
} from "@/hooks/queries/useProcesses";
import type { ProcessAttachmentDto } from "@/types/dto/processAttachment";

interface Props {
  processId: string;
}

/**
 * Painel de anexos de um processo. Migrado de Supabase para a camada mock (MSW):
 * usa o sub-recurso `processAttachments` (fixtures + handler `.../processos/:id/anexos`)
 * e reutiliza a lista de `documentos` para o selector de anexação.
 *
 * Permite anexar um documento existente (da Gestão Documental) OU carregar um
 * ficheiro directamente — o upload é SIMULADO (gera-se um `filePath`/metadados
 * fictícios, sem storage real), à semelhança do módulo Documentos. O download é
 * igualmente simulado. Usado apenas por `ProcessoDetalhe` (que regista o
 * namespace i18n `admin-processo-detalhe`).
 */
export function ProcessAttachmentsPanel({ processId }: Props) {
  const { t } = useTranslation("admin-processo-detalhe");
  const { toast } = useToast();
  const { user } = useAuth();

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"document" | "upload">("document");
  const [selectedDoc, setSelectedDoc] = useState("");
  const [label, setLabel] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: items = [], isLoading: loading } = useProcessAttachments(processId);
  const { data: docsPage } = useDocumentosList({ page: 1, perPage: 100 });
  const docOptions = useMemo(() => docsPage?.data ?? [], [docsPage]);

  const createAttachment = useCreateProcessAttachment(processId);
  const deleteAttachment = useDeleteProcessAttachment(processId);
  const saving = createAttachment.isPending;

  const resetForm = () => {
    setSelectedDoc("");
    setLabel("");
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mode === "document") {
        if (!selectedDoc) throw new Error(t("toast.selectDocument"));
        const doc = docOptions.find((d) => d.id === selectedDoc);
        await createAttachment.mutateAsync({
          documentId: selectedDoc,
          label: label.trim() || doc?.title || t("sections.attachments"),
          uploadedBy: user?.id ?? null,
        });
      } else {
        if (!file || !label.trim()) throw new Error(t("toast.fileRequired"));
        // Upload simulado: gera metadados fictícios (sem storage real).
        await createAttachment.mutateAsync({
          filePath: `processes/${processId}/${Date.now()}_${file.name}`,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type || null,
          label: label.trim(),
          uploadedBy: user?.id ?? null,
        });
      }
      toast({ title: t("toast.attachmentAdded") });
      setOpen(false);
      resetForm();
    } catch (err) {
      toast({
        title: t("toast.error"),
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    }
  };

  const handleDownload = (a: ProcessAttachmentDto) => {
    // Simulação — não há storage real nesta demonstração.
    toast({ title: t("toast.downloadSimulated"), description: a.label });
  };

  const handleRemove = async (a: ProcessAttachmentDto) => {
    try {
      await deleteAttachment.mutateAsync(a.id);
      toast({ title: t("toast.attachmentRemoved") });
    } catch (err) {
      toast({
        title: t("toast.error"),
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold flex items-center gap-2">
          <Paperclip className="h-4 w-4" /> {t("attachments.title")}
        </p>
        <Button size="sm" variant="outline" className="gap-1" onClick={() => setOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> {t("attachments.add")}
        </Button>
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground">{t("attachments.loading")}</p>
      ) : items.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">{t("attachments.empty")}</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between gap-2 text-sm bg-muted/30 rounded-md px-2.5 py-2"
            >
              <span className="flex items-center gap-2 truncate">
                <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="truncate">{a.label}</span>
                {a.documentId && (
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {t("attachments.fromDocs")}
                  </span>
                )}
              </span>
              <span className="flex gap-1 shrink-0">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => handleDownload(a)}
                >
                  <Download className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-destructive"
                  onClick={() => handleRemove(a)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("attachments.dialogTitle")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={mode === "document" ? "default" : "outline"}
                onClick={() => setMode("document")}
              >
                {t("attachments.modeDocument")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant={mode === "upload" ? "default" : "outline"}
                onClick={() => setMode("upload")}
              >
                {t("attachments.modeUpload")}
              </Button>
            </div>

            {mode === "document" ? (
              <div className="space-y-1.5">
                <Label>{t("attachments.documentLabel")}</Label>
                <Select value={selectedDoc} onValueChange={setSelectedDoc}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("attachments.documentPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {docOptions.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        {t("attachments.noResults")}
                      </div>
                    ) : (
                      docOptions.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.title}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label>{t("attachments.fileLabel")}</Label>
                <Input
                  ref={fileRef}
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label>{t("attachments.descriptionLabel")}</Label>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder={t("attachments.descriptionPlaceholder")}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                {t("attachments.cancel")}
              </Button>
              <Button type="submit" disabled={saving} className="gap-2">
                <Upload className="h-4 w-4" />
                {saving ? t("attachments.submitting") : t("attachments.submit")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
