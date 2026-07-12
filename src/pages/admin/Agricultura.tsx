import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "framer-motion";
import { z } from "zod";
import type { TFunction } from "i18next";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import {
  Sprout, MapPin, Wheat, Tractor, Ruler,
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
import { formatDate, formatNumber } from "@/lib/format";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import { useEstacoesList } from "@/hooks/queries/useEstacoes";
import {
  useCropsList, useCreateCrop, useUpdateCrop, useDeleteCrop,
  useFieldsList, useCreateField, useUpdateField, useDeleteField,
  useHarvestsList, useCreateHarvest, useUpdateHarvest, useDeleteHarvest,
} from "@/hooks/queries/useAgricultura";
import type {
  CropDto, FieldDto, FieldStatus, HarvestDto,
} from "@/types/dto/agricultura";
import i18n from "@/i18n";
import ptAgricultura from "@/i18n/locales/pt/admin/agricultura.json";
import enAgricultura from "@/i18n/locales/en/admin/agricultura.json";

// Namespace autónomo registado em runtime, seguindo o padrão de Financeiro.tsx.
if (!i18n.hasResourceBundle("pt", "agricultura"))
  i18n.addResourceBundle("pt", "agricultura", ptAgricultura, true, true);
if (!i18n.hasResourceBundle("en", "agricultura"))
  i18n.addResourceBundle("en", "agricultura", enAgricultura, true, true);

const FIELD_STATUSES: FieldStatus[] = [
  "planeado", "plantado", "em_crescimento", "colhido", "abandonado",
];

const statusVariant: Record<FieldStatus, "default" | "secondary" | "destructive" | "outline"> = {
  planeado: "outline",
  plantado: "secondary",
  em_crescimento: "default",
  colhido: "default",
  abandonado: "destructive",
};

const BIG_PAGE = { page: 1, perPage: 1000 } as const;

// --- Schemas (mensagens i18n reconstruídas via useMemo dependente de t) ------

function buildCropSchema(t: TFunction) {
  return z.object({
    name: z.string().trim().min(2, t("crops.validation.name")),
    scientificName: z.string().trim().optional(),
    cycleDays: z
      .string()
      .trim()
      .optional()
      .refine((v) => !v || (Number.isFinite(Number(v)) && Number(v) > 0), t("crops.validation.cycleDays")),
    notes: z.string().trim().optional(),
  });
}
type CropFormValues = z.infer<ReturnType<typeof buildCropSchema>>;

function buildFieldSchema(t: TFunction) {
  return z.object({
    stationId: z.string().min(1, t("fields.validation.station")),
    cropId: z.string().min(1, t("fields.validation.crop")),
    fieldCode: z.string().trim().optional(),
    areaHa: z
      .string()
      .trim()
      .refine((v) => Number.isFinite(Number(v)) && Number(v) > 0, t("fields.validation.area")),
    plantingDate: z.string().optional(),
    expectedHarvest: z.string().optional(),
    status: z.enum(["planeado", "plantado", "em_crescimento", "colhido", "abandonado"]),
    notes: z.string().trim().optional(),
  });
}
type FieldFormValues = z.infer<ReturnType<typeof buildFieldSchema>>;

function buildHarvestSchema(t: TFunction) {
  return z.object({
    fieldId: z.string().min(1, t("harvests.validation.field")),
    harvestDate: z.string().min(1, t("harvests.validation.date")),
    quantity: z
      .string()
      .trim()
      .refine((v) => Number.isFinite(Number(v)) && Number(v) > 0, t("harvests.validation.quantity")),
    unit: z.string().trim().min(1),
    qualityGrade: z.string().trim().optional(),
    notes: z.string().trim().optional(),
  });
}
type HarvestFormValues = z.infer<ReturnType<typeof buildHarvestSchema>>;

export default function Agricultura() {
  const { t } = useTranslation("agricultura");
  const { canWrite } = useUserRole();
  const canEdit = canWrite("agricultura");
  const prefersReduced = useReducedMotion();
  const currentYear = new Date().getFullYear();

  // --- Pagination / search por separador ---
  const [fieldPage, setFieldPage] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [fieldSearch, setFieldSearch] = useState("");
  const [cropPage, setCropPage] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [cropSearch, setCropSearch] = useState("");
  const [harvestPage, setHarvestPage] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [harvestSearch, setHarvestSearch] = useState("");

  // --- Dialog state por entidade ---
  const [cropForm, setCropForm] = useState(false);
  const [cropEdit, setCropEdit] = useState<CropDto | null>(null);
  const [cropView, setCropView] = useState<CropDto | null>(null);
  const [fieldForm, setFieldForm] = useState(false);
  const [fieldEdit, setFieldEdit] = useState<FieldDto | null>(null);
  const [fieldView, setFieldView] = useState<FieldDto | null>(null);
  const [harvestForm, setHarvestForm] = useState(false);
  const [harvestEdit, setHarvestEdit] = useState<HarvestDto | null>(null);
  const [harvestView, setHarvestView] = useState<HarvestDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ kind: "crop" | "field" | "harvest"; id: string } | null>(null);

  // --- Queries: tabela paginada + dataset completo p/ lookups, KPIs ---
  const cropsQuery = useCropsList({
    page: cropPage.pageIndex + 1, perPage: cropPage.pageSize, search: cropSearch || undefined,
  });
  const cropsAll = useCropsList(BIG_PAGE);

  const fieldsQuery = useFieldsList({
    page: fieldPage.pageIndex + 1, perPage: fieldPage.pageSize, search: fieldSearch || undefined,
  });
  const fieldsAll = useFieldsList(BIG_PAGE);

  const harvestsQuery = useHarvestsList({
    page: harvestPage.pageIndex + 1, perPage: harvestPage.pageSize, search: harvestSearch || undefined,
  });
  const harvestsAll = useHarvestsList(BIG_PAGE);

  const estacoesQuery = useEstacoesList(BIG_PAGE);

  const createCrop = useCreateCrop();
  const updateCrop = useUpdateCrop();
  const deleteCrop = useDeleteCrop();
  const createField = useCreateField();
  const updateField = useUpdateField();
  const deleteField = useDeleteField();
  const createHarvest = useCreateHarvest();
  const updateHarvest = useUpdateHarvest();
  const deleteHarvest = useDeleteHarvest();

  // --- Lookups ---
  const crops = useMemo(() => cropsAll.data?.data ?? [], [cropsAll.data]);
  const allFields = useMemo(() => fieldsAll.data?.data ?? [], [fieldsAll.data]);
  const allHarvests = useMemo(() => harvestsAll.data?.data ?? [], [harvestsAll.data]);
  const estacoes = useMemo(() => estacoesQuery.data?.data ?? [], [estacoesQuery.data]);

  const cropMap = useMemo(() => new Map(crops.map((c) => [c.id, c])), [crops]);
  const stationMap = useMemo(() => new Map(estacoes.map((s) => [s.id, s])), [estacoes]);
  const fieldMap = useMemo(() => new Map(allFields.map((f) => [f.id, f])), [allFields]);

  const cropName = (id: string) => cropMap.get(id)?.name ?? t("common.emptyCell");
  const stationName = (id: string) => stationMap.get(id)?.name ?? t("common.emptyCell");
  const fieldLabel = (id: string) => {
    const f = fieldMap.get(id);
    if (!f) return t("common.emptyCell");
    return `${f.fieldCode ? `${f.fieldCode} · ` : ""}${cropName(f.cropId)} (${stationName(f.stationId)})`;
  };

  // --- KPIs (dataset completo) ---
  const kpis = useMemo(() => {
    const totalFields = allFields.length;
    const totalArea = allFields.reduce((s, f) => s + (Number(f.areaHa) || 0), 0);
    const growingFields = allFields.filter((f) => f.status === "em_crescimento").length;
    const yearHarvest = allHarvests
      .filter((h) => new Date(h.harvestDate).getFullYear() === currentYear)
      .reduce((s, h) => s + (Number(h.quantity) || 0), 0);
    return { totalFields, totalArea, growingFields, yearHarvest };
  }, [allFields, allHarvests, currentYear]);

  // --- Forms ---
  const cropSchema = useMemo(() => buildCropSchema(t), [t]);
  const cropInitial = useMemo<Partial<CropFormValues> | undefined>(
    () =>
      cropEdit
        ? {
            name: cropEdit.name,
            scientificName: cropEdit.scientificName ?? "",
            cycleDays: cropEdit.cycleDays != null ? String(cropEdit.cycleDays) : "",
            notes: cropEdit.notes ?? "",
          }
        : undefined,
    [cropEdit],
  );
  const cropEntityForm = useEntityForm({
    schema: cropSchema,
    initialValues: cropInitial,
    defaultValues: { name: "", scientificName: "", cycleDays: "", notes: "" },
    open: cropForm,
    onSubmit: async (values) => {
      const payload = {
        name: values.name,
        scientificName: values.scientificName?.trim() ? values.scientificName.trim() : null,
        cycleDays: values.cycleDays?.trim() ? Number(values.cycleDays) : null,
        notes: values.notes?.trim() ? values.notes.trim() : null,
      };
      if (cropEdit) await updateCrop.mutateAsync({ id: cropEdit.id, payload });
      else await createCrop.mutateAsync(payload);
    },
    successMessage: cropEdit ? t("crops.toast.updateSuccess") : t("crops.toast.createSuccess"),
    errorMessage: t("toast.error"),
    onSuccess: () => setCropForm(false),
  });

  const fieldSchema = useMemo(() => buildFieldSchema(t), [t]);
  const fieldInitial = useMemo<Partial<FieldFormValues> | undefined>(
    () =>
      fieldEdit
        ? {
            stationId: fieldEdit.stationId,
            cropId: fieldEdit.cropId,
            fieldCode: fieldEdit.fieldCode ?? "",
            areaHa: String(fieldEdit.areaHa),
            plantingDate: fieldEdit.plantingDate ?? "",
            expectedHarvest: fieldEdit.expectedHarvest ?? "",
            status: fieldEdit.status,
            notes: fieldEdit.notes ?? "",
          }
        : undefined,
    [fieldEdit],
  );
  const fieldEntityForm = useEntityForm({
    schema: fieldSchema,
    initialValues: fieldInitial,
    defaultValues: {
      stationId: "", cropId: "", fieldCode: "", areaHa: "",
      plantingDate: "", expectedHarvest: "", status: "planeado", notes: "",
    },
    open: fieldForm,
    onSubmit: async (values) => {
      const payload = {
        stationId: values.stationId,
        cropId: values.cropId,
        fieldCode: values.fieldCode?.trim() ? values.fieldCode.trim() : null,
        areaHa: Number(values.areaHa),
        plantingDate: values.plantingDate || null,
        expectedHarvest: values.expectedHarvest || null,
        status: values.status,
        notes: values.notes?.trim() ? values.notes.trim() : null,
      };
      if (fieldEdit) await updateField.mutateAsync({ id: fieldEdit.id, payload });
      else await createField.mutateAsync(payload);
    },
    successMessage: fieldEdit ? t("fields.toast.updateSuccess") : t("fields.toast.createSuccess"),
    errorMessage: t("toast.error"),
    onSuccess: () => setFieldForm(false),
  });

  const harvestSchema = useMemo(() => buildHarvestSchema(t), [t]);
  const harvestInitial = useMemo<Partial<HarvestFormValues> | undefined>(
    () =>
      harvestEdit
        ? {
            fieldId: harvestEdit.fieldId,
            harvestDate: harvestEdit.harvestDate,
            quantity: String(harvestEdit.quantity),
            unit: harvestEdit.unit,
            qualityGrade: harvestEdit.qualityGrade ?? "",
            notes: harvestEdit.notes ?? "",
          }
        : undefined,
    [harvestEdit],
  );
  const harvestEntityForm = useEntityForm({
    schema: harvestSchema,
    initialValues: harvestInitial,
    defaultValues: {
      fieldId: "", harvestDate: new Date().toISOString().slice(0, 10),
      quantity: "", unit: "kg", qualityGrade: "", notes: "",
    },
    open: harvestForm,
    onSubmit: async (values) => {
      const payload = {
        fieldId: values.fieldId,
        harvestDate: values.harvestDate,
        quantity: Number(values.quantity),
        unit: values.unit,
        qualityGrade: values.qualityGrade?.trim() ? values.qualityGrade.trim() : null,
        notes: values.notes?.trim() ? values.notes.trim() : null,
      };
      if (harvestEdit) await updateHarvest.mutateAsync({ id: harvestEdit.id, payload });
      else await createHarvest.mutateAsync(payload);
    },
    successMessage: harvestEdit ? t("harvests.toast.updateSuccess") : t("harvests.toast.createSuccess"),
    errorMessage: t("toast.error"),
    onSuccess: () => setHarvestForm(false),
  });

  // --- Open helpers ---
  const openCropCreate = () => { setCropEdit(null); setCropForm(true); };
  const openCropEdit = (c: CropDto) => { setCropEdit(c); setCropForm(true); };
  const openFieldCreate = () => { setFieldEdit(null); setFieldForm(true); };
  const openFieldEdit = (f: FieldDto) => { setFieldEdit(f); setFieldForm(true); };
  const openHarvestCreate = () => { setHarvestEdit(null); setHarvestForm(true); };
  const openHarvestEdit = (h: HarvestDto) => { setHarvestEdit(h); setHarvestForm(true); };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.kind === "crop") await deleteCrop.mutateAsync(deleteTarget.id);
    else if (deleteTarget.kind === "field") await deleteField.mutateAsync(deleteTarget.id);
    else await deleteHarvest.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  // --- Columns ---
  const cropColumns = useMemo<ColumnDef<CropDto>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("crops.table.name")} />,
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      },
      {
        accessorKey: "scientificName",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("crops.table.scientificName")} />,
        cell: ({ row }) => <span className="italic text-muted-foreground">{row.original.scientificName ?? t("common.emptyCell")}</span>,
      },
      {
        accessorKey: "cycleDays",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("crops.table.cycleDays")} />,
        cell: ({ row }) => row.original.cycleDays ?? t("common.emptyCell"),
      },
    ],
    [t],
  );

  const fieldColumns = useMemo<ColumnDef<FieldDto>[]>(
    () => [
      {
        accessorKey: "fieldCode",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("fields.table.code")} />,
        cell: ({ row }) => <span className="font-medium">{row.original.fieldCode ?? t("common.emptyCell")}</span>,
      },
      {
        id: "station",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("fields.table.station")} />,
        cell: ({ row }) => <span className="text-sm">{stationName(row.original.stationId)}</span>,
      },
      {
        id: "crop",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("fields.table.crop")} />,
        cell: ({ row }) => <span className="text-sm">{cropName(row.original.cropId)}</span>,
      },
      {
        accessorKey: "areaHa",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("fields.table.area")} />,
        cell: ({ row }) => formatNumber(row.original.areaHa),
      },
      {
        accessorKey: "plantingDate",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("fields.table.planting")} />,
        cell: ({ row }) => (row.original.plantingDate ? formatDate(row.original.plantingDate) : t("common.emptyCell")),
      },
      {
        accessorKey: "status",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("fields.table.status")} />,
        cell: ({ row }) => <Badge variant={statusVariant[row.original.status]}>{t(`status.${row.original.status}`)}</Badge>,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, cropMap, stationMap],
  );

  const harvestColumns = useMemo<ColumnDef<HarvestDto>[]>(
    () => [
      {
        accessorKey: "harvestDate",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("harvests.table.date")} />,
        cell: ({ row }) => <span className="text-sm">{formatDate(row.original.harvestDate)}</span>,
      },
      {
        id: "field",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("harvests.table.field")} />,
        cell: ({ row }) => <span className="text-xs text-muted-foreground">{fieldLabel(row.original.fieldId)}</span>,
      },
      {
        accessorKey: "quantity",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("harvests.table.quantity")} />,
        cell: ({ row }) => <span className="font-medium">{formatNumber(row.original.quantity)} {row.original.unit}</span>,
      },
      {
        accessorKey: "qualityGrade",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("harvests.table.quality")} />,
        cell: ({ row }) => row.original.qualityGrade ?? t("common.emptyCell"),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, fieldMap, cropMap, stationMap],
  );

  // --- Row actions ---
  const cropActions = (row: CropDto) => {
    const actions: RowAction[] = [{ label: t("actions.view"), icon: Eye, onClick: () => setCropView(row) }];
    if (canEdit) {
      actions.push({ label: t("actions.edit"), icon: Pencil, onClick: () => openCropEdit(row) });
      actions.push({ label: t("actions.delete"), icon: Trash2, destructive: true, onClick: () => setDeleteTarget({ kind: "crop", id: row.id }) });
    }
    return <RowActions actions={actions} />;
  };
  const fieldActions = (row: FieldDto) => {
    const actions: RowAction[] = [{ label: t("actions.view"), icon: Eye, onClick: () => setFieldView(row) }];
    if (canEdit) {
      actions.push({ label: t("actions.edit"), icon: Pencil, onClick: () => openFieldEdit(row) });
      actions.push({ label: t("actions.delete"), icon: Trash2, destructive: true, onClick: () => setDeleteTarget({ kind: "field", id: row.id }) });
    }
    return <RowActions actions={actions} />;
  };
  const harvestActions = (row: HarvestDto) => {
    const actions: RowAction[] = [{ label: t("actions.view"), icon: Eye, onClick: () => setHarvestView(row) }];
    if (canEdit) {
      actions.push({ label: t("actions.edit"), icon: Pencil, onClick: () => openHarvestEdit(row) });
      actions.push({ label: t("actions.delete"), icon: Trash2, destructive: true, onClick: () => setDeleteTarget({ kind: "harvest", id: row.id }) });
    }
    return <RowActions actions={actions} />;
  };

  const kpiCards = [
    { key: "fields", icon: MapPin, label: t("kpis.totalFields"), value: formatNumber(kpis.totalFields), caption: t("kpis.totalFieldsCaption"), variant: "gradient-green-gold" as const },
    { key: "area", icon: Ruler, label: t("kpis.totalArea"), value: `${formatNumber(kpis.totalArea)} ha`, caption: t("kpis.totalAreaCaption"), variant: "gradient-green" as const },
    { key: "harvest", icon: Wheat, label: t("kpis.yearHarvest"), value: `${formatNumber(kpis.yearHarvest)} kg`, caption: t("kpis.yearHarvestCaption"), variant: "gradient-gold" as const },
    { key: "growing", icon: Sprout, label: t("kpis.growingFields"), value: formatNumber(kpis.growingFields), caption: t("kpis.growingFieldsCaption"), variant: "gradient-teal" as const },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader icon={Sprout} title={t("page.title")} description={t("page.description")} />

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
      <Tabs defaultValue="fields" className="space-y-4">
        <TabsList>
          <TabsTrigger value="fields"><MapPin className="h-4 w-4 mr-1" /> {t("tabs.fields")}</TabsTrigger>
          <TabsTrigger value="crops"><Sprout className="h-4 w-4 mr-1" /> {t("tabs.crops")}</TabsTrigger>
          <TabsTrigger value="harvests"><Wheat className="h-4 w-4 mr-1" /> {t("tabs.harvests")}</TabsTrigger>
        </TabsList>

        {/* --- Talhões --- */}
        <TabsContent value="fields" className="space-y-4">
          <div className="flex justify-end">
            <WriteGuard module="agricultura">
              <Button onClick={openFieldCreate} disabled={crops.length === 0 || estacoes.length === 0}>
                <Plus className="mr-2 h-4 w-4" /> {t("fields.new")}
              </Button>
            </WriteGuard>
          </div>
          <DataTable
            columns={fieldColumns}
            data={fieldsQuery.data?.data ?? []}
            loading={fieldsQuery.isLoading}
            pageCount={fieldsQuery.data?.meta.lastPage ?? 0}
            pagination={fieldPage}
            onPaginationChange={setFieldPage}
            rowCount={fieldsQuery.data?.meta.total}
            globalFilter={fieldSearch}
            onGlobalFilterChange={setFieldSearch}
            searchPlaceholder={t("fields.table.searchPlaceholder")}
            emptyMessage={t("fields.table.empty")}
            renderRowActions={fieldActions}
          />
        </TabsContent>

        {/* --- Culturas --- */}
        <TabsContent value="crops" className="space-y-4">
          <div className="flex justify-end">
            <WriteGuard module="agricultura">
              <Button onClick={openCropCreate}>
                <Plus className="mr-2 h-4 w-4" /> {t("crops.new")}
              </Button>
            </WriteGuard>
          </div>
          <DataTable
            columns={cropColumns}
            data={cropsQuery.data?.data ?? []}
            loading={cropsQuery.isLoading}
            pageCount={cropsQuery.data?.meta.lastPage ?? 0}
            pagination={cropPage}
            onPaginationChange={setCropPage}
            rowCount={cropsQuery.data?.meta.total}
            globalFilter={cropSearch}
            onGlobalFilterChange={setCropSearch}
            searchPlaceholder={t("crops.table.searchPlaceholder")}
            emptyMessage={t("crops.table.empty")}
            renderRowActions={cropActions}
          />
        </TabsContent>

        {/* --- Colheitas --- */}
        <TabsContent value="harvests" className="space-y-4">
          <div className="flex justify-end">
            <WriteGuard module="agricultura">
              <Button onClick={openHarvestCreate} disabled={allFields.length === 0}>
                <Plus className="mr-2 h-4 w-4" /> {t("harvests.new")}
              </Button>
            </WriteGuard>
          </div>
          <DataTable
            columns={harvestColumns}
            data={harvestsQuery.data?.data ?? []}
            loading={harvestsQuery.isLoading}
            pageCount={harvestsQuery.data?.meta.lastPage ?? 0}
            pagination={harvestPage}
            onPaginationChange={setHarvestPage}
            rowCount={harvestsQuery.data?.meta.total}
            globalFilter={harvestSearch}
            onGlobalFilterChange={setHarvestSearch}
            searchPlaceholder={t("harvests.table.searchPlaceholder")}
            emptyMessage={t("harvests.table.empty")}
            renderRowActions={harvestActions}
          />
        </TabsContent>
      </Tabs>

      {/* ===================== Dialog de cultura ===================== */}
      <EntityFormDialog
        open={cropForm}
        onOpenChange={setCropForm}
        title={cropEdit ? t("crops.dialog.editTitle") : t("crops.dialog.createTitle")}
        form={cropEntityForm}
        submitLabel={cropEdit ? t("form.submitEdit") : t("form.submitCreate")}
        submittingLabel={t("form.submitting")}
        cancelLabel={t("form.cancel")}
      >
        {(form) => (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("crops.form.name")}</FormLabel>
                  <FormControl><Input placeholder={t("crops.form.namePlaceholder")} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="cycleDays" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("crops.form.cycleDays")}</FormLabel>
                  <FormControl><Input type="number" min="0" {...field} value={field.value ?? ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="scientificName" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("crops.form.scientificName")}</FormLabel>
                <FormControl><Input placeholder={t("crops.form.scientificNamePlaceholder")} {...field} value={field.value ?? ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("crops.form.notes")}</FormLabel>
                <FormControl><Textarea {...field} value={field.value ?? ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </>
        )}
      </EntityFormDialog>

      {/* ===================== Dialog de talhão ===================== */}
      <EntityFormDialog
        open={fieldForm}
        onOpenChange={setFieldForm}
        title={fieldEdit ? t("fields.dialog.editTitle") : t("fields.dialog.createTitle")}
        form={fieldEntityForm}
        submitLabel={fieldEdit ? t("form.submitEdit") : t("form.submitCreate")}
        submittingLabel={t("form.submitting")}
        cancelLabel={t("form.cancel")}
      >
        {(form) => (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="stationId" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.form.station")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue placeholder={t("common.selectPlaceholder")} /></SelectTrigger></FormControl>
                    <SelectContent>
                      {estacoes.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="cropId" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.form.crop")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue placeholder={t("common.selectPlaceholder")} /></SelectTrigger></FormControl>
                    <SelectContent>
                      {crops.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="fieldCode" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.form.code")}</FormLabel>
                  <FormControl><Input placeholder={t("fields.form.codePlaceholder")} {...field} value={field.value ?? ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="areaHa" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.form.area")}</FormLabel>
                  <FormControl><Input type="number" min="0" step="0.01" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="plantingDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.form.planting")}</FormLabel>
                  <FormControl><Input type="date" {...field} value={field.value ?? ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="expectedHarvest" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.form.harvest")}</FormLabel>
                  <FormControl><Input type="date" {...field} value={field.value ?? ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="status" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("fields.form.status")}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    {FIELD_STATUSES.map((s) => <SelectItem key={s} value={s}>{t(`status.${s}`)}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("fields.form.notes")}</FormLabel>
                <FormControl><Textarea {...field} value={field.value ?? ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </>
        )}
      </EntityFormDialog>

      {/* ===================== Dialog de colheita ===================== */}
      <EntityFormDialog
        open={harvestForm}
        onOpenChange={setHarvestForm}
        title={harvestEdit ? t("harvests.dialog.editTitle") : t("harvests.dialog.createTitle")}
        form={harvestEntityForm}
        submitLabel={harvestEdit ? t("form.submitEdit") : t("form.submitCreate")}
        submittingLabel={t("form.submitting")}
        cancelLabel={t("form.cancel")}
      >
        {(form) => (
          <>
            <FormField control={form.control} name="fieldId" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("harvests.form.field")}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger><SelectValue placeholder={t("common.selectPlaceholder")} /></SelectTrigger></FormControl>
                  <SelectContent>
                    {allFields.map((f) => <SelectItem key={f.id} value={f.id}>{fieldLabel(f.id)}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField control={form.control} name="harvestDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("harvests.form.date")}</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="quantity" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("harvests.form.quantity")}</FormLabel>
                  <FormControl><Input type="number" min="0" step="0.01" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="unit" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("harvests.form.unit")}</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="qualityGrade" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("harvests.form.quality")}</FormLabel>
                <FormControl><Input placeholder={t("harvests.form.qualityPlaceholder")} {...field} value={field.value ?? ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("harvests.form.notes")}</FormLabel>
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

      {/* ===================== Detalhes: cultura ===================== */}
      <Dialog open={!!cropView} onOpenChange={(o) => !o && setCropView(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-serif">{t("crops.dialog.detailsTitle")}</DialogTitle></DialogHeader>
          {cropView && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground">{t("crops.details.name")}:</span><p className="font-medium">{cropView.name}</p></div>
                <div><span className="text-muted-foreground">{t("crops.details.scientificName")}:</span><p className="font-medium italic">{cropView.scientificName ?? t("common.emptyCell")}</p></div>
                <div><span className="text-muted-foreground">{t("crops.details.cycleDays")}:</span><p className="font-medium">{cropView.cycleDays ?? t("common.emptyCell")}</p></div>
                <div><span className="text-muted-foreground">{t("crops.details.createdAt")}:</span><p className="font-medium">{formatDate(cropView.createdAt)}</p></div>
              </div>
              {cropView.notes && (
                <div><span className="text-muted-foreground">{t("crops.details.notes")}:</span><p className="font-medium mt-1">{cropView.notes}</p></div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ===================== Detalhes: talhão ===================== */}
      <Dialog open={!!fieldView} onOpenChange={(o) => !o && setFieldView(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-serif">{t("fields.dialog.detailsTitle")}</DialogTitle></DialogHeader>
          {fieldView && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground">{t("fields.details.code")}:</span><p className="font-medium">{fieldView.fieldCode ?? t("common.emptyCell")}</p></div>
                <div><span className="text-muted-foreground">{t("fields.details.status")}:</span><p><Badge variant={statusVariant[fieldView.status]}>{t(`status.${fieldView.status}`)}</Badge></p></div>
                <div><span className="text-muted-foreground">{t("fields.details.station")}:</span><p className="font-medium">{stationName(fieldView.stationId)}</p></div>
                <div><span className="text-muted-foreground">{t("fields.details.crop")}:</span><p className="font-medium">{cropName(fieldView.cropId)}</p></div>
                <div><span className="text-muted-foreground">{t("fields.details.area")}:</span><p className="font-medium">{formatNumber(fieldView.areaHa)} ha</p></div>
                <div><span className="text-muted-foreground">{t("fields.details.planting")}:</span><p className="font-medium">{fieldView.plantingDate ? formatDate(fieldView.plantingDate) : t("common.emptyCell")}</p></div>
                <div><span className="text-muted-foreground">{t("fields.details.harvest")}:</span><p className="font-medium">{fieldView.expectedHarvest ? formatDate(fieldView.expectedHarvest) : t("common.emptyCell")}</p></div>
                <div><span className="text-muted-foreground">{t("fields.details.createdAt")}:</span><p className="font-medium">{formatDate(fieldView.createdAt)}</p></div>
              </div>
              {fieldView.notes && (
                <div><span className="text-muted-foreground">{t("fields.details.notes")}:</span><p className="font-medium mt-1">{fieldView.notes}</p></div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ===================== Detalhes: colheita ===================== */}
      <Dialog open={!!harvestView} onOpenChange={(o) => !o && setHarvestView(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-serif">{t("harvests.dialog.detailsTitle")}</DialogTitle></DialogHeader>
          {harvestView && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><span className="text-muted-foreground">{t("harvests.details.field")}:</span><p className="font-medium">{fieldLabel(harvestView.fieldId)}</p></div>
                <div><span className="text-muted-foreground">{t("harvests.details.date")}:</span><p className="font-medium">{formatDate(harvestView.harvestDate)}</p></div>
                <div><span className="text-muted-foreground">{t("harvests.details.quantity")}:</span><p className="font-medium">{formatNumber(harvestView.quantity)} {harvestView.unit}</p></div>
                <div><span className="text-muted-foreground">{t("harvests.details.quality")}:</span><p className="font-medium">{harvestView.qualityGrade ?? t("common.emptyCell")}</p></div>
                <div><span className="text-muted-foreground">{t("harvests.details.createdAt")}:</span><p className="font-medium">{formatDate(harvestView.createdAt)}</p></div>
              </div>
              {harvestView.notes && (
                <div><span className="text-muted-foreground">{t("harvests.details.notes")}:</span><p className="font-medium mt-1">{harvestView.notes}</p></div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
