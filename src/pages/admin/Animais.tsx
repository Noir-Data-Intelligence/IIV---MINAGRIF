import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import type { TFunction } from "i18next";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  Baby,
  Beef,
  Eye,
  Pencil,
  Plus,
  Rabbit,
  Stethoscope,
  Trash2,
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEntityForm } from "@/hooks/useEntityForm";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import {
  useAnimaisList,
  useAnimalEvents,
  useCreateAnimal,
  useCreateAnimalEvent,
  useCreateHealthRecord,
  useDeleteAnimal,
  useHealthRecords,
  useUpdateAnimal,
} from "@/hooks/queries/useAnimais";
import { useEstacoesList } from "@/hooks/queries/useEstacoes";
import type { AnimalDto, AnimalSex, AnimalStatus } from "@/types/dto/animal";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import i18n from "@/i18n";
import ptAnimais from "@/i18n/locales/pt/admin/animais.json";
import enAnimais from "@/i18n/locales/en/admin/animais.json";

// Namespace "animais" registado em runtime, guardado por `hasResourceBundle`
// (mesmo padrão de Estacoes.tsx/Departamentos.tsx — mantém a página autónoma).
if (!i18n.hasResourceBundle("pt", "animais"))
  i18n.addResourceBundle("pt", "animais", ptAnimais, true, true);
if (!i18n.hasResourceBundle("en", "animais"))
  i18n.addResourceBundle("en", "animais", enAnimais, true, true);

const SEX_VALUES: AnimalSex[] = ["macho", "femea"];
const STATUS_VALUES: AnimalStatus[] = ["activo", "vendido", "morto", "abatido", "transferido"];
const EVENT_TYPES = [
  "nascimento",
  "pesagem",
  "vacinacao",
  "tratamento",
  "transferencia",
  "venda",
  "morte",
  "abate",
  "observacao",
];
const RECORD_TYPES = ["vacina", "tratamento", "diagnostico", "desparasitacao"];

const statusVariant: Record<AnimalStatus, "default" | "secondary" | "destructive" | "outline"> = {
  activo: "default",
  vendido: "secondary",
  morto: "destructive",
  abatido: "destructive",
  transferido: "outline",
};

function buildAnimalSchema(t: TFunction) {
  return z.object({
    stationId: z.string().min(1, t("validation.stationRequired")),
    tag: z.string().trim().min(1, t("validation.tagShort")),
    name: z.string().trim().optional(),
    species: z.string().trim().min(1, t("validation.speciesRequired")),
    breed: z.string().trim().optional(),
    sex: z.enum(["macho", "femea"], {
      errorMap: () => ({ message: t("validation.sexRequired") }),
    }),
    birthDate: z.string().optional(),
    motherTag: z.string().trim().optional(),
    fatherTag: z.string().trim().optional(),
    status: z.enum(["activo", "vendido", "morto", "abatido", "transferido"]),
    weight: z.string().trim().optional(),
    notes: z.string().trim().optional(),
  });
}

type AnimalFormValues = z.infer<ReturnType<typeof buildAnimalSchema>>;

const ALL = "__all";

export default function Animais() {
  const { t, i18n: i18nInstance } = useTranslation("animais");
  const { canWrite } = useUserRole();
  const canEdit = canWrite("animais");
  const prefersReducedMotion = useReducedMotion();

  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [search, setSearch] = useState("");
  const [filterStation, setFilterStation] = useState<string>(ALL);
  const [filterStatus, setFilterStatus] = useState<string>(ALL);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewItem, setViewItem] = useState<AnimalDto | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<AnimalDto | null>(null);

  // Estações (dependência) — populam o Select do formulário e os filtros.
  const { data: stationsData } = useEstacoesList({ page: 1, perPage: 100 });
  const stations = stationsData?.data ?? [];
  const stationName = (id: string) => stations.find((s) => s.id === id)?.name ?? t("table.emptyCell");

  const { data, isLoading } = useAnimaisList({
    page: pagination.pageIndex + 1,
    perPage: pagination.pageSize,
    search: search || undefined,
    stationId: filterStation === ALL ? undefined : filterStation,
    status: filterStatus === ALL ? undefined : (filterStatus as AnimalStatus),
  });

  // Query separada (dataset amplo) para KPIs agregados, independente da página.
  const { data: statsData } = useAnimaisList({ page: 1, perPage: 100 });

  const createAnimal = useCreateAnimal();
  const updateAnimal = useUpdateAnimal();
  const deleteAnimal = useDeleteAnimal();

  const animalSchema = useMemo(() => buildAnimalSchema(t), [t]);

  const initialValues = useMemo<Partial<AnimalFormValues> | undefined>(
    () =>
      editItem
        ? {
            stationId: editItem.stationId,
            tag: editItem.tag,
            name: editItem.name ?? "",
            species: editItem.species,
            breed: editItem.breed ?? "",
            sex: editItem.sex,
            birthDate: editItem.birthDate ?? "",
            motherTag: editItem.motherTag ?? "",
            fatherTag: editItem.fatherTag ?? "",
            status: editItem.status,
            weight: editItem.currentWeightKg != null ? String(editItem.currentWeightKg) : "",
            notes: editItem.notes ?? "",
          }
        : undefined,
    [editItem],
  );

  const entityForm = useEntityForm({
    schema: animalSchema,
    initialValues,
    defaultValues: {
      stationId: "",
      tag: "",
      name: "",
      species: "",
      breed: "",
      sex: undefined,
      birthDate: "",
      motherTag: "",
      fatherTag: "",
      status: "activo",
      weight: "",
      notes: "",
    },
    open: formOpen,
    onSubmit: async (values) => {
      const payload: Partial<AnimalDto> = {
        stationId: values.stationId,
        tag: values.tag,
        name: values.name?.trim() ? values.name.trim() : null,
        species: values.species,
        breed: values.breed?.trim() ? values.breed.trim() : null,
        sex: values.sex,
        birthDate: values.birthDate?.trim() ? values.birthDate : null,
        motherTag: values.motherTag?.trim() ? values.motherTag.trim() : null,
        fatherTag: values.fatherTag?.trim() ? values.fatherTag.trim() : null,
        status: values.status,
        currentWeightKg: values.weight?.trim() ? Number(values.weight) : null,
        notes: values.notes?.trim() ? values.notes.trim() : null,
      };
      if (editItem) {
        await updateAnimal.mutateAsync({ id: editItem.id, payload });
      } else {
        await createAnimal.mutateAsync(payload);
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

  const openEdit = (a: AnimalDto) => {
    setEditItem(a);
    setFormOpen(true);
  };

  const stats = useMemo(() => {
    const rows = statsData?.data ?? [];
    const active = rows.filter((a) => a.status === "activo");
    return {
      total: statsData?.meta.total ?? rows.length,
      active: active.length,
      males: active.filter((a) => a.sex === "macho").length,
      females: active.filter((a) => a.sex === "femea").length,
    };
  }, [statsData]);

  const columns = useMemo<ColumnDef<AnimalDto>[]>(
    () => [
      {
        accessorKey: "tag",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.tag")} />,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Rabbit className="h-4 w-4 text-primary" />
            <div>
              <p className="font-medium">{row.original.tag}</p>
              {row.original.name && (
                <p className="text-xs text-muted-foreground">{row.original.name}</p>
              )}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "species",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.speciesBreed")} />,
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.species}</p>
            {row.original.breed && (
              <p className="text-xs text-muted-foreground">{row.original.breed}</p>
            )}
          </div>
        ),
      },
      {
        accessorKey: "sex",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.sex")} />,
        cell: ({ row }) => <Badge variant="outline">{t(`sex.${row.original.sex}`)}</Badge>,
      },
      {
        accessorKey: "stationId",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.station")} />,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{stationName(row.original.stationId)}</span>
        ),
      },
      {
        accessorKey: "status",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.status")} />,
        cell: ({ row }) => (
          <Badge variant={statusVariant[row.original.status]}>{t(`status.${row.original.status}`)}</Badge>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, stations],
  );

  const renderRowActions = (row: AnimalDto) => {
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
      <AdminPageHeader icon={Rabbit} title={t("page.title")} description={t("page.description")}>
        <WriteGuard module="animais">
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> {t("actions.new")}
          </Button>
        </WriteGuard>
      </AdminPageHeader>

      <motion.div
        className="grid gap-4 grid-cols-2 lg:grid-cols-4"
        variants={prefersReducedMotion ? undefined : staggerContainer}
        initial={prefersReducedMotion ? undefined : "hidden"}
        animate={prefersReducedMotion ? undefined : "visible"}
      >
        <motion.div variants={prefersReducedMotion ? undefined : fadeInUp}>
          <AdminCard variant="gradient-green-gold" icon={Rabbit} metric={stats.total} title={t("kpi.total")} caption={t("kpi.totalCaption")} />
        </motion.div>
        <motion.div variants={prefersReducedMotion ? undefined : fadeInUp}>
          <AdminCard variant="glass" icon={Activity} metric={stats.active} title={t("kpi.active")} caption={t("kpi.activeCaption")} />
        </motion.div>
        <motion.div variants={prefersReducedMotion ? undefined : fadeInUp}>
          <AdminCard variant="glass" icon={Beef} metric={stats.males} title={t("kpi.males")} caption={t("kpi.malesCaption")} />
        </motion.div>
        <motion.div variants={prefersReducedMotion ? undefined : fadeInUp}>
          <AdminCard variant="glass" icon={Baby} metric={stats.females} title={t("kpi.females")} caption={t("kpi.femalesCaption")} />
        </motion.div>
      </motion.div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Select value={filterStation} onValueChange={setFilterStation}>
          <SelectTrigger className="sm:w-64">
            <SelectValue placeholder={t("filters.station")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t("filters.allStations")}</SelectItem>
            {stations.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder={t("filters.status")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t("filters.allStatuses")}</SelectItem>
            {STATUS_VALUES.map((s) => (
              <SelectItem key={s} value={s}>
                {t(`status.${s}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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
              name="stationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.labels.station")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("form.placeholders.station")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {stations.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tag"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.labels.tag")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("form.placeholders.tag")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.labels.name")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("form.placeholders.name")} {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="species"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.labels.species")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("form.placeholders.species")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="breed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.labels.breed")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("form.placeholders.breed")} {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sex"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.labels.sex")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("form.placeholders.sex")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SEX_VALUES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {t(`sex.${s}`)}
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
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.labels.status")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("form.placeholders.status")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STATUS_VALUES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {t(`status.${s}`)}
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
                name="birthDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.labels.birthDate")}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.labels.weight")}</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="motherTag"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.labels.motherTag")}</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fatherTag"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.labels.fatherTag")}</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.labels.notes")}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={t("form.placeholders.notes")} {...field} value={field.value ?? ""} />
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
          await deleteAnimal.mutateAsync(deleteId);
          setDeleteId(null);
        }}
      />

      <AnimalDetailDialog
        animal={viewItem}
        onOpenChange={(o) => !o && setViewItem(null)}
        canEdit={canEdit}
        stationName={stationName}
        locale={i18nInstance.language === "en" ? "en-GB" : "pt-AO"}
      />
    </div>
  );
}

/* ===== Detalhe do animal: ficha + eventos + registos sanitários ===== */

function AnimalDetailDialog({
  animal,
  onOpenChange,
  canEdit,
  stationName,
  locale,
}: {
  animal: AnimalDto | null;
  onOpenChange: (open: boolean) => void;
  canEdit: boolean;
  stationName: (id: string) => string;
  locale: string;
}) {
  const { t } = useTranslation("animais");
  const animalId = animal?.id ?? null;

  const { data: events = [] } = useAnimalEvents(animalId);
  const { data: health = [] } = useHealthRecords(animalId);

  const [eventOpen, setEventOpen] = useState(false);
  const [healthOpen, setHealthOpen] = useState(false);

  const fmtDate = (value: string | null) =>
    value ? new Date(value).toLocaleDateString(locale) : t("table.emptyCell");

  return (
    <Dialog open={!!animal} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif flex items-center gap-2">
            <Rabbit className="h-5 w-5 text-primary" />
            {animal?.tag}
            {animal?.name && <span className="text-muted-foreground font-normal">— {animal.name}</span>}
          </DialogTitle>
        </DialogHeader>

        {animal && (
          <Tabs defaultValue="ficha" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="ficha">{t("detail.tabs.ficha")}</TabsTrigger>
              <TabsTrigger value="eventos">
                <Activity className="mr-1 h-4 w-4" /> {t("detail.tabs.eventos")} ({events.length})
              </TabsTrigger>
              <TabsTrigger value="saude">
                <Stethoscope className="mr-1 h-4 w-4" /> {t("detail.tabs.saude")} ({health.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ficha" className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <DetailField label={t("detail.fields.species")} value={animal.species} />
                <DetailField label={t("detail.fields.breed")} value={animal.breed || t("table.emptyCell")} />
                <DetailField label={t("detail.fields.sex")} value={t(`sex.${animal.sex}`)} />
                <DetailField label={t("detail.fields.birthDate")} value={fmtDate(animal.birthDate)} />
                <DetailField label={t("detail.fields.mother")} value={animal.motherTag || t("table.emptyCell")} />
                <DetailField label={t("detail.fields.father")} value={animal.fatherTag || t("table.emptyCell")} />
                <DetailField
                  label={t("detail.fields.weight")}
                  value={animal.currentWeightKg != null ? `${animal.currentWeightKg} kg` : t("table.emptyCell")}
                />
                <div>
                  <span className="text-muted-foreground">{t("detail.fields.status")}:</span>
                  <p>
                    <Badge variant={statusVariant[animal.status]}>{t(`status.${animal.status}`)}</Badge>
                  </p>
                </div>
                <DetailField label={t("detail.fields.station")} value={stationName(animal.stationId)} />
              </div>
              {animal.notes && (
                <div>
                  <span className="text-muted-foreground">{t("detail.fields.notes")}:</span>
                  <p className="font-medium mt-1">{animal.notes}</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="eventos" className="space-y-3">
              {canEdit && (
                <Button size="sm" onClick={() => setEventOpen(true)}>
                  <Plus className="mr-1 h-4 w-4" /> {t("detail.events.new")}
                </Button>
              )}
              {events.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">{t("detail.events.empty")}</p>
              ) : (
                <div className="space-y-2">
                  {events.map((e) => (
                    <div key={e.id} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <Badge variant="secondary">
                          {t(`eventTypes.${e.eventType}`, { defaultValue: e.eventType })}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{fmtDate(e.eventDate)}</span>
                      </div>
                      {e.notes && <p className="text-sm">{e.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
              {animalId && (
                <EventDialog open={eventOpen} onOpenChange={setEventOpen} animalId={animalId} />
              )}
            </TabsContent>

            <TabsContent value="saude" className="space-y-3">
              {canEdit && (
                <Button size="sm" onClick={() => setHealthOpen(true)}>
                  <Plus className="mr-1 h-4 w-4" /> {t("detail.health.new")}
                </Button>
              )}
              {health.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">{t("detail.health.empty")}</p>
              ) : (
                <div className="space-y-2">
                  {health.map((h) => (
                    <div key={h.id} className="rounded-lg border p-3 text-sm">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <Badge variant="secondary">
                          {t(`recordTypes.${h.recordType}`, { defaultValue: h.recordType })}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{fmtDate(h.recordDate)}</span>
                      </div>
                      {h.productName && (
                        <p>
                          <span className="text-muted-foreground">{t("detail.health.product")}:</span>{" "}
                          {h.productName} {h.dosage && `(${h.dosage})`}
                        </p>
                      )}
                      {h.diagnosis && (
                        <p>
                          <span className="text-muted-foreground">{t("detail.health.diagnosis")}:</span> {h.diagnosis}
                        </p>
                      )}
                      {h.treatment && (
                        <p>
                          <span className="text-muted-foreground">{t("detail.health.treatment")}:</span> {h.treatment}
                        </p>
                      )}
                      {h.veterinarian && (
                        <p className="text-xs text-muted-foreground">
                          {t("detail.health.veterinarian")}: {h.veterinarian}
                        </p>
                      )}
                      {h.nextDueDate && (
                        <p className="text-xs text-primary">
                          {t("detail.health.next")}: {fmtDate(h.nextDueDate)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {animalId && (
                <HealthDialog open={healthOpen} onOpenChange={setHealthOpen} animalId={animalId} />
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-muted-foreground">{label}:</span>
      <p className="font-medium">{value}</p>
    </div>
  );
}

/* ===== Sub-diálogo: registar evento ===== */

function EventDialog({
  open,
  onOpenChange,
  animalId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  animalId: string;
}) {
  const { t } = useTranslation("animais");
  const { toast } = useToast();
  const createEvent = useCreateAnimalEvent(animalId);

  const [eventType, setEventType] = useState("observacao");
  const [eventDate, setEventDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      await createEvent.mutateAsync({ eventType, eventDate, notes: notes.trim() || null });
      toast({ title: t("toast.eventSuccess") });
      setNotes("");
      onOpenChange(false);
    } catch {
      toast({ title: t("toast.error"), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-serif">{t("detail.events.dialogTitle")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>{t("detail.events.type")}</Label>
            <Select value={eventType} onValueChange={setEventType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((k) => (
                  <SelectItem key={k} value={k}>
                    {t(`eventTypes.${k}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t("detail.events.date")}</Label>
            <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
          </div>
          <div>
            <Label>{t("detail.events.notes")}</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {t("form.cancel")}
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? t("form.submitting") : t("detail.events.submit")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ===== Sub-diálogo: registo sanitário ===== */

function HealthDialog({
  open,
  onOpenChange,
  animalId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  animalId: string;
}) {
  const { t } = useTranslation("animais");
  const { toast } = useToast();
  const createHealth = useCreateHealthRecord(animalId);

  const [recordType, setRecordType] = useState("vacina");
  const [productName, setProductName] = useState("");
  const [dosage, setDosage] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [treatment, setTreatment] = useState("");
  const [veterinarian, setVeterinarian] = useState("");
  const [recordDate, setRecordDate] = useState(new Date().toISOString().slice(0, 10));
  const [nextDueDate, setNextDueDate] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      await createHealth.mutateAsync({
        recordType,
        productName: productName.trim() || null,
        dosage: dosage.trim() || null,
        diagnosis: diagnosis.trim() || null,
        treatment: treatment.trim() || null,
        veterinarian: veterinarian.trim() || null,
        recordDate,
        nextDueDate: nextDueDate || null,
      });
      toast({ title: t("toast.healthSuccess") });
      setProductName("");
      setDosage("");
      setDiagnosis("");
      setTreatment("");
      setVeterinarian("");
      setNextDueDate("");
      onOpenChange(false);
    } catch {
      toast({ title: t("toast.error"), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif">{t("detail.health.dialogTitle")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>{t("detail.health.type")}</Label>
            <Select value={recordType} onValueChange={setRecordType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RECORD_TYPES.map((k) => (
                  <SelectItem key={k} value={k}>
                    {t(`recordTypes.${k}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t("detail.health.product")}</Label>
              <Input value={productName} onChange={(e) => setProductName(e.target.value)} />
            </div>
            <div>
              <Label>{t("detail.health.dosage")}</Label>
              <Input value={dosage} onChange={(e) => setDosage(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>{t("detail.health.diagnosis")}</Label>
            <Textarea value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
          </div>
          <div>
            <Label>{t("detail.health.treatment")}</Label>
            <Textarea value={treatment} onChange={(e) => setTreatment(e.target.value)} />
          </div>
          <div>
            <Label>{t("detail.health.veterinarian")}</Label>
            <Input value={veterinarian} onChange={(e) => setVeterinarian(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t("detail.health.date")}</Label>
              <Input type="date" value={recordDate} onChange={(e) => setRecordDate(e.target.value)} />
            </div>
            <div>
              <Label>{t("detail.health.nextDate")}</Label>
              <Input type="date" value={nextDueDate} onChange={(e) => setNextDueDate(e.target.value)} />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {t("form.cancel")}
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? t("form.submitting") : t("detail.health.submit")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
