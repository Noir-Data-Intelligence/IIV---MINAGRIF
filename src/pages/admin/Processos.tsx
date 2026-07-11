import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "framer-motion";
import { z } from "zod";
import type { TFunction } from "i18next";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import {
  Workflow,
  Plus,
  Eye,
  AlertTriangle,
  Settings,
  Download,
  BarChart3,
  FolderOpen,
  Loader2,
  CheckCircle2,
  Clock,
} from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { RowActions, type RowAction } from "@/components/admin/RowActions";
import { WriteGuard } from "@/components/WriteGuard";
import { DataTable, DataTableColumnHeader } from "@/components/data-table";
import { EntityFormDialog } from "@/components/EntityFormDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { useTableExport } from "@/hooks/useTableExport";
import { useEntityForm } from "@/hooks/useEntityForm";
import { useProcessesList, useProcessStats, useCreateProcess } from "@/hooks/queries/useProcesses";
import { useProcessTypesList } from "@/hooks/queries/useProcessTypes";
import { PROCESS_PRIORITY, PROCESS_STATUS } from "@/lib/domain-enums";
import { fadeIn } from "@/lib/motion";
import type { ProcessDto, ProcessPriority, ProcessStatus } from "@/types/dto/process";
import i18n from "@/i18n";
import ptProcessos from "@/i18n/locales/pt/admin/processos.json";
import enProcessos from "@/i18n/locales/en/admin/processos.json";

// Namespace autónomo registado em runtime (o bundle central só regista common/nav).
if (!i18n.hasResourceBundle("pt", "admin-processos"))
  i18n.addResourceBundle("pt", "admin-processos", ptProcessos, true, true);
if (!i18n.hasResourceBundle("en", "admin-processos"))
  i18n.addResourceBundle("en", "admin-processos", enProcessos, true, true);

const STATUS_KEYS = Object.keys(PROCESS_STATUS);
const PRIORITY_KEYS = Object.keys(PROCESS_PRIORITY);
const ALL = "todos";

function buildProcessSchema(t: TFunction) {
  return z.object({
    typeId: z.string().min(1, t("validation.typeRequired")),
    title: z.string().trim().min(2, t("validation.titleShort")),
    description: z.string().trim().optional(),
    priority: z.string().min(1),
    dueDate: z.string().optional(),
  });
}
type ProcessFormValues = z.infer<ReturnType<typeof buildProcessSchema>>;

export default function Processos() {
  const { t } = useTranslation("admin-processos");
  const { user } = useAuth();
  const { toast } = useToast();
  const { isAdmin } = useUserRole();
  const { exportCSV } = useTableExport();
  const navigate = useNavigate();
  const prefersReduced = useReducedMotion();

  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(ALL);
  const [typeFilter, setTypeFilter] = useState(ALL);
  const [scope, setScope] = useState<"todos" | "meus">("todos");
  const [formOpen, setFormOpen] = useState(false);

  const { data, isLoading } = useProcessesList({
    page: pagination.pageIndex + 1,
    perPage: pagination.pageSize,
    search: search || undefined,
    status: statusFilter !== ALL ? (statusFilter as ProcessStatus) : undefined,
    typeId: typeFilter !== ALL ? typeFilter : undefined,
    requesterId: scope === "meus" && user ? user.id : undefined,
  });

  const { data: stats } = useProcessStats();
  const { data: typesData } = useProcessTypesList({ activeOnly: true, perPage: 100 });
  const types = typesData?.data ?? [];

  const createProcess = useCreateProcess();

  const processSchema = useMemo(() => buildProcessSchema(t), [t]);

  const entityForm = useEntityForm({
    schema: processSchema,
    defaultValues: { typeId: "", title: "", description: "", priority: "normal", dueDate: "" },
    open: formOpen,
    onSubmit: async (values) => {
      if (!user) {
        toast({ title: t("toast.requiredFields"), variant: "destructive" });
        throw new Error("no-user");
      }
      await createProcess.mutateAsync({
        typeId: values.typeId,
        title: values.title,
        description: values.description?.trim() ? values.description.trim() : null,
        priority: values.priority as ProcessPriority,
        dueDate: values.dueDate || null,
        requesterId: user.id,
      });
    },
    successMessage: t("toast.createSuccess"),
    errorMessage: t("toast.error"),
    onSuccess: () => setFormOpen(false),
  });

  const rows = data?.data ?? [];
  const typeName = (id: string) => types.find((ty) => ty.id === id)?.name ?? "—";

  const statusLabel = (s: string) => (PROCESS_STATUS[s] ? t(`status.${s}`) : s);
  const statusVariant = (s: string) => PROCESS_STATUS[s]?.variant ?? "outline";
  const priorityLabel = (p: string) => (PROCESS_PRIORITY[p] ? t(`priority.${p}`) : p);
  const priorityVariant = (p: string) => PROCESS_PRIORITY[p]?.variant ?? "outline";

  const isOverdue = (p: ProcessDto) =>
    !!p.dueDate &&
    p.status !== "concluido" &&
    p.status !== "cancelado" &&
    new Date(p.dueDate).getTime() < Date.now();

  const fmtDate = (value: string | null) =>
    value ? new Date(value).toLocaleDateString("pt-PT") : t("table.emptyCell");

  const handleExport = () => {
    exportCSV(
      rows.map((p) => ({
        code: p.code,
        title: p.title,
        type: typeName(p.typeId),
        priority: priorityLabel(p.priority),
        status: statusLabel(p.status),
        dueDate: p.dueDate ?? "",
        openedAt: new Date(p.openedAt).toLocaleDateString("pt-PT"),
      })),
      t("export.filename"),
      {
        headers: {
          code: t("export.headers.code"),
          title: t("export.headers.title"),
          type: t("export.headers.type"),
          priority: t("export.headers.priority"),
          status: t("export.headers.status"),
          dueDate: t("export.headers.dueDate"),
          openedAt: t("export.headers.openedAt"),
        },
      },
    );
  };

  const columns = useMemo<ColumnDef<ProcessDto>[]>(
    () => [
      {
        accessorKey: "code",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.code")} />,
        cell: ({ row }) => <span className="font-mono text-xs">{row.original.code}</span>,
      },
      {
        accessorKey: "title",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.title")} />,
        cell: ({ row }) => (
          <span className="font-medium max-w-[280px] truncate block">{row.original.title}</span>
        ),
      },
      {
        accessorKey: "typeId",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.type")} />,
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{typeName(row.original.typeId)}</span>,
      },
      {
        accessorKey: "priority",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.priority")} />,
        cell: ({ row }) => (
          <Badge variant={priorityVariant(row.original.priority)}>{priorityLabel(row.original.priority)}</Badge>
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
        accessorKey: "dueDate",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.dueDate")} />,
        cell: ({ row }) => {
          const p = row.original;
          if (!p.dueDate) return t("table.emptyCell");
          return (
            <span className={isOverdue(p) ? "text-destructive flex items-center gap-1" : ""}>
              {isOverdue(p) && <AlertTriangle className="h-3.5 w-3.5" />}
              {fmtDate(p.dueDate)}
            </span>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, types],
  );

  const renderRowActions = (row: ProcessDto) => (
    <RowActions
      primary={{ label: t("actions.open"), icon: Eye, onClick: () => navigate(`/admin/processos/${row.id}`) }}
      actions={[]}
    />
  );

  const motionProps = prefersReduced
    ? {}
    : { initial: "hidden" as const, animate: "visible" as const, variants: fadeIn };

  return (
    <motion.div className="space-y-6" {...motionProps}>
      <AdminPageHeader icon={Workflow} title={t("page.title")} description={t("page.description")}>
        <Button asChild variant="outline" className="gap-2">
          <Link to="/admin/processos/analitica">
            <BarChart3 className="h-4 w-4" /> {t("actions.analytics")}
          </Link>
        </Button>
        {isAdmin && (
          <Button asChild variant="outline" className="gap-2">
            <Link to="/admin/processos/tipos">
              <Settings className="h-4 w-4" /> {t("actions.types")}
            </Link>
          </Button>
        )}
        <WriteGuard module="processos">
          <Button onClick={() => setFormOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> {t("actions.new")}
          </Button>
        </WriteGuard>
      </AdminPageHeader>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <AdminCard
          variant="gradient-green"
          icon={FolderOpen}
          metric={stats?.abertos ?? 0}
          title={t("kpis.open")}
          caption={t("kpis.openCaption")}
          stagger={1}
        />
        <AdminCard
          variant="gradient-teal"
          icon={Loader2}
          metric={stats?.emCurso ?? 0}
          title={t("kpis.inProgress")}
          caption={t("kpis.inProgressCaption")}
          stagger={2}
        />
        <AdminCard
          variant="gradient-green-gold"
          icon={CheckCircle2}
          metric={stats?.concluidos ?? 0}
          title={t("kpis.completed")}
          caption={t("kpis.completedCaption")}
          stagger={3}
        />
        <AdminCard
          variant="gradient-gold"
          icon={Clock}
          metric={stats?.atrasados ?? 0}
          title={t("kpis.overdue")}
          caption={t("kpis.overdueCaption")}
          stagger={4}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="sm:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t("filters.allStatus")}</SelectItem>
            {STATUS_KEYS.map((k) => (
              <SelectItem key={k} value={k}>
                {t(`status.${k}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="sm:w-[210px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t("filters.allTypes")}</SelectItem>
            {types.map((ty) => (
              <SelectItem key={ty.id} value={ty.id}>
                {ty.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={scope} onValueChange={(v) => setScope(v as "todos" | "meus")}>
          <SelectTrigger className="sm:w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">{t("filters.scopeAll")}</SelectItem>
            <SelectItem value="meus">{t("filters.scopeMine")}</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          className="gap-2 sm:ml-auto"
          onClick={handleExport}
          disabled={rows.length === 0}
        >
          <Download className="h-4 w-4" /> {t("actions.export")}
        </Button>
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
        title={t("dialog.createTitle")}
        form={entityForm}
        submitLabel={t("form.submitCreate")}
        submittingLabel={t("form.submitting")}
        cancelLabel={t("form.cancel")}
      >
        {(form) => (
          <>
            <FormField
              control={form.control}
              name="typeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.labels.type")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("form.placeholders.type")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {types.map((ty) => (
                        <SelectItem key={ty.id} value={ty.id}>
                          {ty.name}
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
                      rows={3}
                      placeholder={t("form.placeholders.description")}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.labels.priority")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PRIORITY_KEYS.map((k) => (
                          <SelectItem key={k} value={k}>
                            {t(`priority.${k}`)}
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
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.labels.dueDate")}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </>
        )}
      </EntityFormDialog>
    </motion.div>
  );
}
