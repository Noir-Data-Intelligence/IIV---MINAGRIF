import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "framer-motion";
import { z } from "zod";
import type { TFunction } from "i18next";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import {
  ClipboardCheck,
  CheckCircle2,
  CalendarClock,
  Eye,
  FileText,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { RowActions, type RowAction } from "@/components/admin/RowActions";
import { AttachedDocsPanel } from "@/components/admin/AttachedDocsPanel";
import { OpenProcessButton } from "@/components/admin/OpenProcessButton";
import { WriteGuard } from "@/components/WriteGuard";
import { DataTable, DataTableColumnHeader } from "@/components/data-table";
import { EntityFormDialog } from "@/components/EntityFormDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEntityForm } from "@/hooks/useEntityForm";
import { useUserRole } from "@/hooks/useUserRole";
import {
  useAuditoriasList,
  useCreateAuditoria,
  useDeleteAuditoria,
  useUpdateAuditoria,
} from "@/hooks/queries/useAuditorias";
import { useDepartamentosList } from "@/hooks/queries/useDepartamentos";
import { useLaboratoriosList } from "@/hooks/queries/useLaboratorios";
import { AUDIT_STATUS } from "@/lib/domain-enums";
import { generateInstitutionalPdf } from "@/lib/generateInstitutionalPdf";
import { fadeIn } from "@/lib/motion";
import type { AuditoriaDto } from "@/types/dto/auditoria";
import i18n from "@/i18n";
import ptAuditorias from "@/i18n/locales/pt/admin/auditorias.json";
import enAuditorias from "@/i18n/locales/en/admin/auditorias.json";

// Namespace autónomo registado em runtime (o bundle central só regista common/nav),
// seguindo o padrão de Departamentos.tsx / Laboratorios.tsx.
if (!i18n.hasResourceBundle("pt", "admin-auditorias"))
  i18n.addResourceBundle("pt", "admin-auditorias", ptAuditorias, true, true);
if (!i18n.hasResourceBundle("en", "admin-auditorias"))
  i18n.addResourceBundle("en", "admin-auditorias", enAuditorias, true, true);

const AUDIT_TYPE_KEYS = ["interna", "externa", "ISO"] as const;
const AUDIT_STATUS_KEYS = Object.keys(AUDIT_STATUS);
/** Sentinela para "sem departamento/laboratório" — o <Select> shadcn não aceita valor "". */
const NONE = "none";

function buildAuditoriaSchema(t: TFunction) {
  return z.object({
    title: z.string().trim().min(2, t("validation.titleShort")),
    auditType: z.string().min(1, t("validation.typeRequired")),
    auditor: z.string().trim().min(2, t("validation.auditorRequired")),
    scheduledDate: z.string().min(1, t("validation.dateRequired")),
    status: z.string().min(1),
    departmentId: z.string(),
    laboratoryId: z.string(),
    findings: z.string().trim().optional(),
    recommendations: z.string().trim().optional(),
  });
}

type AuditoriaFormValues = z.infer<ReturnType<typeof buildAuditoriaSchema>>;

export default function Auditorias() {
  const { t } = useTranslation("admin-auditorias");
  const { canWrite } = useUserRole();
  const canEdit = canWrite("auditorias");
  const prefersReduced = useReducedMotion();

  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewItem, setViewItem] = useState<AuditoriaDto | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<AuditoriaDto | null>(null);

  const { data, isLoading } = useAuditoriasList({
    page: pagination.pageIndex + 1,
    perPage: pagination.pageSize,
    search: search || undefined,
  });

  // Selects de FK — usam os módulos já migrados (dados reais via MSW).
  const { data: deptData } = useDepartamentosList({ perPage: 100 });
  const { data: labData } = useLaboratoriosList({ perPage: 100 });
  const departamentos = deptData?.data ?? [];
  const laboratorios = labData?.data ?? [];

  const createAuditoria = useCreateAuditoria();
  const updateAuditoria = useUpdateAuditoria();
  const deleteAuditoria = useDeleteAuditoria();

  const auditoriaSchema = useMemo(() => buildAuditoriaSchema(t), [t]);

  const initialValues = useMemo<Partial<AuditoriaFormValues> | undefined>(
    () =>
      editItem
        ? {
            title: editItem.title,
            auditType: editItem.auditType,
            auditor: editItem.auditor,
            scheduledDate: editItem.scheduledDate,
            status: editItem.status,
            departmentId: editItem.departmentId ?? NONE,
            laboratoryId: editItem.laboratoryId ?? NONE,
            findings: editItem.findings ?? "",
            recommendations: editItem.recommendations ?? "",
          }
        : undefined,
    [editItem],
  );

  const entityForm = useEntityForm({
    schema: auditoriaSchema,
    initialValues,
    defaultValues: {
      title: "",
      auditType: "",
      auditor: "",
      scheduledDate: "",
      status: "planeada",
      departmentId: NONE,
      laboratoryId: NONE,
      findings: "",
      recommendations: "",
    },
    open: formOpen,
    onSubmit: async (values) => {
      const payload = {
        title: values.title,
        auditType: values.auditType,
        auditor: values.auditor,
        scheduledDate: values.scheduledDate,
        status: values.status,
        departmentId: values.departmentId === NONE ? null : values.departmentId,
        laboratoryId: values.laboratoryId === NONE ? null : values.laboratoryId,
        findings: values.findings?.trim() ? values.findings.trim() : null,
        recommendations: values.recommendations?.trim() ? values.recommendations.trim() : null,
      };
      if (editItem) {
        await updateAuditoria.mutateAsync({ id: editItem.id, payload });
      } else {
        await createAuditoria.mutateAsync(payload);
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

  const openEdit = (a: AuditoriaDto) => {
    setEditItem(a);
    setFormOpen(true);
  };

  const rows = data?.data ?? [];
  const kpiTotal = data?.meta.total ?? 0;
  const kpiCompleted = useMemo(() => rows.filter((a) => a.status === "concluida").length, [rows]);
  const kpiPending = useMemo(
    () => rows.filter((a) => a.status === "planeada" || a.status === "em_curso").length,
    [rows],
  );

  const statusLabel = (status: string) =>
    AUDIT_STATUS[status] ? t(`status.${status}`) : status;
  const statusVariant = (status: string) => AUDIT_STATUS[status]?.variant ?? "outline";
  const typeLabel = (type: string) =>
    (AUDIT_TYPE_KEYS as readonly string[]).includes(type) ? t(`types.${type}`) : type;
  const fmtDate = (value: string | null) => (value ? format(new Date(value), "dd/MM/yyyy") : "—");

  const generatePDF = async () => {
    await generateInstitutionalPdf({
      title: t("pdf.subtitle"),
      filename: t("pdf.filename"),
      sections: [
        {
          type: "table",
          head: [
            [
              t("table.title"),
              t("table.type"),
              t("table.auditor"),
              t("table.date"),
              t("table.status"),
            ],
          ],
          body: rows.map((a) => [
            a.title,
            typeLabel(a.auditType),
            a.auditor,
            fmtDate(a.scheduledDate),
            statusLabel(a.status),
          ]),
        },
      ],
    });
  };

  const columns = useMemo<ColumnDef<AuditoriaDto>[]>(
    () => [
      {
        accessorKey: "title",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.title")} />,
        cell: ({ row }) => (
          <div className="flex items-center gap-2 font-medium">
            <ClipboardCheck className="h-4 w-4 text-primary" />
            {row.original.title}
          </div>
        ),
      },
      {
        accessorKey: "auditType",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.type")} />,
        cell: ({ row }) => <Badge variant="secondary">{typeLabel(row.original.auditType)}</Badge>,
      },
      {
        accessorKey: "auditor",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.auditor")} />,
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.auditor}</span>,
      },
      {
        accessorKey: "scheduledDate",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.date")} />,
        cell: ({ row }) => fmtDate(row.original.scheduledDate),
      },
      {
        accessorKey: "status",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.status")} />,
        cell: ({ row }) => (
          <Badge variant={statusVariant(row.original.status)}>{statusLabel(row.original.status)}</Badge>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t],
  );

  const renderRowActions = (row: AuditoriaDto) => {
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

  const motionProps = prefersReduced
    ? {}
    : { initial: "hidden" as const, animate: "visible" as const, variants: fadeIn };

  return (
    <motion.div className="space-y-6" {...motionProps}>
      <AdminPageHeader icon={ClipboardCheck} title={t("page.title")} description={t("page.description")}>
        {rows.length > 0 && (
          <Button variant="outline" onClick={generatePDF}>
            <FileText className="mr-2 h-4 w-4" /> {t("actions.pdf")}
          </Button>
        )}
        <WriteGuard module="auditorias">
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> {t("actions.new")}
          </Button>
        </WriteGuard>
      </AdminPageHeader>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <AdminCard
          variant="gradient-green"
          icon={ClipboardCheck}
          metric={kpiTotal}
          title={t("kpis.total")}
          caption={t("kpis.totalCaption")}
          stagger={1}
        />
        <AdminCard
          variant="gradient-teal"
          icon={CheckCircle2}
          metric={kpiCompleted}
          title={t("kpis.completed")}
          caption={t("kpis.completedCaption")}
          stagger={2}
        />
        <AdminCard
          variant="gradient-gold"
          icon={CalendarClock}
          metric={kpiPending}
          title={t("kpis.pending")}
          caption={t("kpis.pendingCaption")}
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
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="auditType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.labels.auditType")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("form.placeholders.auditType")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {AUDIT_TYPE_KEYS.map((k) => (
                          <SelectItem key={k} value={k}>
                            {t(`types.${k}`)}
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
                name="scheduledDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.labels.scheduledDate")}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="auditor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.labels.auditor")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("form.placeholders.auditor")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="departmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.labels.department")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("form.placeholders.department")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NONE}>{t("form.placeholders.none")}</SelectItem>
                        {departamentos.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.name}
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
                name="laboratoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.labels.laboratory")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("form.placeholders.laboratory")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NONE}>{t("form.placeholders.none")}</SelectItem>
                        {laboratorios.map((l) => (
                          <SelectItem key={l.id} value={l.id}>
                            {l.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {editItem && (
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.labels.status")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {AUDIT_STATUS_KEYS.map((k) => (
                          <SelectItem key={k} value={k}>
                            {t(`status.${k}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="findings"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.labels.findings")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("form.placeholders.findings")}
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
              name="recommendations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.labels.recommendations")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("form.placeholders.recommendations")}
                      {...field}
                      value={field.value ?? ""}
                    />
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
          await deleteAuditoria.mutateAsync(deleteId);
          setDeleteId(null);
        }}
      />

      <Dialog open={!!viewItem} onOpenChange={(o) => !o && setViewItem(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">{t("dialog.detailsTitle")}</DialogTitle>
          </DialogHeader>
          {viewItem && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-muted-foreground">{t("details.title")}:</span>
                  <p className="font-medium">{viewItem.title}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("details.auditType")}:</span>
                  <p className="font-medium">{typeLabel(viewItem.auditType)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("details.auditor")}:</span>
                  <p className="font-medium">{viewItem.auditor}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("details.status")}:</span>
                  <p>
                    <Badge variant={statusVariant(viewItem.status)}>{statusLabel(viewItem.status)}</Badge>
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("details.scheduledDate")}:</span>
                  <p className="font-medium">{fmtDate(viewItem.scheduledDate)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("details.completedDate")}:</span>
                  <p className="font-medium">{fmtDate(viewItem.completedDate)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("details.department")}:</span>
                  <p className="font-medium">{viewItem.departmentName ?? "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("details.laboratory")}:</span>
                  <p className="font-medium">{viewItem.laboratoryName ?? "—"}</p>
                </div>
              </div>
              {viewItem.findings && (
                <div>
                  <span className="text-muted-foreground">{t("details.findings")}:</span>
                  <p className="font-medium mt-1 whitespace-pre-wrap">{viewItem.findings}</p>
                </div>
              )}
              {viewItem.recommendations && (
                <div>
                  <span className="text-muted-foreground">{t("details.recommendations")}:</span>
                  <p className="font-medium mt-1 whitespace-pre-wrap">{viewItem.recommendations}</p>
                </div>
              )}

              <AttachedDocsPanel entityType="audit" entityId={viewItem.id} />

              <div className="flex justify-end pt-2 border-t border-border/40">
                <OpenProcessButton
                  entityType="audit"
                  entityId={viewItem.id}
                  defaultTitle={`Auditoria: ${viewItem.title}`}
                  defaultTypeHint="Parecer Técnico"
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
