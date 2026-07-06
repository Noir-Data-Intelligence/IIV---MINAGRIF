import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import type { TFunction } from "i18next";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { FlaskConical, Eye, Pencil, Plus, Trash2, CheckCircle2, Layers } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { RowActions, type RowAction } from "@/components/admin/RowActions";
import { WriteGuard } from "@/components/WriteGuard";
import { DataTable, DataTableColumnHeader } from "@/components/data-table";
import { EntityFormDialog } from "@/components/EntityFormDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useEntityForm } from "@/hooks/useEntityForm";
import { useUserRole } from "@/hooks/useUserRole";
import {
  useCreateLaboratorio,
  useDeleteLaboratorio,
  useLaboratoriosList,
  useUpdateLaboratorio,
} from "@/hooks/queries/useLaboratorios";
import type { LaboratorioDto } from "@/types/dto/laboratorio";
import i18n from "@/i18n";
import ptLaboratorios from "@/i18n/locales/pt/admin/laboratorios.json";
import enLaboratorios from "@/i18n/locales/en/admin/laboratorios.json";

// Namespace autónomo registado em runtime (o bundle central só regista common/nav),
// seguindo o padrão de Departamentos.tsx.
if (!i18n.hasResourceBundle("pt", "admin-laboratorios"))
  i18n.addResourceBundle("pt", "admin-laboratorios", ptLaboratorios, true, true);
if (!i18n.hasResourceBundle("en", "admin-laboratorios"))
  i18n.addResourceBundle("en", "admin-laboratorios", enLaboratorios, true, true);

function buildLaboratorioSchema(t: TFunction) {
  return z.object({
    name: z.string().trim().min(2, t("validation.nameShort")),
    type: z.string().trim().min(2, t("validation.typeRequired")),
    description: z.string().trim().optional(),
    isActive: z.boolean(),
  });
}

type LaboratorioFormValues = z.infer<ReturnType<typeof buildLaboratorioSchema>>;

export default function Laboratorios() {
  const { t, i18n: i18nInstance } = useTranslation("admin-laboratorios");
  const { canWrite } = useUserRole();
  const canEdit = canWrite("laboratorios");

  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewItem, setViewItem] = useState<LaboratorioDto | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<LaboratorioDto | null>(null);

  const { data, isLoading } = useLaboratoriosList({
    page: pagination.pageIndex + 1,
    perPage: pagination.pageSize,
    search: search || undefined,
  });

  const createLaboratorio = useCreateLaboratorio();
  const updateLaboratorio = useUpdateLaboratorio();
  const deleteLaboratorio = useDeleteLaboratorio();

  const laboratorioSchema = useMemo(() => buildLaboratorioSchema(t), [t]);

  const initialValues = useMemo<Partial<LaboratorioFormValues> | undefined>(
    () =>
      editItem
        ? {
            name: editItem.name,
            type: editItem.type,
            description: editItem.description ?? "",
            isActive: editItem.isActive,
          }
        : undefined,
    [editItem],
  );

  const entityForm = useEntityForm({
    schema: laboratorioSchema,
    initialValues,
    defaultValues: { name: "", type: "", description: "", isActive: true },
    open: formOpen,
    onSubmit: async (values) => {
      const payload = {
        name: values.name,
        type: values.type,
        description: values.description?.trim() ? values.description.trim() : null,
        isActive: values.isActive,
      };
      if (editItem) {
        await updateLaboratorio.mutateAsync({ id: editItem.id, payload });
      } else {
        await createLaboratorio.mutateAsync(payload);
      }
    },
    successMessage: editItem ? t("toast.updateSuccess") : t("toast.createSuccess"),
    errorMessage: t("toast.error"),
    onSuccess: () => setFormOpen(false),
  });

  const openCreate = () => {
    setEditItem(null);
    setFormOpen(true);
  };

  const openEdit = (l: LaboratorioDto) => {
    setEditItem(l);
    setFormOpen(true);
  };

  // KPIs — total vem do meta.total (dataset completo); activos/tipos derivam da
  // página carregada. Com pageSize 20 e o volume actual, a página cobre todo o
  // conjunto; para datasets grandes seria preferível um endpoint de resumo.
  const rows = data?.data ?? [];
  const kpiTotal = data?.meta.total ?? 0;
  const kpiActive = useMemo(() => rows.filter((l) => l.isActive).length, [rows]);
  const kpiTypes = useMemo(() => new Set(rows.map((l) => l.type)).size, [rows]);

  const columns = useMemo<ColumnDef<LaboratorioDto>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.name")} />,
        cell: ({ row }) => (
          <div className="flex items-center gap-2 font-medium">
            <FlaskConical className="h-4 w-4 text-primary" />
            {row.original.name}
          </div>
        ),
      },
      {
        accessorKey: "type",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.type")} />,
        cell: ({ row }) => (
          <Badge variant="secondary" className="capitalize">
            {row.original.type.replace(/_/g, " ")}
          </Badge>
        ),
      },
      {
        accessorKey: "isActive",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.status")} />,
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? "default" : "destructive"}>
            {row.original.isActive ? t("table.active") : t("table.inactive")}
          </Badge>
        ),
      },
      {
        accessorKey: "description",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.description")} />,
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm line-clamp-1 max-w-xs">
            {row.original.description || t("table.emptyCell")}
          </span>
        ),
      },
    ],
    [t],
  );

  const renderRowActions = (row: LaboratorioDto) => {
    const actions: RowAction[] = [{ label: t("actions.view"), icon: Eye, onClick: () => setViewItem(row) }];
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
      <AdminPageHeader icon={FlaskConical} title={t("page.title")} description={t("page.description")}>
        <WriteGuard module="laboratorios">
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> {t("actions.new")}
          </Button>
        </WriteGuard>
      </AdminPageHeader>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <AdminCard
          variant="gradient-green"
          icon={FlaskConical}
          metric={kpiTotal}
          title={t("kpis.total")}
          caption={t("kpis.totalCaption")}
          stagger={1}
        />
        <AdminCard
          variant="gradient-teal"
          icon={CheckCircle2}
          metric={kpiActive}
          title={t("kpis.active")}
          caption={t("kpis.activeCaption")}
          stagger={2}
        />
        <AdminCard
          variant="gradient-gold"
          icon={Layers}
          metric={kpiTypes}
          title={t("kpis.types")}
          caption={t("kpis.typesCaption")}
          stagger={3}
        />
      </div>

      <DataTable
        columns={columns}
        data={rows}
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
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.labels.name")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("form.placeholders.name")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.labels.type")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("form.placeholders.type")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.labels.description")}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={t("form.placeholders.description")} {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="!mt-0 cursor-pointer">{t("form.labels.isActive")}</FormLabel>
                </FormItem>
              )}
            />
          </>
        )}
      </EntityFormDialog>

      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        onConfirm={async () => {
          if (!deleteId) return;
          await deleteLaboratorio.mutateAsync(deleteId);
          setDeleteId(null);
        }}
      />

      <Dialog open={!!viewItem} onOpenChange={(o) => !o && setViewItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">{t("dialog.detailsTitle")}</DialogTitle>
          </DialogHeader>
          {viewItem && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-muted-foreground">{t("details.name")}:</span>
                  <p className="font-medium">{viewItem.name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("details.type")}:</span>
                  <p className="font-medium capitalize">{viewItem.type.replace(/_/g, " ")}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("details.status")}:</span>
                  <p>
                    <Badge variant={viewItem.isActive ? "default" : "destructive"}>
                      {viewItem.isActive ? t("table.active") : t("table.inactive")}
                    </Badge>
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("details.createdAt")}:</span>
                  <p className="font-medium">
                    {new Date(viewItem.createdAt).toLocaleDateString(
                      i18nInstance.language === "en" ? "en-GB" : "pt-AO",
                    )}
                  </p>
                </div>
              </div>
              {viewItem.description && (
                <div>
                  <span className="text-muted-foreground">{t("details.description")}:</span>
                  <p className="font-medium mt-1">{viewItem.description}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
