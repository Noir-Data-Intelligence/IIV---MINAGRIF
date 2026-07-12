import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import type { TFunction } from "i18next";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import {
  FileStack, Plus, Upload, Download, Trash2, History, Send, CheckCircle2,
  XCircle, Eye, Calendar, AlertCircle, Pencil, Clock,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { RowActions, type RowAction } from "@/components/admin/RowActions";
import { WriteGuard } from "@/components/WriteGuard";
import { DataTable, DataTableColumnHeader } from "@/components/data-table";
import { EntityFormDialog } from "@/components/EntityFormDialog";
import { DocumentPermissionsPanel } from "@/components/admin/DocumentPermissionsPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useEntityForm } from "@/hooks/useEntityForm";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/format";
import {
  useDocumentosList,
  useDocumentCategories,
  useCreateDocumento,
  useUpdateDocumento,
  useDeleteDocumento,
  useDocVersions,
  useCreateDocVersion,
} from "@/hooks/queries/useDocumentos";
import type { DocStatus, DocumentoDto } from "@/types/dto/documento";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import i18n from "@/i18n";
import ptDocumentos from "@/i18n/locales/pt/admin/documentos.json";
import enDocumentos from "@/i18n/locales/en/admin/documentos.json";

// Namespace autónomo registado em runtime, seguindo o padrão de Resultados.tsx.
if (!i18n.hasResourceBundle("pt", "admin-documentos"))
  i18n.addResourceBundle("pt", "admin-documentos", ptDocumentos, true, true);
if (!i18n.hasResourceBundle("en", "admin-documentos"))
  i18n.addResourceBundle("en", "admin-documentos", enDocumentos, true, true);

// Utilizador "actual" fictício (não há auth real na camada mock) — usado como
// owner/uploader dos documentos e versões criados nesta sessão.
const CURRENT_USER_ID = "usr-0001";

const statusVariant: Record<DocStatus, "default" | "secondary" | "destructive" | "outline"> = {
  rascunho: "outline",
  submetido: "secondary",
  aprovado: "default",
  rejeitado: "destructive",
  arquivado: "outline",
};

function buildDocumentoSchema(t: TFunction) {
  return z.object({
    title: z.string().trim().min(2, t("validation.titleShort")),
    description: z.string().trim().optional(),
    categoryId: z.string().optional(),
    visibility: z.enum(["publico", "departamento", "privado"]),
    expiryDate: z.string().optional(),
    tags: z.string().optional(),
    changeNotes: z.string().optional(),
  });
}

type DocumentoFormValues = z.infer<ReturnType<typeof buildDocumentoSchema>>;

/** Devolve true se a data de validade cair nos próximos 30 dias (inclusive). */
function expiringSoon(date: string | null): boolean {
  if (!date) return false;
  const days = (new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return days >= 0 && days <= 30;
}

function formatSize(bytes: number | null): string {
  if (!bytes) return "—";
  return `${(bytes / 1024).toFixed(0)} KB`;
}

export default function Documentos() {
  const { t } = useTranslation("admin-documentos");
  const { toast } = useToast();
  const { canWrite } = useUserRole();
  const canEdit = canWrite("documentos");
  const prefersReducedMotion = useReducedMotion();

  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [catFilter, setCatFilter] = useState<string>("todas");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewDoc, setViewDoc] = useState<DocumentoDto | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<DocumentoDto | null>(null);

  // Ficheiro do formulário de criação (fora do zod — metadados simulados, sem upload real).
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Nova versão dentro do dialog de detalhes.
  const [newVerFile, setNewVerFile] = useState<File | null>(null);
  const [newVerNotes, setNewVerNotes] = useState("");
  const newVerInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useDocumentosList({
    page: pagination.pageIndex + 1,
    perPage: pagination.pageSize,
    search: search || undefined,
    status: statusFilter !== "todos" ? statusFilter : undefined,
    categoryId: catFilter !== "todas" ? catFilter : undefined,
  });
  // Dataset completo (sem filtros) para KPIs precisos.
  const statsQuery = useDocumentosList({ page: 1, perPage: 1000 });
  const { data: categories = [] } = useDocumentCategories();
  const { data: versions = [] } = useDocVersions(viewDoc?.id ?? null);

  const createDocumento = useCreateDocumento();
  const updateDocumento = useUpdateDocumento();
  const deleteDocumento = useDeleteDocumento();
  const createVersion = useCreateDocVersion();

  const documentoSchema = useMemo(() => buildDocumentoSchema(t), [t]);

  const initialValues = useMemo<Partial<DocumentoFormValues> | undefined>(
    () =>
      editItem
        ? {
            title: editItem.title,
            description: editItem.description ?? "",
            categoryId: editItem.categoryId ?? "",
            visibility: editItem.visibility,
            expiryDate: editItem.expiryDate ?? "",
            tags: editItem.tags.join(", "),
            changeNotes: "",
          }
        : undefined,
    [editItem],
  );

  // Limpa o ficheiro seleccionado sempre que o dialog abre/fecha.
  useEffect(() => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [formOpen]);

  const entityForm = useEntityForm({
    schema: documentoSchema,
    initialValues,
    defaultValues: {
      title: "",
      description: "",
      categoryId: "",
      visibility: "publico",
      expiryDate: "",
      tags: "",
      changeNotes: "",
    },
    open: formOpen,
    onSubmit: async (values) => {
      const tags = (values.tags ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const metadata = {
        title: values.title,
        description: values.description?.trim() ? values.description.trim() : null,
        categoryId: values.categoryId || null,
        visibility: values.visibility,
        expiryDate: values.expiryDate || null,
        tags,
      };

      if (editItem) {
        await updateDocumento.mutateAsync({ id: editItem.id, payload: metadata });
        return;
      }

      // Criação: o ficheiro é obrigatório (metadados simulados, sem upload real).
      if (!file) {
        throw new Error(t("validation.fileRequired"));
      }
      const created = await createDocumento.mutateAsync({
        ...metadata,
        ownerId: CURRENT_USER_ID,
        status: "rascunho",
      });
      await createVersion.mutateAsync({
        documentId: created.id,
        payload: {
          filePath: `documents/${created.id}/v1/${file.name}`,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type || null,
          changeNotes: values.changeNotes?.trim() || "Versão inicial",
          uploadedBy: CURRENT_USER_ID,
        },
      });
    },
    successMessage: editItem ? t("toast.updateSuccess") : t("toast.createSuccess"),
    errorMessage: t("toast.error"),
    onSuccess: () => setFormOpen(false),
  });

  const openCreate = () => {
    setEditItem(null);
    setFormOpen(true);
  };

  const openEdit = (d: DocumentoDto) => {
    setEditItem(d);
    setFormOpen(true);
  };

  const categoryName = (id: string | null) =>
    categories.find((c) => c.id === id)?.name ?? t("table.emptyCell");

  const statusLabel = (s: DocStatus) => t(`status.${s}`);

  // --- KPIs (dataset completo) ---
  const allDocs = statsQuery.data?.data ?? [];
  const kpiTotal = statsQuery.data?.meta.total ?? allDocs.length;
  const kpiPending = useMemo(() => allDocs.filter((d) => d.status === "submetido").length, [allDocs]);
  const kpiExpiring = useMemo(
    () => allDocs.filter((d) => d.status !== "arquivado" && expiringSoon(d.expiryDate)).length,
    [allDocs],
  );

  const updateStatus = async (doc: DocumentoDto, status: DocStatus) => {
    try {
      await updateDocumento.mutateAsync({ id: doc.id, payload: { status } });
      toast({ title: t("toast.statusUpdated"), description: statusLabel(status) });
      if (viewDoc?.id === doc.id) setViewDoc({ ...viewDoc, status });
    } catch (err) {
      toast({
        title: t("toast.error"),
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    }
  };

  const uploadNewVersion = async () => {
    if (!viewDoc || !newVerFile) return;
    try {
      await createVersion.mutateAsync({
        documentId: viewDoc.id,
        payload: {
          filePath: `documents/${viewDoc.id}/vN/${newVerFile.name}`,
          fileName: newVerFile.name,
          fileSize: newVerFile.size,
          mimeType: newVerFile.type || null,
          changeNotes: newVerNotes.trim() || null,
          uploadedBy: CURRENT_USER_ID,
        },
      });
      toast({ title: t("toast.versionUploaded") });
      setNewVerFile(null);
      setNewVerNotes("");
      if (newVerInputRef.current) newVerInputRef.current.value = "";
      // Uma nova versão devolve o documento a rascunho (ver handler).
      setViewDoc({ ...viewDoc, status: "rascunho" });
    } catch (err) {
      toast({
        title: t("toast.error"),
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    }
  };

  const handleDownload = (label: string) => {
    // Simulação — não há storage real nesta demonstração.
    toast({ title: t("actions.download"), description: t("toast.downloadSimulated") + ` (${label})` });
  };

  const columns = useMemo<ColumnDef<DocumentoDto>[]>(
    () => [
      {
        accessorKey: "title",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.title")} />,
        cell: ({ row }) => (
          <div className="max-w-[280px]">
            <div className="font-medium truncate">{row.original.title}</div>
            {row.original.tags.length > 0 && (
              <div className="flex gap-1 mt-1 flex-wrap">
                {row.original.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-[10px] h-4 px-1">{tag}</Badge>
                ))}
              </div>
            )}
          </div>
        ),
      },
      {
        id: "category",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.category")} />,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{categoryName(row.original.categoryId)}</span>
        ),
      },
      {
        accessorKey: "status",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.status")} />,
        cell: ({ row }) => (
          <Badge variant={statusVariant[row.original.status]}>{statusLabel(row.original.status)}</Badge>
        ),
      },
      {
        accessorKey: "expiryDate",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.expiry")} />,
        cell: ({ row }) => {
          const d = row.original.expiryDate;
          if (!d) return <span className="text-sm">{t("table.emptyCell")}</span>;
          const soon = expiringSoon(d);
          return (
            <span className={soon ? "text-destructive flex items-center gap-1 text-sm" : "text-sm"}>
              {soon && <AlertCircle className="h-3.5 w-3.5" />}
              {formatDate(d)}
            </span>
          );
        },
      },
      {
        accessorKey: "updatedAt",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.updated")} />,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{formatDate(row.original.updatedAt)}</span>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, categories],
  );

  const renderRowActions = (row: DocumentoDto) => {
    const actions: RowAction[] = [];
    if (canEdit) {
      actions.push({ label: t("actions.submit"), icon: Send, onClick: () => updateStatus(row, "submetido"), hidden: row.status !== "rascunho" });
      actions.push({ label: t("actions.approve"), icon: CheckCircle2, onClick: () => updateStatus(row, "aprovado"), hidden: row.status !== "submetido" });
      actions.push({ label: t("actions.reject"), icon: XCircle, onClick: () => updateStatus(row, "rejeitado"), hidden: row.status !== "submetido" });
      actions.push({ label: t("actions.archive"), icon: History, onClick: () => updateStatus(row, "arquivado"), hidden: row.status === "arquivado" || row.status === "rascunho" });
      actions.push({ label: t("actions.edit"), icon: Pencil, onClick: () => openEdit(row) });
      actions.push({ label: t("actions.delete"), icon: Trash2, destructive: true, onClick: () => setDeleteId(row.id) });
    }
    return <RowActions primary={{ label: t("actions.view"), icon: Eye, onClick: () => setViewDoc(row) }} actions={actions} />;
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader icon={FileStack} title={t("page.title")} description={t("page.description")}>
        <WriteGuard module="documentos">
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> {t("actions.new")}
          </Button>
        </WriteGuard>
      </AdminPageHeader>

      <motion.div
        className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        variants={prefersReducedMotion ? undefined : staggerContainer}
        initial={prefersReducedMotion ? undefined : "hidden"}
        animate={prefersReducedMotion ? undefined : "visible"}
      >
        <motion.div variants={prefersReducedMotion ? undefined : fadeInUp}>
          <AdminCard
            variant="gradient-green"
            icon={FileStack}
            metric={kpiTotal}
            title={t("kpis.total")}
            caption={t("kpis.totalCaption")}
          />
        </motion.div>
        <motion.div variants={prefersReducedMotion ? undefined : fadeInUp}>
          <AdminCard
            variant={kpiPending > 0 ? "gradient-gold" : "gradient-teal"}
            icon={Clock}
            metric={kpiPending}
            title={t("kpis.pending")}
            caption={t("kpis.pendingCaption")}
          />
        </motion.div>
        <motion.div variants={prefersReducedMotion ? undefined : fadeInUp}>
          <AdminCard
            variant={kpiExpiring > 0 ? "gradient-gold" : "gradient-teal"}
            icon={AlertCircle}
            metric={kpiExpiring}
            title={t("kpis.expiring")}
            caption={t("kpis.expiringCaption")}
          />
        </motion.div>
      </motion.div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="sm:w-[200px]"><SelectValue placeholder={t("filters.statusPlaceholder")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">{t("filters.statusAll")}</SelectItem>
            {(["rascunho", "submetido", "aprovado", "rejeitado", "arquivado"] as DocStatus[]).map((s) => (
              <SelectItem key={s} value={s}>{statusLabel(s)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="sm:w-[220px]"><SelectValue placeholder={t("filters.categoryPlaceholder")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">{t("filters.categoryAll")}</SelectItem>
            {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        loading={isLoading}
        pageCount={data?.meta.lastPage ?? 0}
        pagination={pagination}
        onPaginationChange={setPagination}
        rowCount={data?.meta.total}
        globalFilter={search}
        onGlobalFilterChange={setSearch}
        searchPlaceholder={t("table.searchPlaceholder")}
        emptyMessage={t("table.empty")}
        renderRowActions={renderRowActions}
      />

      <EntityFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editItem ? t("dialog.editTitle") : t("dialog.createTitle")}
        form={entityForm}
        submitLabel={editItem ? t("form.submitEdit") : t("form.submitCreate")}
        submittingLabel={t("form.submitting")}
        cancelLabel={t("form.cancel")}
      >
        {(form) => (
          <>
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.labels.title")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("form.placeholders.title")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.labels.category")}</FormLabel>
                    <Select value={field.value || undefined} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("form.placeholders.categorySelect")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="visibility"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.labels.visibility")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="publico">{t("form.visibilityHints.publico")}</SelectItem>
                        <SelectItem value="departamento">{t("form.visibilityHints.departamento")}</SelectItem>
                        <SelectItem value="privado">{t("form.visibilityHints.privado")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.labels.description")}</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder={t("form.placeholders.description")} {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="expiryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.labels.expiryDate")}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.labels.tags")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("form.placeholders.tags")} {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Ficheiro + notas da versão apenas na criação (upload simulado). */}
            {!editItem && (
              <>
                <div className="space-y-2">
                  <Label>{t("form.labels.file")}</Label>
                  <Input ref={fileInputRef} type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                  {file && (
                    <p className="text-xs text-muted-foreground mt-1">{file.name} · {formatSize(file.size)}</p>
                  )}
                </div>
                <FormField
                  control={form.control}
                  name="changeNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("form.labels.changeNotes")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("form.placeholders.changeNotes")} {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </>
        )}
      </EntityFormDialog>

      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        onConfirm={async () => {
          if (!deleteId) return;
          await deleteDocumento.mutateAsync(deleteId);
          setDeleteId(null);
        }}
        title={t("delete.title")}
        description={t("delete.description")}
      />

      {/* Detalhes / versões / permissões / workflow */}
      <Dialog open={!!viewDoc} onOpenChange={(o) => !o && setViewDoc(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {viewDoc && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 font-serif">
                  <FileStack className="h-5 w-5 text-primary" /> {viewDoc.title}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">{t("details.category")}</p>
                    <p className="font-medium">{categoryName(viewDoc.categoryId)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t("details.status")}</p>
                    <Badge variant={statusVariant[viewDoc.status]}>{statusLabel(viewDoc.status)}</Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t("details.visibility")}</p>
                    <p className="font-medium">{t(`visibility.${viewDoc.visibility}`)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />{t("details.expiry")}
                    </p>
                    <p className="font-medium">{viewDoc.expiryDate ? formatDate(viewDoc.expiryDate) : t("table.emptyCell")}</p>
                  </div>
                </div>

                {viewDoc.description && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{t("details.description")}</p>
                    <p className="text-sm">{viewDoc.description}</p>
                  </div>
                )}

                {viewDoc.tags.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {viewDoc.tags.map((tag) => <Badge key={tag} variant="outline">{tag}</Badge>)}
                  </div>
                )}

                {canEdit && (
                  <div className="rounded-lg border border-border/40 p-3 bg-muted/20">
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <Upload className="h-4 w-4" /> {t("details.newVersion")}
                    </h4>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input ref={newVerInputRef} type="file" onChange={(e) => setNewVerFile(e.target.files?.[0] ?? null)} className="flex-1" />
                      <Input placeholder={t("details.versionNotesPlaceholder")} value={newVerNotes} onChange={(e) => setNewVerNotes(e.target.value)} className="flex-1" />
                      <Button size="sm" onClick={uploadNewVersion} disabled={!newVerFile || createVersion.isPending} className="gap-1">
                        <Upload className="h-3.5 w-3.5" /> {createVersion.isPending ? t("details.uploadingVersion") : t("details.uploadVersion")}
                      </Button>
                    </div>
                  </div>
                )}

                <DocumentPermissionsPanel documentId={viewDoc.id} />

                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <History className="h-4 w-4" /> {t("details.history")}
                  </h4>
                  <div className="rounded-lg border border-border/40">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/40">
                          <TableHead>{t("versions.version")}</TableHead>
                          <TableHead>{t("versions.notes")}</TableHead>
                          <TableHead>{t("versions.date")}</TableHead>
                          <TableHead>{t("versions.size")}</TableHead>
                          <TableHead className="text-right">{t("versions.action")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {versions.map((v) => (
                          <TableRow key={v.id}>
                            <TableCell><Badge variant="outline">v{v.versionNumber}</Badge></TableCell>
                            <TableCell className="text-sm">{v.changeNotes ?? t("table.emptyCell")}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{formatDate(v.createdAt)}</TableCell>
                            <TableCell className="text-sm">{formatSize(v.fileSize)}</TableCell>
                            <TableCell className="text-right">
                              <Button size="sm" variant="outline" onClick={() => handleDownload(v.fileName ?? `v${v.versionNumber}`)} className="gap-1">
                                <Download className="h-3.5 w-3.5" /> {t("actions.download")}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {canEdit && (
                  <div className="flex flex-wrap gap-2 pt-4 border-t">
                    {viewDoc.status === "rascunho" && (
                      <Button size="sm" variant="default" className="gap-1" onClick={() => updateStatus(viewDoc, "submetido")}>
                        <Send className="h-3.5 w-3.5" /> {t("actions.submit")}
                      </Button>
                    )}
                    {viewDoc.status === "submetido" && (
                      <>
                        <Button size="sm" className="gap-1" onClick={() => updateStatus(viewDoc, "aprovado")}>
                          <CheckCircle2 className="h-3.5 w-3.5" /> {t("actions.approve")}
                        </Button>
                        <Button size="sm" variant="destructive" className="gap-1" onClick={() => updateStatus(viewDoc, "rejeitado")}>
                          <XCircle className="h-3.5 w-3.5" /> {t("actions.reject")}
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
