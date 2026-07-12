import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "framer-motion";
import { z } from "zod";
import type { TFunction } from "i18next";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import {
  Boxes, Package, Warehouse, ArrowLeftRight, AlertTriangle, CalendarClock, Coins,
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEntityForm } from "@/hooks/useEntityForm";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";
import { formatDate, formatKwanza } from "@/lib/format";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import {
  useStockItemsList, useCreateStockItem, useUpdateStockItem, useDeleteStockItem,
  useStockLocationsList, useCreateStockLocation, useUpdateStockLocation, useDeleteStockLocation,
  useStockMovementsList, useCreateStockMovement, useDeleteStockMovement,
} from "@/hooks/queries/useStock";
import {
  isBelowMinStock,
  type MovementType,
  type StockCategory,
  type StockItemDto,
  type StockLocationDto,
  type StockMovementDto,
} from "@/types/dto/stock";
import i18n from "@/i18n";
import ptStock from "@/i18n/locales/pt/admin/stock.json";
import enStock from "@/i18n/locales/en/admin/stock.json";

// Namespace autónomo registado em runtime, seguindo o padrão de Financeiro.tsx.
if (!i18n.hasResourceBundle("pt", "stock"))
  i18n.addResourceBundle("pt", "stock", ptStock, true, true);
if (!i18n.hasResourceBundle("en", "stock"))
  i18n.addResourceBundle("en", "stock", enStock, true, true);

const CATEGORIES: StockCategory[] = [
  "laboratorio", "vacinas", "agricola", "pecuaria", "administrativo", "semen", "combustivel",
];
const MOVEMENT_TYPES: MovementType[] = ["entrada", "saida", "transferencia", "ajuste"];

const NONE = "none";
const BIG_PAGE = { page: 1, perPage: 1000 } as const;

/** Nº de dias à frente considerados "a expirar em breve" para o KPI. */
const EXPIRY_WINDOW_DAYS = 30;

// --- Schemas (mensagens i18n reconstruídas via useMemo dependente de t) ------

function buildItemSchema(t: TFunction) {
  return z.object({
    name: z.string().trim().min(2, t("items.validation.name")),
    category: z.enum(["laboratorio", "vacinas", "agricola", "pecuaria", "administrativo", "semen", "combustivel"]),
    sku: z.string().trim().optional(),
    unit: z.string().trim().min(1, t("items.validation.unit")),
    quantity: z.string().trim().refine((v) => Number.isFinite(Number(v)) && Number(v) >= 0, t("items.validation.quantity")),
    minStock: z.string().trim().refine((v) => Number.isFinite(Number(v)) && Number(v) >= 0, t("items.validation.minStock")),
    locationId: z.string().optional(),
    expiryDate: z.string().optional(),
    supplier: z.string().trim().optional(),
    unitCost: z.string().trim().optional(),
    notes: z.string().trim().optional(),
  });
}
type ItemFormValues = z.infer<ReturnType<typeof buildItemSchema>>;

function buildLocationSchema(t: TFunction) {
  return z.object({
    name: z.string().trim().min(2, t("locations.validation.name")),
    description: z.string().trim().optional(),
    isActive: z.enum(["true", "false"]),
  });
}
type LocationFormValues = z.infer<ReturnType<typeof buildLocationSchema>>;

function buildMovementSchema(t: TFunction) {
  return z.object({
    itemId: z.string().min(1, t("movements.validation.item")),
    type: z.enum(["entrada", "saida", "transferencia", "ajuste"]),
    quantity: z.string().trim().refine((v) => Number.isFinite(Number(v)) && Number(v) > 0, t("movements.validation.quantity")),
    fromLocationId: z.string().optional(),
    toLocationId: z.string().optional(),
    movementDate: z.string().min(1),
    reason: z.string().trim().optional(),
  });
}
type MovementFormValues = z.infer<ReturnType<typeof buildMovementSchema>>;

export default function Stock() {
  const { t } = useTranslation("stock");
  const { canWrite } = useUserRole();
  const canEdit = canWrite("stock");
  const { user } = useAuth();
  const prefersReduced = useReducedMotion();

  // --- Pagination / search / filters por separador ---
  const [itemPage, setItemPage] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [itemSearch, setItemSearch] = useState("");
  const [itemCategoryFilter, setItemCategoryFilter] = useState<string>("todas");
  const [locPage, setLocPage] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [locSearch, setLocSearch] = useState("");
  const [movPage, setMovPage] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [movSearch, setMovSearch] = useState("");
  const [movTypeFilter, setMovTypeFilter] = useState<string>("todos");

  // --- Dialog state por entidade ---
  const [itemForm, setItemForm] = useState(false);
  const [itemEdit, setItemEdit] = useState<StockItemDto | null>(null);
  const [itemView, setItemView] = useState<StockItemDto | null>(null);
  const [locForm, setLocForm] = useState(false);
  const [locEdit, setLocEdit] = useState<StockLocationDto | null>(null);
  const [locView, setLocView] = useState<StockLocationDto | null>(null);
  const [movForm, setMovForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ kind: "item" | "location" | "movement"; id: string } | null>(null);

  // --- Queries: tabela paginada + dataset completo p/ lookups e KPIs ---
  const itemsQuery = useStockItemsList({
    page: itemPage.pageIndex + 1,
    perPage: itemPage.pageSize,
    search: itemSearch || undefined,
    category: itemCategoryFilter !== "todas" ? (itemCategoryFilter as StockCategory) : undefined,
  });
  const itemsAll = useStockItemsList(BIG_PAGE);

  const locationsQuery = useStockLocationsList({
    page: locPage.pageIndex + 1, perPage: locPage.pageSize, search: locSearch || undefined,
  });
  const locationsAll = useStockLocationsList(BIG_PAGE);

  const movementsQuery = useStockMovementsList({
    page: movPage.pageIndex + 1,
    perPage: movPage.pageSize,
    search: movSearch || undefined,
    type: movTypeFilter !== "todos" ? (movTypeFilter as MovementType) : undefined,
  });

  const createItem = useCreateStockItem();
  const updateItem = useUpdateStockItem();
  const deleteItem = useDeleteStockItem();
  const createLocation = useCreateStockLocation();
  const updateLocation = useUpdateStockLocation();
  const deleteLocation = useDeleteStockLocation();
  const createMovement = useCreateStockMovement();
  const deleteMovement = useDeleteStockMovement();

  // --- Lookups ---
  const allItems = useMemo(() => itemsAll.data?.data ?? [], [itemsAll.data]);
  const locations = useMemo(() => locationsAll.data?.data ?? [], [locationsAll.data]);
  const itemMap = useMemo(() => new Map(allItems.map((i) => [i.id, i])), [allItems]);
  const locationMap = useMemo(() => new Map(locations.map((l) => [l.id, l])), [locations]);
  const locName = (id: string | null) => (id ? locationMap.get(id)?.name ?? t("common.emptyCell") : t("common.emptyCell"));
  const itemName = (id: string) => itemMap.get(id)?.name ?? t("common.emptyCell");

  // --- KPIs (dataset completo) ---
  const kpis = useMemo(() => {
    const total = allItems.length;
    const totalValue = allItems.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.unitCost) || 0), 0);
    const belowMin = allItems.filter(isBelowMinStock).length;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const limit = new Date(today); limit.setDate(limit.getDate() + EXPIRY_WINDOW_DAYS);
    const expiring = allItems.filter((i) => i.expiryDate && new Date(i.expiryDate) <= limit).length;
    return { total, totalValue, belowMin, expiring };
  }, [allItems]);

  // --- Forms ---
  const itemSchema = useMemo(() => buildItemSchema(t), [t]);
  const itemInitial = useMemo<Partial<ItemFormValues> | undefined>(
    () =>
      itemEdit
        ? {
            name: itemEdit.name,
            category: itemEdit.category,
            sku: itemEdit.sku ?? "",
            unit: itemEdit.unit,
            quantity: String(itemEdit.quantity),
            minStock: String(itemEdit.minStock),
            locationId: itemEdit.locationId ?? "",
            expiryDate: itemEdit.expiryDate ?? "",
            supplier: itemEdit.supplier ?? "",
            unitCost: itemEdit.unitCost != null ? String(itemEdit.unitCost) : "",
            notes: itemEdit.notes ?? "",
          }
        : undefined,
    [itemEdit],
  );
  const itemEntityForm = useEntityForm({
    schema: itemSchema,
    initialValues: itemInitial,
    defaultValues: {
      name: "", category: "laboratorio", sku: "", unit: "unidade",
      quantity: "0", minStock: "0", locationId: "", expiryDate: "",
      supplier: "", unitCost: "", notes: "",
    },
    open: itemForm,
    onSubmit: async (values) => {
      const payload = {
        name: values.name,
        category: values.category,
        sku: values.sku?.trim() ? values.sku.trim() : null,
        unit: values.unit,
        quantity: Number(values.quantity),
        minStock: Number(values.minStock),
        locationId: values.locationId && values.locationId !== NONE ? values.locationId : null,
        expiryDate: values.expiryDate?.trim() ? values.expiryDate : null,
        supplier: values.supplier?.trim() ? values.supplier.trim() : null,
        unitCost: values.unitCost?.trim() ? Number(values.unitCost) : null,
        notes: values.notes?.trim() ? values.notes.trim() : null,
      };
      if (itemEdit) await updateItem.mutateAsync({ id: itemEdit.id, payload });
      else await createItem.mutateAsync(payload);
    },
    successMessage: itemEdit ? t("items.toast.updateSuccess") : t("items.toast.createSuccess"),
    errorMessage: t("toast.error"),
    onSuccess: () => setItemForm(false),
  });

  const locationSchema = useMemo(() => buildLocationSchema(t), [t]);
  const locationInitial = useMemo<Partial<LocationFormValues> | undefined>(
    () =>
      locEdit
        ? { name: locEdit.name, description: locEdit.description ?? "", isActive: locEdit.isActive ? "true" : "false" }
        : undefined,
    [locEdit],
  );
  const locationEntityForm = useEntityForm({
    schema: locationSchema,
    initialValues: locationInitial,
    defaultValues: { name: "", description: "", isActive: "true" },
    open: locForm,
    onSubmit: async (values) => {
      const payload = {
        name: values.name,
        description: values.description?.trim() ? values.description.trim() : null,
        isActive: values.isActive === "true",
      };
      if (locEdit) await updateLocation.mutateAsync({ id: locEdit.id, payload });
      else await createLocation.mutateAsync(payload);
    },
    successMessage: locEdit ? t("locations.toast.updateSuccess") : t("locations.toast.createSuccess"),
    errorMessage: t("toast.error"),
    onSuccess: () => setLocForm(false),
  });

  const movementSchema = useMemo(() => buildMovementSchema(t), [t]);
  const movementEntityForm = useEntityForm({
    schema: movementSchema,
    initialValues: undefined,
    defaultValues: {
      itemId: "", type: "entrada", quantity: "",
      fromLocationId: "", toLocationId: "",
      movementDate: new Date().toISOString().slice(0, 10), reason: "",
    },
    open: movForm,
    onSubmit: async (values) => {
      const payload = {
        itemId: values.itemId,
        type: values.type,
        quantity: Number(values.quantity),
        fromLocationId: values.fromLocationId && values.fromLocationId !== NONE ? values.fromLocationId : null,
        toLocationId: values.toLocationId && values.toLocationId !== NONE ? values.toLocationId : null,
        reason: values.reason?.trim() ? values.reason.trim() : null,
        performedBy: user?.id ?? null,
        movementDate: values.movementDate,
      };
      await createMovement.mutateAsync(payload);
    },
    successMessage: t("movements.toast.createSuccess"),
    errorMessage: t("toast.error"),
    onSuccess: () => setMovForm(false),
  });

  // --- Open helpers ---
  const openItemCreate = () => { setItemEdit(null); setItemForm(true); };
  const openItemEdit = (i: StockItemDto) => { setItemEdit(i); setItemForm(true); };
  const openLocCreate = () => { setLocEdit(null); setLocForm(true); };
  const openLocEdit = (l: StockLocationDto) => { setLocEdit(l); setLocForm(true); };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.kind === "item") await deleteItem.mutateAsync(deleteTarget.id);
    else if (deleteTarget.kind === "location") await deleteLocation.mutateAsync(deleteTarget.id);
    else await deleteMovement.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  // --- Columns ---
  const itemColumns = useMemo<ColumnDef<StockItemDto>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("items.table.name")} />,
        cell: ({ row }) => {
          const i = row.original;
          return (
            <div className="flex flex-col">
              <span className="font-medium">{i.name}</span>
              {i.sku && <span className="text-xs text-muted-foreground">{i.sku}</span>}
            </div>
          );
        },
      },
      {
        accessorKey: "category",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("items.table.category")} />,
        cell: ({ row }) => <Badge variant="outline">{t(`category.${row.original.category}`)}</Badge>,
      },
      {
        accessorKey: "quantity",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("items.table.quantity")} />,
        cell: ({ row }) => {
          const i = row.original;
          const critical = isBelowMinStock(i);
          return (
            <div className="flex items-center gap-2">
              <span className={critical ? "text-destructive font-semibold" : "font-medium"}>
                {i.quantity} <span className="text-xs text-muted-foreground">{i.unit}</span>
              </span>
              {critical && (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" /> {t("badges.critical")}
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "minStock",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("items.table.minStock")} />,
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.minStock}</span>,
      },
      {
        id: "location",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("items.table.location")} />,
        cell: ({ row }) => <span className="text-sm">{locName(row.original.locationId)}</span>,
      },
      {
        accessorKey: "expiryDate",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("items.table.expiry")} />,
        cell: ({ row }) => (
          <span className="text-sm">{row.original.expiryDate ? formatDate(row.original.expiryDate) : t("common.emptyCell")}</span>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, locationMap],
  );

  const locationColumns = useMemo<ColumnDef<StockLocationDto>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("locations.table.name")} />,
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      },
      {
        accessorKey: "description",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("locations.table.description")} />,
        cell: ({ row }) => (
          <span className="block max-w-[360px] truncate text-muted-foreground" title={row.original.description ?? ""}>
            {row.original.description || t("common.emptyCell")}
          </span>
        ),
      },
      {
        accessorKey: "isActive",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("locations.table.status")} />,
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? "default" : "secondary"}>
            {row.original.isActive ? t("badges.active") : t("badges.inactive")}
          </Badge>
        ),
      },
    ],
    [t],
  );

  const movementColumns = useMemo<ColumnDef<StockMovementDto>[]>(
    () => [
      {
        accessorKey: "movementDate",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("movements.table.date")} />,
        cell: ({ row }) => <span className="text-sm">{formatDate(row.original.movementDate)}</span>,
      },
      {
        id: "item",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("movements.table.item")} />,
        cell: ({ row }) => <span className="font-medium">{itemName(row.original.itemId)}</span>,
      },
      {
        accessorKey: "type",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("movements.table.type")} />,
        cell: ({ row }) => <Badge variant="outline">{t(`movementType.${row.original.type}`)}</Badge>,
      },
      {
        accessorKey: "quantity",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("movements.table.quantity")} />,
        cell: ({ row }) => <span className="font-medium">{row.original.quantity}</span>,
      },
      {
        id: "route",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("movements.table.route")} />,
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {locName(row.original.fromLocationId)} → {locName(row.original.toLocationId)}
          </span>
        ),
      },
      {
        accessorKey: "reason",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("movements.table.reason")} />,
        cell: ({ row }) => (
          <span className="block max-w-[240px] truncate" title={row.original.reason ?? ""}>
            {row.original.reason || t("common.emptyCell")}
          </span>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, itemMap, locationMap],
  );

  // --- Row actions ---
  const itemActions = (row: StockItemDto) => {
    const actions: RowAction[] = [{ label: t("actions.view"), icon: Eye, onClick: () => setItemView(row) }];
    if (canEdit) {
      actions.push({ label: t("actions.edit"), icon: Pencil, onClick: () => openItemEdit(row) });
      actions.push({ label: t("actions.delete"), icon: Trash2, destructive: true, onClick: () => setDeleteTarget({ kind: "item", id: row.id }) });
    }
    return <RowActions actions={actions} />;
  };
  const locationActions = (row: StockLocationDto) => {
    const actions: RowAction[] = [{ label: t("actions.view"), icon: Eye, onClick: () => setLocView(row) }];
    if (canEdit) {
      actions.push({ label: t("actions.edit"), icon: Pencil, onClick: () => openLocEdit(row) });
      actions.push({ label: t("actions.delete"), icon: Trash2, destructive: true, onClick: () => setDeleteTarget({ kind: "location", id: row.id }) });
    }
    return <RowActions actions={actions} />;
  };
  const movementActions = (row: StockMovementDto) => {
    if (!canEdit) return null;
    const actions: RowAction[] = [
      { label: t("actions.delete"), icon: Trash2, destructive: true, onClick: () => setDeleteTarget({ kind: "movement", id: row.id }) },
    ];
    return <RowActions actions={actions} />;
  };

  const kpiCards = [
    { key: "totalItems", icon: Package, label: t("kpis.totalItems"), value: kpis.total, caption: t("kpis.totalItemsCaption"), variant: "gradient-green-gold" as const },
    { key: "totalValue", icon: Coins, label: t("kpis.totalValue"), value: formatKwanza(kpis.totalValue), caption: t("kpis.totalValueCaption"), variant: "gradient-teal" as const },
    { key: "belowMin", icon: AlertTriangle, label: t("kpis.belowMin"), value: kpis.belowMin, caption: t("kpis.belowMinCaption"), variant: (kpis.belowMin > 0 ? "gradient-gold" : "glass") as const },
    { key: "expiring", icon: CalendarClock, label: t("kpis.expiring"), value: kpis.expiring, caption: t("kpis.expiringCaption"), variant: (kpis.expiring > 0 ? "gradient-gold" : "glass") as const },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader icon={Boxes} title={t("page.title")} description={t("page.description")} />

      {/* KPIs */}
      <motion.div
        className="grid gap-4 grid-cols-2 lg:grid-cols-4"
        variants={prefersReduced ? undefined : staggerContainer}
        initial={prefersReduced ? undefined : "hidden"}
        animate={prefersReduced ? undefined : "visible"}
      >
        {kpiCards.map((c) => (
          <motion.div key={c.key} variants={prefersReduced ? undefined : fadeInUp}>
            <AdminCard
              title={c.label}
              icon={c.icon}
              metric={c.value}
              caption={c.caption}
              variant={c.variant}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Separadores */}
      <Tabs defaultValue="items" className="space-y-4">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="items"><Package className="h-4 w-4 mr-1" /> {t("tabs.items")}</TabsTrigger>
          <TabsTrigger value="locations"><Warehouse className="h-4 w-4 mr-1" /> {t("tabs.locations")}</TabsTrigger>
          <TabsTrigger value="movements"><ArrowLeftRight className="h-4 w-4 mr-1" /> {t("tabs.movements")}</TabsTrigger>
        </TabsList>

        {/* --- Itens --- */}
        <TabsContent value="items" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Select
              value={itemCategoryFilter}
              onValueChange={(v) => { setItemCategoryFilter(v); setItemPage((p) => ({ ...p, pageIndex: 0 })); }}
            >
              <SelectTrigger className="sm:w-[220px]"><SelectValue placeholder={t("filters.categoryPlaceholder")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">{t("filters.allCategories")}</SelectItem>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{t(`category.${c}`)}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex flex-wrap gap-2 sm:justify-end">
              <WriteGuard module="stock">
                <Button variant="outline" onClick={() => setMovForm(true)} disabled={allItems.length === 0}>
                  <ArrowLeftRight className="mr-2 h-4 w-4" /> {t("movements.new")}
                </Button>
              </WriteGuard>
              <WriteGuard module="stock">
                <Button onClick={openItemCreate}>
                  <Plus className="mr-2 h-4 w-4" /> {t("items.new")}
                </Button>
              </WriteGuard>
            </div>
          </div>
          <DataTable
            columns={itemColumns}
            data={itemsQuery.data?.data ?? []}
            loading={itemsQuery.isLoading}
            pageCount={itemsQuery.data?.meta.lastPage ?? 0}
            pagination={itemPage}
            onPaginationChange={setItemPage}
            rowCount={itemsQuery.data?.meta.total}
            globalFilter={itemSearch}
            onGlobalFilterChange={setItemSearch}
            searchPlaceholder={t("items.table.searchPlaceholder")}
            emptyMessage={t("items.table.empty")}
            renderRowActions={itemActions}
          />
        </TabsContent>

        {/* --- Localizações --- */}
        <TabsContent value="locations" className="space-y-4">
          <div className="flex justify-end">
            <WriteGuard module="stock">
              <Button onClick={openLocCreate}>
                <Plus className="mr-2 h-4 w-4" /> {t("locations.new")}
              </Button>
            </WriteGuard>
          </div>
          <DataTable
            columns={locationColumns}
            data={locationsQuery.data?.data ?? []}
            loading={locationsQuery.isLoading}
            pageCount={locationsQuery.data?.meta.lastPage ?? 0}
            pagination={locPage}
            onPaginationChange={setLocPage}
            rowCount={locationsQuery.data?.meta.total}
            globalFilter={locSearch}
            onGlobalFilterChange={setLocSearch}
            searchPlaceholder={t("locations.table.searchPlaceholder")}
            emptyMessage={t("locations.table.empty")}
            renderRowActions={locationActions}
          />
        </TabsContent>

        {/* --- Movimentos --- */}
        <TabsContent value="movements" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Select
              value={movTypeFilter}
              onValueChange={(v) => { setMovTypeFilter(v); setMovPage((p) => ({ ...p, pageIndex: 0 })); }}
            >
              <SelectTrigger className="sm:w-[200px]"><SelectValue placeholder={t("filters.typePlaceholder")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">{t("filters.allTypes")}</SelectItem>
                {MOVEMENT_TYPES.map((mt) => <SelectItem key={mt} value={mt}>{t(`movementType.${mt}`)}</SelectItem>)}
              </SelectContent>
            </Select>
            <WriteGuard module="stock">
              <Button onClick={() => setMovForm(true)} disabled={allItems.length === 0}>
                <Plus className="mr-2 h-4 w-4" /> {t("movements.new")}
              </Button>
            </WriteGuard>
          </div>
          <DataTable
            columns={movementColumns}
            data={movementsQuery.data?.data ?? []}
            loading={movementsQuery.isLoading}
            pageCount={movementsQuery.data?.meta.lastPage ?? 0}
            pagination={movPage}
            onPaginationChange={setMovPage}
            rowCount={movementsQuery.data?.meta.total}
            globalFilter={movSearch}
            onGlobalFilterChange={setMovSearch}
            searchPlaceholder={t("movements.table.searchPlaceholder")}
            emptyMessage={t("movements.table.empty")}
            renderRowActions={movementActions}
          />
        </TabsContent>
      </Tabs>

      {/* ===================== Dialog de item ===================== */}
      <EntityFormDialog
        open={itemForm}
        onOpenChange={setItemForm}
        title={itemEdit ? t("items.dialog.editTitle") : t("items.dialog.createTitle")}
        form={itemEntityForm}
        submitLabel={itemEdit ? t("form.submitEdit") : t("form.submitCreate")}
        submittingLabel={t("form.submitting")}
        cancelLabel={t("form.cancel")}
      >
        {(form) => (
          <>
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("items.form.name")}</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("items.form.category")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{t(`category.${c}`)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="sku" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("items.form.sku")}</FormLabel>
                  <FormControl><Input {...field} value={field.value ?? ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField control={form.control} name="unit" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("items.form.unit")}</FormLabel>
                  <FormControl><Input placeholder={t("items.form.unitPlaceholder")} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="quantity" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("items.form.quantity")}</FormLabel>
                  <FormControl><Input type="number" min="0" step="any" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="minStock" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("items.form.minStock")}</FormLabel>
                  <FormControl><Input type="number" min="0" step="any" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="locationId" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("items.form.location")}</FormLabel>
                  <Select value={field.value || NONE} onValueChange={(v) => field.onChange(v === NONE ? "" : v)}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value={NONE}>{t("common.none")}</SelectItem>
                      {locations.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="expiryDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("items.form.expiry")}</FormLabel>
                  <FormControl><Input type="date" {...field} value={field.value ?? ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="supplier" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("items.form.supplier")}</FormLabel>
                  <FormControl><Input {...field} value={field.value ?? ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="unitCost" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("items.form.unitCost")}</FormLabel>
                  <FormControl><Input type="number" min="0" step="any" {...field} value={field.value ?? ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("items.form.notes")}</FormLabel>
                <FormControl><Textarea {...field} value={field.value ?? ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </>
        )}
      </EntityFormDialog>

      {/* ===================== Dialog de localização ===================== */}
      <EntityFormDialog
        open={locForm}
        onOpenChange={setLocForm}
        title={locEdit ? t("locations.dialog.editTitle") : t("locations.dialog.createTitle")}
        form={locationEntityForm}
        submitLabel={locEdit ? t("form.submitEdit") : t("form.submitCreate")}
        submittingLabel={t("form.submitting")}
        cancelLabel={t("form.cancel")}
      >
        {(form) => (
          <>
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("locations.form.name")}</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="isActive" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("locations.form.status")}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="true">{t("locations.form.activeOption")}</SelectItem>
                    <SelectItem value="false">{t("locations.form.inactiveOption")}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("locations.form.description")}</FormLabel>
                <FormControl><Textarea {...field} value={field.value ?? ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </>
        )}
      </EntityFormDialog>

      {/* ===================== Dialog de movimento ===================== */}
      <EntityFormDialog
        open={movForm}
        onOpenChange={setMovForm}
        title={t("movements.dialog.createTitle")}
        form={movementEntityForm}
        submitLabel={t("form.submitCreate")}
        submittingLabel={t("form.submitting")}
        cancelLabel={t("form.cancel")}
      >
        {(form) => (
          <>
            <FormField control={form.control} name="itemId" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("movements.form.item")}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger><SelectValue placeholder={t("common.selectPlaceholder")} /></SelectTrigger></FormControl>
                  <SelectContent>
                    {allItems.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("movements.form.type")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {MOVEMENT_TYPES.map((mt) => <SelectItem key={mt} value={mt}>{t(`movementType.${mt}`)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="quantity" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("movements.form.quantity")}</FormLabel>
                  <FormControl><Input type="number" min="0" step="any" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="fromLocationId" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("movements.form.fromLocation")}</FormLabel>
                  <Select value={field.value || NONE} onValueChange={(v) => field.onChange(v === NONE ? "" : v)}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value={NONE}>{t("common.none")}</SelectItem>
                      {locations.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="toLocationId" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("movements.form.toLocation")}</FormLabel>
                  <Select value={field.value || NONE} onValueChange={(v) => field.onChange(v === NONE ? "" : v)}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value={NONE}>{t("common.none")}</SelectItem>
                      {locations.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="movementDate" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("movements.form.date")}</FormLabel>
                <FormControl><Input type="date" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="reason" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("movements.form.reason")}</FormLabel>
                <FormControl><Textarea {...field} value={field.value ?? ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </>
        )}
      </EntityFormDialog>

      {/* ===================== Delete ===================== */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title={t("delete.title")}
        description={t("delete.description")}
      />

      {/* ===================== Detalhes: item ===================== */}
      <Dialog open={!!itemView} onOpenChange={(o) => !o && setItemView(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-serif">{t("items.dialog.detailsTitle")}</DialogTitle></DialogHeader>
          {itemView && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground">{t("items.details.name")}:</span><p className="font-medium">{itemView.name}</p></div>
                <div><span className="text-muted-foreground">{t("items.details.category")}:</span><p><Badge variant="outline">{t(`category.${itemView.category}`)}</Badge></p></div>
                <div><span className="text-muted-foreground">{t("items.details.sku")}:</span><p className="font-medium">{itemView.sku || t("common.emptyCell")}</p></div>
                <div><span className="text-muted-foreground">{t("items.details.unit")}:</span><p className="font-medium">{itemView.unit}</p></div>
                <div>
                  <span className="text-muted-foreground">{t("items.details.quantity")}:</span>
                  <p className={isBelowMinStock(itemView) ? "text-destructive font-semibold" : "font-medium"}>
                    {itemView.quantity} {itemView.unit}
                    {isBelowMinStock(itemView) && <Badge variant="destructive" className="ml-2">{t("badges.critical")}</Badge>}
                  </p>
                </div>
                <div><span className="text-muted-foreground">{t("items.details.minStock")}:</span><p className="font-medium">{itemView.minStock}</p></div>
                <div><span className="text-muted-foreground">{t("items.details.location")}:</span><p className="font-medium">{locName(itemView.locationId)}</p></div>
                <div><span className="text-muted-foreground">{t("items.details.expiry")}:</span><p className="font-medium">{itemView.expiryDate ? formatDate(itemView.expiryDate) : t("common.emptyCell")}</p></div>
                <div><span className="text-muted-foreground">{t("items.details.supplier")}:</span><p className="font-medium">{itemView.supplier || t("common.emptyCell")}</p></div>
                <div><span className="text-muted-foreground">{t("items.details.unitCost")}:</span><p className="font-medium">{itemView.unitCost != null ? formatKwanza(itemView.unitCost) : t("common.emptyCell")}</p></div>
                <div><span className="text-muted-foreground">{t("items.details.stockValue")}:</span><p className="font-medium">{formatKwanza((Number(itemView.quantity) || 0) * (Number(itemView.unitCost) || 0))}</p></div>
                <div><span className="text-muted-foreground">{t("items.details.createdAt")}:</span><p className="font-medium">{formatDate(itemView.createdAt)}</p></div>
              </div>
              {itemView.notes && (
                <div><span className="text-muted-foreground">{t("items.details.notes")}:</span><p className="font-medium mt-1">{itemView.notes}</p></div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ===================== Detalhes: localização ===================== */}
      <Dialog open={!!locView} onOpenChange={(o) => !o && setLocView(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-serif">{t("locations.dialog.detailsTitle")}</DialogTitle></DialogHeader>
          {locView && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground">{t("locations.details.name")}:</span><p className="font-medium">{locView.name}</p></div>
                <div><span className="text-muted-foreground">{t("locations.details.status")}:</span><p><Badge variant={locView.isActive ? "default" : "secondary"}>{locView.isActive ? t("badges.active") : t("badges.inactive")}</Badge></p></div>
                <div><span className="text-muted-foreground">{t("locations.details.createdAt")}:</span><p className="font-medium">{formatDate(locView.createdAt)}</p></div>
              </div>
              {locView.description && (
                <div><span className="text-muted-foreground">{t("locations.details.description")}:</span><p className="font-medium mt-1">{locView.description}</p></div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
