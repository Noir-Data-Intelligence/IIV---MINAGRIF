import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "framer-motion";
import { z } from "zod";
import type { TFunction } from "i18next";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import {
  AlertTriangle,
  ShieldAlert,
  CalendarX,
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
  useNaoConformidadesList,
  useCreateNaoConformidade,
  useDeleteNaoConformidade,
  useUpdateNaoConformidade,
} from "@/hooks/queries/useNaoConformidades";
import { useDepartamentosList } from "@/hooks/queries/useDepartamentos";
import { useAuditoriasList } from "@/hooks/queries/useAuditorias";
import { SEVERITY_LEVEL, NC_STATUS } from "@/lib/domain-enums";
import { generateInstitutionalPdf } from "@/lib/generateInstitutionalPdf";
import { fadeIn, fadeInUp, staggerContainer } from "@/lib/motion";
import type { NaoConformidadeDto } from "@/types/dto/naoConformidade";
import i18n from "@/i18n";
import ptNaoConformidades from "@/i18n/locales/pt/admin/nao-conformidades.json";
import enNaoConformidades from "@/i18n/locales/en/admin/nao-conformidades.json";

// Namespace autónomo registado em runtime (o bundle central só regista common/nav),
// seguindo o padrão de Auditorias.tsx / Departamentos.tsx.
if (!i18n.hasResourceBundle("pt", "admin-nao-conformidades"))
  i18n.addResourceBundle("pt", "admin-nao-conformidades", ptNaoConformidades, true, true);
if (!i18n.hasResourceBundle("en", "admin-nao-conformidades"))
  i18n.addResourceBundle("en", "admin-nao-conformidades", enNaoConformidades, true, true);

const SEVERITY_KEYS = Object.keys(SEVERITY_LEVEL);
const NC_STATUS_KEYS = Object.keys(NC_STATUS);
/** Sentinela para "sem departamento/auditoria" — o <Select> shadcn não aceita valor "". */
const NONE = "none";

function buildNaoConformidadeSchema(t: TFunction) {
  return z.object({
    title: z.string().trim().min(2, t("validation.titleShort")),
    description: z.string().trim().min(2, t("validation.descriptionShort")),
    severity: z.string().min(1, t("validation.severityRequired")),
    status: z.string().min(1),
    departmentId: z.string(),
    auditId: z.string(),
    deadline: z.string().optional(),
    correctiveAction: z.string().trim().optional(),
  });
}

type NaoConformidadeFormValues = z.infer<ReturnType<typeof buildNaoConformidadeSchema>>;

/** Uma NC ainda "por resolver" (não resolvida nem encerrada). */
function isOpen(nc: NaoConformidadeDto): boolean {
  return nc.status === "aberta" || nc.status === "em_resolucao";
}

/** Prazo vencido: tem prazo, não está resolvida, e a data já passou. */
function isOverdue(nc: NaoConformidadeDto): boolean {
  return Boolean(nc.deadline) && isOpen(nc) && new Date(nc.deadline as string) < new Date();
}

export default function NaoConformidades() {
  const { t } = useTranslation("admin-nao-conformidades");
  const { canWrite } = useUserRole();
  const canEdit = canWrite("nao-conformidades");
  const prefersReduced = useReducedMotion();

  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewItem, setViewItem] = useState<NaoConformidadeDto | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<NaoConformidadeDto | null>(null);

  const { data, isLoading } = useNaoConformidadesList({
    page: pagination.pageIndex + 1,
    perPage: pagination.pageSize,
    search: search || undefined,
  });

  // Selects de FK — usam os módulos já migrados (dados reais via MSW).
  const { data: deptData } = useDepartamentosList({ perPage: 100 });
  const { data: auditData } = useAuditoriasList({ perPage: 100 });
  const departamentos = deptData?.data ?? [];
  const auditorias = auditData?.data ?? [];

  const createNaoConformidade = useCreateNaoConformidade();
  const updateNaoConformidade = useUpdateNaoConformidade();
  const deleteNaoConformidade = useDeleteNaoConformidade();

  const ncSchema = useMemo(() => buildNaoConformidadeSchema(t), [t]);

  const initialValues = useMemo<Partial<NaoConformidadeFormValues> | undefined>(
    () =>
      editItem
        ? {
            title: editItem.title,
            description: editItem.description,
            severity: editItem.severity,
            status: editItem.status,
            departmentId: editItem.departmentId ?? NONE,
            auditId: editItem.auditId ?? NONE,
            deadline: editItem.deadline ?? "",
            correctiveAction: editItem.correctiveAction ?? "",
          }
        : undefined,
    [editItem],
  );

  const entityForm = useEntityForm({
    schema: ncSchema,
    initialValues,
    defaultValues: {
      title: "",
      description: "",
      severity: "menor",
      status: "aberta",
      departmentId: NONE,
      auditId: NONE,
      deadline: "",
      correctiveAction: "",
    },
    open: formOpen,
    onSubmit: async (values) => {
      const payload = {
        title: values.title,
        description: values.description,
        severity: values.severity,
        status: values.status,
        departmentId: values.departmentId === NONE ? null : values.departmentId,
        auditId: values.auditId === NONE ? null : values.auditId,
        deadline: values.deadline?.trim() ? values.deadline : null,
        correctiveAction: values.correctiveAction?.trim() ? values.correctiveAction.trim() : null,
      };
      if (editItem) {
        await updateNaoConformidade.mutateAsync({ id: editItem.id, payload });
      } else {
        await createNaoConformidade.mutateAsync(payload);
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

  const openEdit = (nc: NaoConformidadeDto) => {
    setEditItem(nc);
    setFormOpen(true);
  };

  const rows = data?.data ?? [];
  const kpiOpen = useMemo(() => rows.filter(isOpen).length, [rows]);
  const kpiCritical = useMemo(
    () => rows.filter((nc) => nc.severity === "critica" && isOpen(nc)).length,
    [rows],
  );
  const kpiOverdue = useMemo(() => rows.filter(isOverdue).length, [rows]);

  const severityLabel = (severity: string) =>
    SEVERITY_LEVEL[severity] ? t(`severity.${severity}`) : severity;
  const severityVariant = (severity: string) => SEVERITY_LEVEL[severity]?.variant ?? "secondary";
  const statusLabel = (status: string) => (NC_STATUS[status] ? t(`status.${status}`) : status);
  const statusVariant = (status: string) => NC_STATUS[status]?.variant ?? "outline";
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
              t("table.severity"),
              t("table.status"),
              t("table.department"),
              t("table.deadline"),
            ],
          ],
          body: rows.map((nc) => [
            nc.title,
            severityLabel(nc.severity),
            statusLabel(nc.status),
            nc.departmentName ?? "—",
            fmtDate(nc.deadline),
          ]),
        },
      ],
    });
  };

  const columns = useMemo<ColumnDef<NaoConformidadeDto>[]>(
    () => [
      {
        accessorKey: "title",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.title")} />,
        cell: ({ row }) => (
          <div className="flex items-center gap-2 font-medium">
            <AlertTriangle
              className={`h-4 w-4 ${
                row.original.severity === "critica" ? "text-destructive" : "text-secondary"
              }`}
            />
            {row.original.title}
          </div>
        ),
      },
      {
        accessorKey: "severity",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.severity")} />,
        cell: ({ row }) => (
          <Badge variant={severityVariant(row.original.severity)}>
            {severityLabel(row.original.severity)}
          </Badge>
        ),
      },
      {
        accessorKey: "status",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.status")} />,
        cell: ({ row }) => (
          <Badge variant={statusVariant(row.original.status)}>{statusLabel(row.original.status)}</Badge>
        ),
      },
      {
        accessorKey: "departmentName",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("table.department")} />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.departmentName ?? t("table.emptyCell")}
          </span>
        ),
      },
      {
        accessorKey: "deadline",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.deadline")} />,
        cell: ({ row }) =>
          row.original.deadline ? (
            <span className={isOverdue(row.original) ? "text-destructive font-medium" : ""}>
              {fmtDate(row.original.deadline)}
            </span>
          ) : (
            t("table.emptyCell")
          ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t],
  );

  const renderRowActions = (row: NaoConformidadeDto) => {
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

  const motionProps = prefersReduced
    ? {}
    : { initial: "hidden" as const, animate: "visible" as const, variants: fadeIn };

  return (
    <motion.div className="space-y-6" {...motionProps}>
      <AdminPageHeader icon={AlertTriangle} title={t("page.title")} description={t("page.description")}>
        {rows.length > 0 && (
          <Button variant="outline" onClick={generatePDF}>
            <FileText className="mr-2 h-4 w-4" /> {t("actions.pdf")}
          </Button>
        )}
        <WriteGuard module="nao-conformidades">
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> {t("actions.new")}
          </Button>
        </WriteGuard>
      </AdminPageHeader>

      <motion.div
        className="grid gap-4 grid-cols-1 sm:grid-cols-3"
        variants={prefersReduced ? undefined : staggerContainer}
        initial={prefersReduced ? undefined : "hidden"}
        animate={prefersReduced ? undefined : "visible"}
      >
        <motion.div variants={prefersReduced ? undefined : fadeInUp}>
          <AdminCard
            variant="gradient-green"
            icon={AlertTriangle}
            metric={kpiOpen}
            title={t("kpis.open")}
            caption={t("kpis.openCaption")}
          />
        </motion.div>
        <motion.div variants={prefersReduced ? undefined : fadeInUp}>
          <AdminCard
            variant="gradient-gold"
            icon={ShieldAlert}
            metric={kpiCritical}
            title={t("kpis.critical")}
            caption={t("kpis.criticalCaption")}
          />
        </motion.div>
        <motion.div variants={prefersReduced ? undefined : fadeInUp}>
          <AdminCard
            variant="gradient-teal"
            icon={CalendarX}
            metric={kpiOverdue}
            title={t("kpis.overdue")}
            caption={t("kpis.overdueCaption")}
          />
        </motion.div>
      </motion.div>

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
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.labels.description")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("form.placeholders.description")}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="severity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.labels.severity")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("form.placeholders.severity")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SEVERITY_KEYS.map((k) => (
                          <SelectItem key={k} value={k}>
                            {t(`severity.${k}`)}
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
                name="deadline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.labels.deadline")}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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
                name="auditId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.labels.audit")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("form.placeholders.audit")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NONE}>{t("form.placeholders.none")}</SelectItem>
                        {auditorias.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.title}
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
                        {NC_STATUS_KEYS.map((k) => (
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
              name="correctiveAction"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.labels.correctiveAction")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("form.placeholders.correctiveAction")}
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
          await deleteNaoConformidade.mutateAsync(deleteId);
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
                  <span className="text-muted-foreground">{t("details.severity")}:</span>
                  <p>
                    <Badge variant={severityVariant(viewItem.severity)}>
                      {severityLabel(viewItem.severity)}
                    </Badge>
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("details.status")}:</span>
                  <p>
                    <Badge variant={statusVariant(viewItem.status)}>
                      {statusLabel(viewItem.status)}
                    </Badge>
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("details.department")}:</span>
                  <p className="font-medium">{viewItem.departmentName ?? "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("details.audit")}:</span>
                  <p className="font-medium">{viewItem.auditTitle ?? "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("details.deadline")}:</span>
                  <p className="font-medium">{fmtDate(viewItem.deadline)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("details.resolvedAt")}:</span>
                  <p className="font-medium">{fmtDate(viewItem.resolvedAt)}</p>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">{t("details.description")}:</span>
                <p className="font-medium mt-1 whitespace-pre-wrap">{viewItem.description}</p>
              </div>
              {viewItem.correctiveAction && (
                <div>
                  <span className="text-muted-foreground">{t("details.correctiveAction")}:</span>
                  <p className="font-medium mt-1 whitespace-pre-wrap">{viewItem.correctiveAction}</p>
                </div>
              )}

              <AttachedDocsPanel entityType="nonconformity" entityId={viewItem.id} />

              <div className="flex justify-end pt-2 border-t border-border/40">
                <OpenProcessButton
                  entityType="nonconformity"
                  entityId={viewItem.id}
                  defaultTitle={`NC: ${viewItem.title}`}
                  defaultTypeHint="Não Conformidade"
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
