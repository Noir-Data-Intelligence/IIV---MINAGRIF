import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import type { TFunction } from "i18next";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { Newspaper, Pencil, Plus, Star, Trash2, ExternalLink } from "lucide-react";

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
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import {
  useCreateNoticia,
  useDeleteNoticia,
  useNoticiasList,
  useUpdateNoticia,
} from "@/hooks/queries/useNoticias";
import { NOTICIA_CATEGORIAS, type NoticiaDto } from "@/types/dto/noticia";
import i18n from "@/i18n";
import ptNoticiasAdmin from "@/i18n/locales/pt/admin/noticias.json";
import enNoticiasAdmin from "@/i18n/locales/en/admin/noticias.json";

// Namespace "admin-noticias" (distinto do namespace público "noticias" usado nas
// páginas públicas de notícias, para não colidir com aquele bundle) registado em
// runtime, tal como em Departamentos.tsx — este módulo não toca em src/i18n/index.ts.
if (!i18n.hasResourceBundle("pt", "admin-noticias"))
  i18n.addResourceBundle("pt", "admin-noticias", ptNoticiasAdmin, true, true);
if (!i18n.hasResourceBundle("en", "admin-noticias"))
  i18n.addResourceBundle("en", "admin-noticias", enNoticiasAdmin, true, true);

// Regexp de marcas diacríticas (usada após normalize("NFD") para remover
// acentos), construída via String.fromCharCode em vez de um literal \uXXXX
// para evitar problemas de codificação de caracteres combinados no ficheiro.
const COMBINING_MARKS_RE = new RegExp(`[${String.fromCharCode(0x0300)}-${String.fromCharCode(0x036f)}]`, "g");

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(COMBINING_MARKS_RE, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 90);
}

/**
 * Schema zod construído com `t()`, à semelhança de `buildDepartamentoSchema(t)`
 * em Departamentos.tsx, para que as mensagens de validação sigam o idioma activo.
 */
function buildNoticiaSchema(t: TFunction) {
  return z.object({
    titulo: z.string().trim().min(2, t("validation.tituloShort")),
    resumo: z.string().trim().optional(),
    conteudo: z.string().trim().optional(),
    categoria: z.enum(NOTICIA_CATEGORIAS),
    destaque: z.boolean(),
    published: z.boolean(),
    published_at: z.string().optional(),
  });
}

type NoticiaFormValues = z.infer<ReturnType<typeof buildNoticiaSchema>>;

export default function Noticias() {
  const { t, i18n: i18nInstance } = useTranslation("admin-noticias");
  const { toast } = useToast();
  const { canWrite } = useUserRole();
  const canEdit = canWrite("noticias");

  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<NoticiaDto | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const { data, isLoading } = useNoticiasList({
    page: pagination.pageIndex + 1,
    perPage: pagination.pageSize,
    search: search || undefined,
  });

  const createNoticia = useCreateNoticia();
  const updateNoticia = useUpdateNoticia();
  const deleteNoticia = useDeleteNoticia();

  const noticiaSchema = useMemo(() => buildNoticiaSchema(t), [t]);

  const initialValues = useMemo<Partial<NoticiaFormValues> | undefined>(
    () =>
      editItem
        ? {
            titulo: editItem.titulo,
            resumo: editItem.resumo ?? "",
            conteudo: editItem.conteudo ?? "",
            categoria: (editItem.categoria as NoticiaFormValues["categoria"]) ?? "Geral",
            destaque: editItem.destaque,
            published: editItem.published,
            published_at: (editItem.published_at ?? editItem.created_at)?.slice(0, 10) ?? "",
          }
        : undefined,
    [editItem],
  );

  const entityForm = useEntityForm({
    schema: noticiaSchema,
    initialValues,
    defaultValues: {
      titulo: "",
      resumo: "",
      conteudo: "",
      categoria: "Geral",
      destaque: false,
      published: true,
      published_at: new Date().toISOString().slice(0, 10),
    },
    open: formOpen,
    onSubmit: async (values) => {
      // TODO Fase 4: upload real para Laravel Storage — por agora guarda-se apenas
      // o nome do ficheiro seleccionado, sem qualquer envio real de imagem.
      const image_path = file ? file.name : (editItem?.image_path ?? null);
      const payload: Partial<NoticiaDto> = {
        titulo: values.titulo,
        resumo: values.resumo?.trim() ? values.resumo.trim() : null,
        conteudo: values.conteudo?.trim() ? values.conteudo.trim() : null,
        categoria: values.categoria,
        destaque: values.destaque,
        published: values.published,
        published_at: values.published_at ? new Date(values.published_at).toISOString() : null,
        image_path,
      };

      if (editItem) {
        await updateNoticia.mutateAsync({ id: editItem.id, payload });
      } else {
        const slug = `${slugify(values.titulo)}-${Math.random().toString(36).slice(2, 6)}`;
        await createNoticia.mutateAsync({ ...payload, slug });
      }
    },
    successMessage: editItem ? t("toast.updateSuccess") : t("toast.createSuccess"),
    errorMessage: t("toast.error"),
    onSuccess: () => {
      setFormOpen(false);
      setFile(null);
    },
  });

  const openCreate = () => {
    setEditItem(null);
    setFile(null);
    setFormOpen(true);
  };

  const openEdit = (n: NoticiaDto) => {
    setEditItem(n);
    setFile(null);
    setFormOpen(true);
  };

  const togglePublish = (n: NoticiaDto) => {
    updateNoticia.mutate(
      {
        id: n.id,
        payload: {
          published: !n.published,
          published_at: !n.published && !n.published_at ? new Date().toISOString() : n.published_at,
        },
      },
      {
        onError: (err: unknown) =>
          toast({
            title: t("toast.error"),
            description: err instanceof Error ? err.message : undefined,
            variant: "destructive",
          }),
      },
    );
  };

  const columns = useMemo<ColumnDef<NoticiaDto>[]>(
    () => [
      {
        id: "image",
        header: t("table.image"),
        enableSorting: false,
        cell: ({ row }) =>
          row.original.image_path ? (
            <img src={row.original.image_path} alt="" className="h-10 w-14 rounded object-cover" />
          ) : (
            <div className="h-10 w-14 rounded bg-muted" />
          ),
      },
      {
        accessorKey: "titulo",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.titulo")} />,
        cell: ({ row }) => (
          <div className="max-w-sm">
            <div className="font-medium flex items-center gap-2">
              {row.original.destaque && <Star className="h-3.5 w-3.5 text-[hsl(var(--iiv-gold-text))] fill-current" />}
              {row.original.titulo}
            </div>
            {row.original.resumo && (
              <div className="text-xs text-muted-foreground line-clamp-1">{row.original.resumo}</div>
            )}
          </div>
        ),
      },
      {
        accessorKey: "categoria",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.categoria")} />,
        cell: ({ row }) => <Badge variant="outline">{row.original.categoria}</Badge>,
      },
      {
        id: "data",
        accessorFn: (row) => row.published_at ?? row.created_at,
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.data")} />,
        cell: ({ row }) => {
          const date = row.original.published_at ?? row.original.created_at;
          return (
            <span className="text-xs text-muted-foreground">
              {new Date(date).toLocaleDateString(i18nInstance.language === "en" ? "en-GB" : "pt-AO")}
            </span>
          );
        },
      },
      {
        id: "estado",
        header: t("table.estado"),
        enableSorting: false,
        cell: ({ row }) => {
          const n = row.original;
          return (
            <button onClick={() => canEdit && togglePublish(n)} className={canEdit ? "cursor-pointer" : "cursor-default"}>
              <Badge variant={n.published ? "default" : "secondary"}>
                {n.published ? t("badge.published") : t("badge.draft")}
              </Badge>
            </button>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, i18nInstance.language, canEdit],
  );

  const renderRowActions = (row: NoticiaDto) => {
    const actions: RowAction[] = [];
    if (row.published) {
      actions.push({
        label: t("actions.viewPublic"),
        icon: ExternalLink,
        onClick: () => window.open(`/noticias/${row.slug}`, "_blank", "noopener,noreferrer"),
      });
    }
    if (canEdit) {
      actions.push({ label: t("actions.edit"), icon: Pencil, onClick: () => openEdit(row) });
      actions.push({
        label: t("actions.delete"),
        icon: Trash2,
        destructive: true,
        onClick: () => setDeleteId(row.id),
      });
    }
    return <RowActions actions={actions} />;
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader icon={Newspaper} title={t("page.title")} description={t("page.description")}>
        <WriteGuard module="noticias">
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
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setFile(null);
        }}
        title={editItem ? t("dialog.editTitle") : t("dialog.createTitle")}
        form={entityForm}
        submitLabel={editItem ? t("form.submitEdit") : t("form.submitCreate")}
        submittingLabel={t("form.submitting")}
        cancelLabel={t("form.cancel")}
        className="max-w-3xl max-h-[90vh] overflow-y-auto"
      >
        {(form) => (
          <>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="categoria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.labels.categoria")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {NOTICIA_CATEGORIAS.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
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
                name="published_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.labels.publishedAt")}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="resumo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.labels.resumo")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("form.placeholders.resumo")}
                      rows={2}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="conteudo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.labels.conteudo")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("form.placeholders.conteudo")}
                      rows={10}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <Label>
                {t("form.labels.image")}{" "}
                {editItem?.image_path && (
                  <span className="text-xs text-muted-foreground">{t("form.imageKeepHint")}</span>
                )}
              </Label>
              <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              {editItem?.image_path && !file && (
                <img src={editItem.image_path} alt="" className="mt-2 h-32 rounded-md object-cover" />
              )}
            </div>

            <div className="flex flex-wrap gap-6">
              <FormField
                control={form.control}
                name="published"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="!mt-0">{t("form.labels.published")}</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="destaque"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="!mt-0">{t("form.labels.destaque")}</FormLabel>
                  </FormItem>
                )}
              />
            </div>
          </>
        )}
      </EntityFormDialog>

      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        onConfirm={async () => {
          if (!deleteId) return;
          await deleteNoticia.mutateAsync(deleteId);
          setDeleteId(null);
        }}
      />
    </div>
  );
}
