import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import type { TFunction } from "i18next";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { Building2, Eye, Pencil, Plus, Trash2 } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { RowActions, type RowAction } from "@/components/admin/RowActions";
import { WriteGuard } from "@/components/WriteGuard";
import { DataTable, DataTableColumnHeader } from "@/components/data-table";
import { EntityFormDialog } from "@/components/EntityFormDialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useEntityForm } from "@/hooks/useEntityForm";
import { useUserRole } from "@/hooks/useUserRole";
import {
  useCreateDepartamento,
  useDeleteDepartamento,
  useDepartamentosList,
  useUpdateDepartamento,
} from "@/hooks/queries/useDepartamentos";
import type { DepartamentoDto } from "@/types/dto/departamento";
import i18n from "@/i18n";
import ptDepartamentos from "@/i18n/locales/pt/admin/departamentos.json";
import enDepartamentos from "@/i18n/locales/en/admin/departamentos.json";

// Namespace "departamentos" não faz parte do bundle central (src/i18n/index.ts,
// que só regista "common"/"nav"). Registamo-lo aqui em runtime para manter esta
// página autónoma sem tocar na configuração global do i18next. Este é o PRIMEIRO
// módulo admin com i18n — segue o padrão das páginas públicas (ex: Contactos.tsx).
if (!i18n.hasResourceBundle("pt", "departamentos"))
  i18n.addResourceBundle("pt", "departamentos", ptDepartamentos, true, true);
if (!i18n.hasResourceBundle("en", "departamentos"))
  i18n.addResourceBundle("en", "departamentos", enDepartamentos, true, true);

/**
 * Schema zod construído com `t()` para que as mensagens de validação sigam o
 * idioma activo (reconstruído via `useMemo` dependente de `t`), à semelhança de
 * `buildContactSchema(t)` em Contactos.tsx.
 */
function buildDepartamentoSchema(t: TFunction) {
  return z.object({
    name: z.string().trim().min(2, t("validation.nameShort")),
    description: z.string().trim().optional(),
  });
}

type DepartamentoFormValues = z.infer<ReturnType<typeof buildDepartamentoSchema>>;

export default function Departamentos() {
  const { t, i18n: i18nInstance } = useTranslation("departamentos");
  const { canWrite } = useUserRole();
  const canEdit = canWrite("departamentos");

  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewItem, setViewItem] = useState<DepartamentoDto | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<DepartamentoDto | null>(null);

  const { data, isLoading } = useDepartamentosList({
    page: pagination.pageIndex + 1,
    perPage: pagination.pageSize,
    search: search || undefined,
  });

  const createDepartamento = useCreateDepartamento();
  const updateDepartamento = useUpdateDepartamento();
  const deleteDepartamento = useDeleteDepartamento();

  const departamentoSchema = useMemo(() => buildDepartamentoSchema(t), [t]);

  const initialValues = useMemo<Partial<DepartamentoFormValues> | undefined>(
    () => (editItem ? { name: editItem.name, description: editItem.description ?? "" } : undefined),
    [editItem],
  );

  const entityForm = useEntityForm({
    schema: departamentoSchema,
    initialValues,
    defaultValues: { name: "", description: "" },
    open: formOpen,
    onSubmit: async (values) => {
      const payload = {
        name: values.name,
        description: values.description?.trim() ? values.description.trim() : null,
      };
      if (editItem) {
        await updateDepartamento.mutateAsync({ id: editItem.id, payload });
      } else {
        await createDepartamento.mutateAsync(payload);
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

  const openEdit = (d: DepartamentoDto) => {
    setEditItem(d);
    setFormOpen(true);
  };

  const columns = useMemo<ColumnDef<DepartamentoDto>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.name")} />,
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      },
      {
        accessorKey: "description",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.description")} />,
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.description || t("table.emptyCell")}</span>
        ),
      },
    ],
    [t],
  );

  const renderRowActions = (row: DepartamentoDto) => {
    const actions: RowAction[] = [
      { label: t("actions.view"), icon: Eye, onClick: () => setViewItem(row) },
    ];
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
      <AdminPageHeader icon={Building2} title={t("page.title")} description={t("page.description")}>
        <WriteGuard module="departamentos">
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
          </>
        )}
      </EntityFormDialog>

      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        onConfirm={async () => {
          if (!deleteId) return;
          await deleteDepartamento.mutateAsync(deleteId);
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
