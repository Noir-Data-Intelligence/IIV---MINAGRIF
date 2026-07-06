import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import type { TFunction } from "i18next";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { ExternalLink, FileText, Pencil, Plus, ScrollText, Trash2 } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { RowActions, type RowAction } from "@/components/admin/RowActions";
import { WriteGuard } from "@/components/WriteGuard";
import { DataTable, DataTableColumnHeader } from "@/components/data-table";
import { EntityFormDialog } from "@/components/EntityFormDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useEntityForm } from "@/hooks/useEntityForm";
import { useUserRole } from "@/hooks/useUserRole";
import {
  useCreateLegislacao,
  useDeleteLegislacao,
  useLegislacaoAdminList,
  useUpdateLegislacao,
} from "@/hooks/queries/useLegislacao";
import { LEGISLACAO_TIPOS, type LegislacaoDto } from "@/types/dto/legislacao";
import i18n from "@/i18n";
import ptLegislacao from "@/i18n/locales/pt/admin/legislacao.json";
import enLegislacao from "@/i18n/locales/en/admin/legislacao.json";

// Namespace "admin-legislacao" — distinto do namespace público "legislacao"
// (src/pages/Legislacao.tsx / LegislacaoDetalhe.tsx), para que as chaves do
// admin (rótulos de formulário, toasts, etc.) não colidam com as do portal
// público. Não faz parte do bundle central (src/i18n/index.ts, que só
// regista "common"/"nav"), por isso é registado aqui em runtime, tal como
// "departamentos" em Departamentos.tsx.
if (!i18n.hasResourceBundle("pt", "admin-legislacao"))
  i18n.addResourceBundle("pt", "admin-legislacao", ptLegislacao, true, true);
if (!i18n.hasResourceBundle("en", "admin-legislacao"))
  i18n.addResourceBundle("en", "admin-legislacao", enLegislacao, true, true);

/** Slug simples (sem acentos), usado ao criar um novo diploma. */
function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

/**
 * Schema zod construído com `t()` para que as mensagens de validação sigam o
 * idioma activo, à semelhança de `buildDepartamentoSchema(t)` em Departamentos.tsx.
 * Nota: o ficheiro PDF em si NÃO faz parte do schema — é mantido num estado
 * `file` à parte (ver `handleFormOpenChange`/`file` mais abaixo), tal como a
 * página Supabase original.
 */
function buildLegislacaoSchema(t: TFunction) {
  return z.object({
    num: z.string().trim().min(1, t("validation.numRequired")),
    titulo: z.string().trim().min(2, t("validation.tituloShort")),
    descricao: z.string().trim().optional(),
    tipo: z.enum(LEGISLACAO_TIPOS, { required_error: t("validation.tipoRequired") }),
    ano: z.string().trim().min(1, t("validation.anoRequired")),
    published: z.boolean(),
  });
}

type LegislacaoFormValues = z.infer<ReturnType<typeof buildLegislacaoSchema>>;

export default function Legislacao() {
  const { t } = useTranslation("admin-legislacao");
  const { canWrite } = useUserRole();
  const canEdit = canWrite("legislacao");

  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [search, setSearch] = useState("");
  const [deleteSlug, setDeleteSlug] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<LegislacaoDto | null>(null);
  // Ficheiro PDF seleccionado — fica FORA do schema/RHF; em mock, apenas o
  // NOME do ficheiro é usado como `pdfUrl` (sem upload real).
  // TODO Fase 4: upload real para Laravel Storage.
  const [file, setFile] = useState<File | null>(null);

  const { data, isLoading } = useLegislacaoAdminList({
    page: pagination.pageIndex + 1,
    perPage: pagination.pageSize,
    search: search || undefined,
  });

  const createLegislacao = useCreateLegislacao();
  const updateLegislacao = useUpdateLegislacao();
  const deleteLegislacao = useDeleteLegislacao();

  const legislacaoSchema = useMemo(() => buildLegislacaoSchema(t), [t]);

  const initialValues = useMemo<Partial<LegislacaoFormValues> | undefined>(
    () =>
      editItem
        ? {
            num: editItem.num,
            titulo: editItem.titulo,
            descricao: editItem.descricao ?? "",
            tipo: (editItem.tipo as LegislacaoFormValues["tipo"]) ?? "Lei",
            ano: editItem.ano,
            published: editItem.published,
          }
        : undefined,
    [editItem],
  );

  const entityForm = useEntityForm({
    schema: legislacaoSchema,
    initialValues,
    defaultValues: { num: "", titulo: "", descricao: "", tipo: "Lei", ano: "", published: true },
    open: formOpen,
    onSubmit: async (values) => {
      const pdfUrl = file ? file.name : (editItem?.pdfUrl ?? null);
      const payload: Partial<LegislacaoDto> = {
        num: values.num,
        titulo: values.titulo,
        descricao: values.descricao?.trim() ? values.descricao.trim() : null,
        tipo: values.tipo,
        ano: values.ano,
        published: values.published,
        pdfUrl,
      };
      if (editItem) {
        await updateLegislacao.mutateAsync({ slug: editItem.slug, payload });
      } else {
        await createLegislacao.mutateAsync({ ...payload, slug: slugify(values.titulo) });
      }
    },
    successMessage: editItem ? t("toast.updateSuccess") : t("toast.createSuccess"),
    errorMessage: t("toast.error"),
    onSuccess: () => {
      setFormOpen(false);
      setFile(null);
    },
  });

  const handleFormOpenChange = (open: boolean) => {
    setFormOpen(open);
    if (!open) setFile(null);
  };

  const openCreate = () => {
    setEditItem(null);
    setFile(null);
    setFormOpen(true);
  };

  const openEdit = (item: LegislacaoDto) => {
    setEditItem(item);
    setFile(null);
    setFormOpen(true);
  };

  const togglePublished = (item: LegislacaoDto) => {
    if (!canEdit) return;
    updateLegislacao.mutate({ slug: item.slug, payload: { published: !item.published } });
  };

  const columns = useMemo<ColumnDef<LegislacaoDto>[]>(
    () => [
      {
        accessorKey: "num",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.num")} />,
        cell: ({ row }) => <span className="font-mono text-xs">{row.original.num}</span>,
      },
      {
        accessorKey: "titulo",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.titulo")} />,
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.titulo}</p>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <Badge variant="outline">{row.original.tipo}</Badge>
              <span>{row.original.ano}</span>
            </div>
          </div>
        ),
      },
      {
        id: "published",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.estado")} />,
        cell: ({ row }) => {
          const item = row.original;
          const badge = (
            <Badge variant={item.published ? "default" : "secondary"}>
              {item.published ? t("status.published") : t("status.draft")}
            </Badge>
          );
          if (!canEdit) return badge;
          return (
            <button type="button" onClick={() => togglePublished(item)} className="cursor-pointer">
              {badge}
            </button>
          );
        },
      },
      {
        id: "pdf",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.pdf")} />,
        cell: ({ row }) =>
          row.original.pdfUrl ? (
            <span className="inline-flex items-center gap-1 text-xs text-primary">
              <FileText className="h-3.5 w-3.5" /> {t("table.pdfAvailable")}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">{t("table.pdfNone")}</span>
          ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, canEdit],
  );

  const renderRowActions = (row: LegislacaoDto) => {
    const actions: RowAction[] = [];
    if (row.pdfUrl) {
      actions.push({
        label: t("actions.viewPdf"),
        icon: ExternalLink,
        onClick: () => window.open(row.pdfUrl as string, "_blank", "noopener,noreferrer"),
      });
    }
    if (canEdit) {
      actions.push({ label: t("actions.edit"), icon: Pencil, onClick: () => openEdit(row) });
      actions.push({
        label: t("actions.delete"),
        icon: Trash2,
        destructive: true,
        onClick: () => setDeleteSlug(row.slug),
      });
    }
    return <RowActions actions={actions} />;
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader icon={ScrollText} title={t("page.title")} description={t("page.description")}>
        <WriteGuard module="legislacao">
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> {t("actions.new")}
          </Button>
        </WriteGuard>
      </AdminPageHeader>

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
        onOpenChange={handleFormOpenChange}
        title={editItem ? t("dialog.editTitle") : t("dialog.createTitle")}
        form={entityForm}
        submitLabel={editItem ? t("form.submitEdit") : t("form.submitCreate")}
        submittingLabel={t("form.submitting")}
        cancelLabel={t("form.cancel")}
        className="max-w-2xl"
      >
        {(form) => (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FormField
                control={form.control}
                name="num"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.labels.num")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("form.placeholders.num")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.labels.tipo")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {LEGISLACAO_TIPOS.map((tipo) => (
                          <SelectItem key={tipo} value={tipo}>
                            {tipo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ano"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.labels.ano")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("form.placeholders.ano")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="titulo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.labels.titulo")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("form.placeholders.titulo")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.labels.descricao")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("form.placeholders.descricao")}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Upload de PDF fora do RHF/zod — mock usa apenas o NOME do ficheiro
                como pdfUrl (sem upload real). TODO Fase 4: upload real para Laravel Storage. */}
            <div>
              <Label>
                {t("form.labels.pdf")}{" "}
                {editItem?.pdfUrl && (
                  <span className="text-xs text-muted-foreground">{t("form.pdfKeepHint")}</span>
                )}
              </Label>
              <Input
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              {editItem?.pdfUrl && !file && (
                <a
                  href={editItem.pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary inline-flex items-center gap-1 mt-1"
                >
                  <ExternalLink className="h-3 w-3" /> {t("form.pdfCurrentLink")}
                </a>
              )}
            </div>

            <FormField
              control={form.control}
              name="published"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="!mt-0">{t("form.labels.published")}</FormLabel>
                </FormItem>
              )}
            />
          </>
        )}
      </EntityFormDialog>

      <DeleteConfirmDialog
        open={!!deleteSlug}
        onOpenChange={(o) => !o && setDeleteSlug(null)}
        onConfirm={async () => {
          if (!deleteSlug) return;
          await deleteLegislacao.mutateAsync(deleteSlug);
          setDeleteSlug(null);
        }}
      />
    </div>
  );
}
