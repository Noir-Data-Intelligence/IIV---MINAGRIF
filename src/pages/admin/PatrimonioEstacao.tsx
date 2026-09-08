import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "framer-motion";
import { z } from "zod";
import type { TFunction } from "i18next";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import {
  Package, Boxes, Wrench, CircleDollarSign, AlertTriangle, CalendarClock,
  Plus, Eye, Pencil, Trash2,
} from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { RowActions, type RowAction } from "@/components/admin/RowActions";
import { WriteGuard } from "@/components/WriteGuard";
import { DataTable, DataTableColumnHeader } from "@/components/data-table";
import { EntityFormDialog } from "@/components/EntityFormDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEntityForm } from "@/hooks/useEntityForm";
import { useUserRole } from "@/hooks/useUserRole";
import { formatDate, formatKwanza } from "@/lib/format";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import {
  useAssetsEstacaoList,
  useCreateAssetEstacao,
  useUpdateAssetEstacao,
  useDeleteAssetEstacao,
  useMaintenancesEstacaoList,
  useCreateMaintenanceEstacao,
  useUpdateMaintenanceEstacao,
  useDeleteMaintenanceEstacao,
} from "@/hooks/queries/usePatrimonioEstacao";
import { useEstacoesList } from "@/hooks/queries/useEstacoes";
import { useDepartamentosList } from "@/hooks/queries/useDepartamentos";
import { useUsersList } from "@/hooks/queries/useUsers";
import type {
  AssetEstacaoDto,
  AssetCategory,
  AssetStatus,
  MaintenanceEstacaoDto,
  MaintenanceType,
} from "@/types/dto/patrimonioEstacao";
import i18n from "@/i18n";
import ptPatrimonioEstacao from "@/i18n/locales/pt/admin/patrimonioEstacao.json";
import enPatrimonioEstacao from "@/i18n/locales/en/admin/patrimonioEstacao.json";

// Namespace autónomo registado em runtime, seguindo o padrão de Documentos.tsx.
if (!i18n.hasResourceBundle("pt", "admin-patrimonio-estacao"))
  i18n.addResourceBundle("pt", "admin-patrimonio-estacao", ptPatrimonioEstacao, true, true);
if (!i18n.hasResourceBundle("en", "admin-patrimonio-estacao"))
  i18n.addResourceBundle("en", "admin-patrimonio-estacao", enPatrimonioEstacao, true, true);

const ASSET_STATUSES: AssetStatus[] = [
  "activo", "em_manutencao", "avariado", "abatido", "reservado",
];
const ASSET_CATEGORIES: AssetCategory[] = [
  "equipamento_laboratorio", "viatura", "energia", "refrigeracao",
  "informatica", "mobiliario", "outros",
];
const MAINT_TYPES: MaintenanceType[] = [
  "preventiva", "correctiva", "inspeccao", "calibracao",
];

const statusVariant: Record<AssetStatus, "default" | "secondary" | "destructive" | "outline"> = {
  activo: "default",
  em_manutencao: "secondary",
  avariado: "destructive",
  abatido: "outline",
  reservado: "outline",
};

/** Sentinela usado nos Selects opcionais (o SelectItem não aceita valor ""). */
const NONE = "__none__";

// --- Schemas ---------------------------------------------------------------

function buildAssetSchema(t: TFunction) {
  const cost = (msg: string) =>
    z.string().trim().refine((v) => v !== "" && !Number.isNaN(Number(v)) && Number(v) >= 0, msg);
  const optionalCost = (msg: string) =>
    z.string().trim().optional().refine((v) => !v || (!Number.isNaN(Number(v)) && Number(v) >= 0), msg);

  return z.object({
    code: z.string().trim().min(2, t("validation.codeShort")),
    name: z.string().trim().min(2, t("validation.nameShort")),
    category: z.enum([
      "equipamento_laboratorio", "viatura", "energia", "refrigeracao",
      "informatica", "mobiliario", "outros",
    ]),
    // Descrição obrigatória em Estação (auditoria 01/09/2026, secção 21) —
    // ao contrário de Património Central, que a mantém opcional.
    description: z.string().trim().min(3, t("validation.descriptionShort")),
    location: z.string().trim().optional(),
    stationId: z.string().min(1, t("validation.stationRequired")),
    departmentId: z.string().optional(),
    /**
     * Auditoria funcional (01/09/2026, secção 21): "Associar Responsável ao
     * Departamento" — o Responsável passa a ser uma referência a um
     * Utilizador existente (em vez de texto livre), permitindo derivar o
     * Departamento apresentado a partir desse utilizador.
     */
    responsibleUserId: z.string().optional(),
    acquisitionDate: z.string().optional(),
    acquisitionCost: cost(t("validation.costInvalid")),
    currentValue: optionalCost(t("validation.costInvalid")),
    serialNumber: z.string().trim().optional(),
    status: z.enum(["activo", "em_manutencao", "avariado", "abatido", "reservado"]),
    notes: z.string().trim().optional(),
  });
}
type AssetFormValues = z.infer<ReturnType<typeof buildAssetSchema>>;

function buildMaintenanceSchema(t: TFunction) {
  return z.object({
    assetId: z.string().min(1, t("validation.assetRequired")),
    date: z.string().min(1),
    type: z.enum(["preventiva", "correctiva", "inspeccao", "calibracao"]),
    description: z.string().trim().min(3, t("validation.descriptionShort")),
    cost: z.string().trim().refine(
      (v) => v === "" || (!Number.isNaN(Number(v)) && Number(v) >= 0),
      t("validation.costInvalid"),
    ),
    provider: z.string().trim().optional(),
    nextDueDate: z.string().optional(),
    notes: z.string().trim().optional(),
  });
}
type MaintenanceFormValues = z.infer<ReturnType<typeof buildMaintenanceSchema>>;

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function PatrimonioEstacao() {
  const { t } = useTranslation("admin-patrimonio-estacao");
  const { canWrite } = useUserRole();
  const canEdit = canWrite("patrimonio");
  const reduceMotion = useReducedMotion();

  // --- Activos: estado de tabela ---
  const [assetPagination, setAssetPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [assetSearch, setAssetSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [categoryFilter, setCategoryFilter] = useState<string>("todas");
  const [assetFormOpen, setAssetFormOpen] = useState(false);
  const [assetEdit, setAssetEdit] = useState<AssetEstacaoDto | null>(null);
  const [assetView, setAssetView] = useState<AssetEstacaoDto | null>(null);
  const [assetDeleteId, setAssetDeleteId] = useState<string | null>(null);

  // --- Manutenções: estado de tabela ---
  const [maintPagination, setMaintPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [maintSearch, setMaintSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("todos");
  const [maintFormOpen, setMaintFormOpen] = useState(false);
  const [maintEdit, setMaintEdit] = useState<MaintenanceEstacaoDto | null>(null);
  const [maintDeleteId, setMaintDeleteId] = useState<string | null>(null);

  const { data: assetsData, isLoading: assetsLoading } = useAssetsEstacaoList({
    page: assetPagination.pageIndex + 1,
    perPage: assetPagination.pageSize,
    search: assetSearch || undefined,
    status: statusFilter !== "todos" ? statusFilter : undefined,
    category: categoryFilter !== "todas" ? categoryFilter : undefined,
  });
  const { data: maintData, isLoading: maintLoading } = useMaintenancesEstacaoList({
    page: maintPagination.pageIndex + 1,
    perPage: maintPagination.pageSize,
    search: maintSearch || undefined,
    type: typeFilter !== "todos" ? typeFilter : undefined,
  });

  // Datasets completos (sem filtros) para KPIs precisos e para popular Selects/lookup.
  const assetsStats = useAssetsEstacaoList({ page: 1, perPage: 1000 });
  const maintStats = useMaintenancesEstacaoList({ page: 1, perPage: 1000 });
  const allAssets = useMemo(() => assetsStats.data?.data ?? [], [assetsStats.data]);
  const allMaints = useMemo(() => maintStats.data?.data ?? [], [maintStats.data]);

  const { data: estacoesData } = useEstacoesList({ page: 1, perPage: 1000 });
  const { data: departamentosData } = useDepartamentosList({ page: 1, perPage: 1000 });
  const estacoes = estacoesData?.data ?? [];
  const departamentos = departamentosData?.data ?? [];
  const { data: users = [] } = useUsersList({});

  const createAsset = useCreateAssetEstacao();
  const updateAsset = useUpdateAssetEstacao();
  const deleteAsset = useDeleteAssetEstacao();
  const createMaint = useCreateMaintenanceEstacao();
  const updateMaint = useUpdateMaintenanceEstacao();
  const deleteMaint = useDeleteMaintenanceEstacao();

  // --- KPIs ---
  const kpis = useMemo(() => {
    const total = assetsStats.data?.meta.total ?? allAssets.length;
    const value = allAssets.reduce((s, a) => s + Number(a.currentValue ?? a.acquisitionCost ?? 0), 0);
    const attention = allAssets.filter(
      (a) => a.status === "em_manutencao" || a.status === "avariado",
    ).length;
    const today = todayISO();
    const upcoming = allMaints.filter((m) => m.nextDueDate && m.nextDueDate >= today).length;
    return { total, value, attention, upcoming };
  }, [assetsStats.data, allAssets, allMaints]);

  // --- Lookups ---
  const assetLabel = (id: string) => {
    const a = allAssets.find((x) => x.id === id);
    return a ? `${a.code} — ${a.name}` : t("assets.table.emptyCell");
  };
  const stationName = (id: string) =>
    estacoes.find((s) => s.id === id)?.name ?? t("assets.table.emptyCell");
  const departmentName = (id: string | null) =>
    id ? departamentos.find((d) => d.id === id)?.name ?? t("assets.table.emptyCell") : t("assets.table.emptyCell");
  const responsibleUserName = (id: string | null) =>
    id ? users.find((u) => u.id === id)?.fullName ?? t("assets.table.emptyCell") : t("assets.table.emptyCell");

  // --- Formulário de Activo ---
  const assetSchema = useMemo(() => buildAssetSchema(t), [t]);
  const assetInitial = useMemo<Partial<AssetFormValues> | undefined>(
    () =>
      assetEdit
        ? {
            code: assetEdit.code,
            name: assetEdit.name,
            category: assetEdit.category,
            description: assetEdit.description ?? "",
            location: assetEdit.location ?? "",
            stationId: assetEdit.stationId,
            departmentId: assetEdit.departmentId ?? "",
            responsibleUserId: assetEdit.responsibleUserId ?? "",
            acquisitionDate: assetEdit.acquisitionDate ?? "",
            acquisitionCost: String(assetEdit.acquisitionCost ?? 0),
            currentValue: assetEdit.currentValue != null ? String(assetEdit.currentValue) : "",
            serialNumber: assetEdit.serialNumber ?? "",
            status: assetEdit.status,
            notes: assetEdit.notes ?? "",
          }
        : undefined,
    [assetEdit],
  );

  const assetForm = useEntityForm({
    schema: assetSchema,
    initialValues: assetInitial,
    defaultValues: {
      code: "", name: "", category: "equipamento_laboratorio", description: "", location: "",
      stationId: "", departmentId: "", responsibleUserId: "", acquisitionDate: "",
      acquisitionCost: "0", currentValue: "", serialNumber: "", status: "activo", notes: "",
    },
    open: assetFormOpen,
    onSubmit: async (values) => {
      const payload: Partial<AssetEstacaoDto> = {
        code: values.code,
        name: values.name,
        category: values.category,
        description: values.description.trim(),
        location: values.location?.trim() || null,
        stationId: values.stationId,
        departmentId: values.departmentId || null,
        responsibleUserId: values.responsibleUserId || null,
        acquisitionDate: values.acquisitionDate || null,
        acquisitionCost: Number(values.acquisitionCost),
        currentValue: values.currentValue?.trim() ? Number(values.currentValue) : null,
        serialNumber: values.serialNumber?.trim() || null,
        status: values.status,
        notes: values.notes?.trim() || null,
      };
      if (assetEdit) {
        await updateAsset.mutateAsync({ id: assetEdit.id, payload });
      } else {
        await createAsset.mutateAsync(payload);
      }
    },
    successMessage: assetEdit ? t("toast.assetUpdateSuccess") : t("toast.assetCreateSuccess"),
    errorMessage: t("toast.error"),
    onSuccess: () => setAssetFormOpen(false),
  });

  // --- Formulário de Manutenção ---
  const maintSchema = useMemo(() => buildMaintenanceSchema(t), [t]);
  const maintInitial = useMemo<Partial<MaintenanceFormValues> | undefined>(
    () =>
      maintEdit
        ? {
            assetId: maintEdit.assetId,
            date: maintEdit.date,
            type: maintEdit.type,
            description: maintEdit.description,
            cost: String(maintEdit.cost ?? 0),
            provider: maintEdit.provider ?? "",
            nextDueDate: maintEdit.nextDueDate ?? "",
            notes: maintEdit.notes ?? "",
          }
        : undefined,
    [maintEdit],
  );

  const maintForm = useEntityForm({
    schema: maintSchema,
    initialValues: maintInitial,
    defaultValues: {
      assetId: "", date: todayISO(), type: "preventiva", description: "",
      cost: "0", provider: "", nextDueDate: "", notes: "",
    },
    open: maintFormOpen,
    onSubmit: async (values) => {
      const payload: Partial<MaintenanceEstacaoDto> = {
        assetId: values.assetId,
        date: values.date,
        type: values.type,
        description: values.description,
        cost: values.cost?.trim() ? Number(values.cost) : 0,
        provider: values.provider?.trim() || null,
        nextDueDate: values.nextDueDate || null,
        notes: values.notes?.trim() || null,
      };
      if (maintEdit) {
        await updateMaint.mutateAsync({ id: maintEdit.id, payload });
      } else {
        await createMaint.mutateAsync(payload);
      }
    },
    successMessage: maintEdit ? t("toast.maintUpdateSuccess") : t("toast.maintCreateSuccess"),
    errorMessage: t("toast.error"),
    onSuccess: () => setMaintFormOpen(false),
  });

  const openAssetCreate = () => { setAssetEdit(null); setAssetFormOpen(true); };
  const openAssetEdit = (a: AssetEstacaoDto) => { setAssetEdit(a); setAssetFormOpen(true); };
  const openMaintCreate = () => { setMaintEdit(null); setMaintFormOpen(true); };
  const openMaintEdit = (m: MaintenanceEstacaoDto) => { setMaintEdit(m); setMaintFormOpen(true); };

  // --- Colunas: Activos ---
  const assetColumns = useMemo<ColumnDef<AssetEstacaoDto>[]>(
    () => [
      {
        accessorKey: "code",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("assets.table.code")} />,
        cell: ({ row }) => <span className="font-medium">{row.original.code}</span>,
      },
      {
        accessorKey: "name",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("assets.table.name")} />,
        cell: ({ row }) => (
          <div className="max-w-[260px]">
            <div className="font-medium truncate">{row.original.name}</div>
            {row.original.serialNumber && (
              <div className="text-xs text-muted-foreground">{row.original.serialNumber}</div>
            )}
          </div>
        ),
      },
      {
        id: "category",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("assets.table.category")} />,
        cell: ({ row }) => <Badge variant="outline">{t(`category.${row.original.category}`)}</Badge>,
      },
      {
        id: "station",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("assets.form.labels.station")} />,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{stationName(row.original.stationId)}</span>
        ),
      },
      {
        accessorKey: "currentValue",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("assets.table.value")} />,
        cell: ({ row }) => (
          <span className="text-sm tabular-nums">
            {formatKwanza(Number(row.original.currentValue ?? row.original.acquisitionCost))}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("assets.table.status")} />,
        cell: ({ row }) => (
          <Badge variant={statusVariant[row.original.status]}>{t(`status.${row.original.status}`)}</Badge>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, estacoes],
  );

  // --- Colunas: Manutenções ---
  const maintColumns = useMemo<ColumnDef<MaintenanceEstacaoDto>[]>(
    () => [
      {
        accessorKey: "date",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("maintenances.table.date")} />,
        cell: ({ row }) => <span className="text-sm">{formatDate(row.original.date)}</span>,
      },
      {
        id: "asset",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("maintenances.table.asset")} />,
        cell: ({ row }) => <span className="text-xs">{assetLabel(row.original.assetId)}</span>,
      },
      {
        accessorKey: "type",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("maintenances.table.type")} />,
        cell: ({ row }) => <Badge variant="outline">{t(`maintType.${row.original.type}`)}</Badge>,
      },
      {
        accessorKey: "description",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("maintenances.table.description")} />,
        cell: ({ row }) => (
          <span className="text-sm max-w-[280px] truncate block" title={row.original.description}>
            {row.original.description}
          </span>
        ),
      },
      {
        accessorKey: "cost",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("maintenances.table.cost")} />,
        cell: ({ row }) => <span className="text-sm tabular-nums">{formatKwanza(Number(row.original.cost))}</span>,
      },
      {
        accessorKey: "nextDueDate",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("maintenances.table.nextDue")} />,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.nextDueDate ? formatDate(row.original.nextDueDate) : t("maintenances.table.emptyCell")}
          </span>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, allAssets],
  );

  const renderAssetActions = (row: AssetEstacaoDto) => {
    const actions: RowAction[] = [];
    if (canEdit) {
      actions.push({ label: t("assets.actions.edit"), icon: Pencil, onClick: () => openAssetEdit(row) });
      actions.push({ label: t("assets.actions.delete"), icon: Trash2, destructive: true, onClick: () => setAssetDeleteId(row.id) });
    }
    return <RowActions primary={{ label: t("assets.actions.view"), icon: Eye, onClick: () => setAssetView(row) }} actions={actions} />;
  };

  const renderMaintActions = (row: MaintenanceEstacaoDto) => {
    const actions: RowAction[] = [];
    if (canEdit) {
      actions.push({ label: t("maintenances.actions.edit"), icon: Pencil, onClick: () => openMaintEdit(row) });
      actions.push({ label: t("maintenances.actions.delete"), icon: Trash2, destructive: true, onClick: () => setMaintDeleteId(row.id) });
    }
    return <RowActions actions={actions} />;
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader icon={Package} title={t("page.title")} description={t("page.description")} />

      {/* KPIs */}
      <motion.div
        className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
        variants={reduceMotion ? undefined : staggerContainer}
        initial={reduceMotion ? undefined : "hidden"}
        animate={reduceMotion ? undefined : "visible"}
      >
        <motion.div variants={reduceMotion ? undefined : fadeInUp}>
          <AdminCard variant="gradient-green-gold" icon={Boxes} metric={kpis.total} title={t("kpis.totalAssets")} caption={t("kpis.totalAssetsCaption")} />
        </motion.div>
        <motion.div variants={reduceMotion ? undefined : fadeInUp}>
          <AdminCard variant="glass" icon={CircleDollarSign} metric={formatKwanza(kpis.value)} title={t("kpis.totalValue")} caption={t("kpis.totalValueCaption")} />
        </motion.div>
        <motion.div variants={reduceMotion ? undefined : fadeInUp}>
          <AdminCard variant={kpis.attention > 0 ? "gradient-gold" : "glass"} icon={AlertTriangle} metric={kpis.attention} title={t("kpis.needsAttention")} caption={t("kpis.needsAttentionCaption")} />
        </motion.div>
        <motion.div variants={reduceMotion ? undefined : fadeInUp}>
          <AdminCard variant="glass" icon={CalendarClock} metric={kpis.upcoming} title={t("kpis.upcoming")} caption={t("kpis.upcomingCaption")} />
        </motion.div>
      </motion.div>

      <Tabs defaultValue="assets" className="space-y-4">
        <TabsList>
          <TabsTrigger value="assets"><Boxes className="h-4 w-4 mr-1.5" /> {t("tabs.assets")}</TabsTrigger>
          <TabsTrigger value="maintenances"><Wrench className="h-4 w-4 mr-1.5" /> {t("tabs.maintenances")}</TabsTrigger>
        </TabsList>

        {/* --- ACTIVOS --- */}
        <TabsContent value="assets" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setAssetPagination((p) => ({ ...p, pageIndex: 0 })); }}>
              <SelectTrigger className="sm:w-[200px]"><SelectValue placeholder={t("filters.statusPlaceholder")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">{t("filters.statusAll")}</SelectItem>
                {ASSET_STATUSES.map((s) => <SelectItem key={s} value={s}>{t(`status.${s}`)}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setAssetPagination((p) => ({ ...p, pageIndex: 0 })); }}>
              <SelectTrigger className="sm:w-[220px]"><SelectValue placeholder={t("filters.categoryPlaceholder")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">{t("filters.categoryAll")}</SelectItem>
                {ASSET_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{t(`category.${c}`)}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="sm:ml-auto">
              <WriteGuard module="patrimonio">
                <Button onClick={openAssetCreate}><Plus className="mr-2 h-4 w-4" /> {t("assets.actions.new")}</Button>
              </WriteGuard>
            </div>
          </div>

          <DataTable
            columns={assetColumns}
            data={assetsData?.data ?? []}
            loading={assetsLoading}
            pageCount={assetsData?.meta.lastPage ?? 0}
            pagination={assetPagination}
            onPaginationChange={setAssetPagination}
            rowCount={assetsData?.meta.total}
            globalFilter={assetSearch}
            onGlobalFilterChange={setAssetSearch}
            searchPlaceholder={t("assets.table.searchPlaceholder")}
            emptyMessage={t("assets.table.empty")}
            renderRowActions={renderAssetActions}
          />
        </TabsContent>

        {/* --- MANUTENÇÕES --- */}
        <TabsContent value="maintenances" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setMaintPagination((p) => ({ ...p, pageIndex: 0 })); }}>
              <SelectTrigger className="sm:w-[200px]"><SelectValue placeholder={t("filters.typePlaceholder")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">{t("filters.typeAll")}</SelectItem>
                {MAINT_TYPES.map((mt) => <SelectItem key={mt} value={mt}>{t(`maintType.${mt}`)}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="sm:ml-auto">
              <WriteGuard module="patrimonio">
                <Button onClick={openMaintCreate} disabled={allAssets.length === 0}>
                  <Plus className="mr-2 h-4 w-4" /> {t("maintenances.actions.new")}
                </Button>
              </WriteGuard>
            </div>
          </div>

          <DataTable
            columns={maintColumns}
            data={maintData?.data ?? []}
            loading={maintLoading}
            pageCount={maintData?.meta.lastPage ?? 0}
            pagination={maintPagination}
            onPaginationChange={setMaintPagination}
            rowCount={maintData?.meta.total}
            globalFilter={maintSearch}
            onGlobalFilterChange={setMaintSearch}
            searchPlaceholder={t("maintenances.table.searchPlaceholder")}
            emptyMessage={t("maintenances.table.empty")}
            renderRowActions={renderMaintActions}
          />
        </TabsContent>
      </Tabs>

      {/* --- Dialog: Activo --- */}
      <EntityFormDialog
        open={assetFormOpen}
        onOpenChange={setAssetFormOpen}
        title={assetEdit ? t("assets.dialog.editTitle") : t("assets.dialog.createTitle")}
        form={assetForm}
        submitLabel={assetEdit ? t("form.submitEdit") : t("form.submitCreate")}
        submittingLabel={t("form.submitting")}
        cancelLabel={t("form.cancel")}
      >
        {(form) => (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="code" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("assets.form.labels.code")}</FormLabel>
                  <FormControl><Input placeholder={t("assets.form.placeholders.code")} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("assets.form.labels.category")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {ASSET_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{t(`category.${c}`)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("assets.form.labels.name")}</FormLabel>
                <FormControl><Input placeholder={t("assets.form.placeholders.name")} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("assets.form.labels.description")}</FormLabel>
                <FormControl><Textarea rows={2} placeholder={t("assets.form.placeholders.description")} {...field} value={field.value ?? ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="location" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("assets.form.labels.location")}</FormLabel>
                  <FormControl><Input placeholder={t("assets.form.placeholders.location")} {...field} value={field.value ?? ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="serialNumber" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("assets.form.labels.serialNumber")}</FormLabel>
                  <FormControl><Input placeholder={t("assets.form.placeholders.serialNumber")} {...field} value={field.value ?? ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="stationId" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("assets.form.labels.station")}</FormLabel>
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue placeholder={t("assets.form.placeholders.stationSelect")} /></SelectTrigger></FormControl>
                    <SelectContent>
                      {estacoes.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="departmentId" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("assets.form.labels.department")}</FormLabel>
                  <Select value={field.value || NONE} onValueChange={(v) => field.onChange(v === NONE ? "" : v)}>
                    <FormControl><SelectTrigger><SelectValue placeholder={t("assets.form.placeholders.none")} /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value={NONE}>{t("assets.form.placeholders.none")}</SelectItem>
                      {departamentos.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="responsibleUserId" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("assets.form.labels.responsibleUser")}</FormLabel>
                  <Select
                    value={field.value || NONE}
                    onValueChange={(v) => {
                      const userId = v === NONE ? "" : v;
                      field.onChange(userId);
                      // Auditoria 01/09/2026: associar Responsável ao Departamento —
                      // ao escolher o responsável, deriva-se o Departamento a partir
                      // desse utilizador quando o campo ainda não tiver sido definido.
                      if (userId && !form.getValues("departmentId")) {
                        const chosen = users.find((u) => u.id === userId);
                        if (chosen?.departmentIds?.[0]) form.setValue("departmentId", chosen.departmentIds[0]);
                      }
                    }}
                  >
                    <FormControl><SelectTrigger><SelectValue placeholder={t("assets.form.placeholders.responsibleUserSelect")} /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value={NONE}>{t("assets.form.placeholders.none")}</SelectItem>
                      {users.map((u) => <SelectItem key={u.id} value={u.id}>{u.fullName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("assets.form.labels.status")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {ASSET_STATUSES.map((s) => <SelectItem key={s} value={s}>{t(`status.${s}`)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="acquisitionDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("assets.form.labels.acquisitionDate")}</FormLabel>
                  <FormControl><Input type="date" {...field} value={field.value ?? ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="acquisitionCost" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("assets.form.labels.acquisitionCost")}</FormLabel>
                  <FormControl><Input type="number" min="0" step="1000" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="currentValue" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("assets.form.labels.currentValue")}</FormLabel>
                  <FormControl><Input type="number" min="0" step="1000" {...field} value={field.value ?? ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("assets.form.labels.notes")}</FormLabel>
                <FormControl><Textarea rows={2} placeholder={t("assets.form.placeholders.notes")} {...field} value={field.value ?? ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </>
        )}
      </EntityFormDialog>

      {/* --- Dialog: Manutenção --- */}
      <EntityFormDialog
        open={maintFormOpen}
        onOpenChange={setMaintFormOpen}
        title={maintEdit ? t("maintenances.dialog.editTitle") : t("maintenances.dialog.createTitle")}
        form={maintForm}
        submitLabel={maintEdit ? t("form.submitEdit") : t("form.submitCreate")}
        submittingLabel={t("form.submitting")}
        cancelLabel={t("form.cancel")}
      >
        {(form) => (
          <>
            <FormField control={form.control} name="assetId" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("maintenances.form.labels.asset")}</FormLabel>
                <Select value={field.value || undefined} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger><SelectValue placeholder={t("maintenances.form.placeholders.assetSelect")} /></SelectTrigger></FormControl>
                  <SelectContent>
                    {allAssets.map((a) => <SelectItem key={a.id} value={a.id}>{a.code} — {a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField control={form.control} name="date" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("maintenances.form.labels.date")}</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("maintenances.form.labels.type")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {MAINT_TYPES.map((mt) => <SelectItem key={mt} value={mt}>{t(`maintType.${mt}`)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="cost" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("maintenances.form.labels.cost")}</FormLabel>
                  <FormControl><Input type="number" min="0" step="1000" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("maintenances.form.labels.description")}</FormLabel>
                <FormControl><Input placeholder={t("maintenances.form.placeholders.description")} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="provider" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("maintenances.form.labels.provider")}</FormLabel>
                  <FormControl><Input placeholder={t("maintenances.form.placeholders.provider")} {...field} value={field.value ?? ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="nextDueDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("maintenances.form.labels.nextDueDate")}</FormLabel>
                  <FormControl><Input type="date" {...field} value={field.value ?? ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("maintenances.form.labels.notes")}</FormLabel>
                <FormControl><Textarea rows={2} placeholder={t("maintenances.form.placeholders.notes")} {...field} value={field.value ?? ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </>
        )}
      </EntityFormDialog>

      {/* --- Delete confirms --- */}
      <DeleteConfirmDialog
        open={!!assetDeleteId}
        onOpenChange={(o) => !o && setAssetDeleteId(null)}
        title={t("delete.title")}
        description={t("delete.description")}
        onConfirm={async () => {
          if (!assetDeleteId) return;
          await deleteAsset.mutateAsync(assetDeleteId);
          setAssetDeleteId(null);
        }}
      />
      <DeleteConfirmDialog
        open={!!maintDeleteId}
        onOpenChange={(o) => !o && setMaintDeleteId(null)}
        title={t("delete.title")}
        description={t("delete.description")}
        onConfirm={async () => {
          if (!maintDeleteId) return;
          await deleteMaint.mutateAsync(maintDeleteId);
          setMaintDeleteId(null);
        }}
      />

      {/* --- Dialog: Detalhes do Activo --- */}
      <Dialog open={!!assetView} onOpenChange={(o) => !o && setAssetView(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-serif">
              <Package className="h-5 w-5 text-primary" /> {assetView?.name}
            </DialogTitle>
          </DialogHeader>
          {assetView && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{assetView.code}</Badge>
                <Badge variant="outline">{t(`category.${assetView.category}`)}</Badge>
                <Badge variant={statusVariant[assetView.status]}>{t(`status.${assetView.status}`)}</Badge>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">{t("assets.details.location")}</p>
                  <p className="font-medium">{assetView.location ?? t("assets.table.emptyCell")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("assets.form.labels.station")}</p>
                  <p className="font-medium">{stationName(assetView.stationId)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("assets.form.labels.department")}</p>
                  <p className="font-medium">{departmentName(assetView.departmentId)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("assets.details.responsibleUser")}</p>
                  <p className="font-medium">{responsibleUserName(assetView.responsibleUserId)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("assets.details.serialNumber")}</p>
                  <p className="font-medium">{assetView.serialNumber ?? t("assets.table.emptyCell")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("assets.details.acquisitionDate")}</p>
                  <p className="font-medium">{assetView.acquisitionDate ? formatDate(assetView.acquisitionDate) : t("assets.table.emptyCell")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("assets.details.acquisitionCost")}</p>
                  <p className="font-medium tabular-nums">{formatKwanza(Number(assetView.acquisitionCost))}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("assets.details.currentValue")}</p>
                  <p className="font-medium tabular-nums">
                    {assetView.currentValue != null ? formatKwanza(Number(assetView.currentValue)) : t("assets.table.emptyCell")}
                  </p>
                </div>
              </div>
              {assetView.description && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{t("assets.details.description")}</p>
                  <p className="text-sm">{assetView.description}</p>
                </div>
              )}
              {assetView.notes && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{t("assets.details.notes")}</p>
                  <p className="text-sm">{assetView.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
