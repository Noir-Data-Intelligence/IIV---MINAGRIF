import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "framer-motion";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { Activity, AlertTriangle, Building2, Dna, Droplet, FlaskConical, Pencil, Plus, Trash2 } from "lucide-react";

import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { DataTable, DataTableColumnHeader } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import { useAnimaisList } from "@/hooks/queries/useAnimais";
import {
  useCentrosList,
  useCreateCentro,
  useCreateDose,
  useCreateRegisto,
  useCreateReprodutor,
  useCreateTanque,
  useDeleteCentro,
  useDeleteDose,
  useDeleteRegisto,
  useDeleteReprodutor,
  useDeleteTanque,
  useDosesList,
  useRegistosList,
  useReprodutoresList,
  useTanquesList,
  useUpdateCentro,
  useUpdateDose,
  useUpdateRegisto,
  useUpdateReprodutor,
  useUpdateTanque,
} from "@/hooks/queries/useInseminacao";
import type {
  BreederDto,
  BreederStatus,
  DoseDto,
  IACenterDto,
  InsemDto,
  InseminationResult,
  SemenQuality,
  TankDto,
} from "@/types/dto/inseminacao";
import i18n from "@/i18n";
import ptInseminacao from "@/i18n/locales/pt/admin/inseminacao.json";
import enInseminacao from "@/i18n/locales/en/admin/inseminacao.json";

// Namespace "inseminacao" registado em runtime, guardado por `hasResourceBundle`.
if (!i18n.hasResourceBundle("pt", "inseminacao"))
  i18n.addResourceBundle("pt", "inseminacao", ptInseminacao, true, true);
if (!i18n.hasResourceBundle("en", "inseminacao"))
  i18n.addResourceBundle("en", "inseminacao", enInseminacao, true, true);

type DeleteTarget = { kind: "centro" | "reprodutor" | "tanque" | "dose" | "registo"; id: string };

const resultVariant: Record<InseminationResult, "default" | "secondary" | "destructive" | "outline"> = {
  pendente: "outline",
  confirmada: "default",
  falhou: "destructive",
};

/**
 * As 5 listas deste módulo (centros/reprodutores/tanques/doses/registos) não
 * são paginadas no servidor (os hooks trazem o conjunto completo) — o
 * `DataTable` espera em `data` apenas a página actual, por isso fatiamos aqui
 * em memória, à semelhança de PainelDetalhe.tsx.
 */
function usePageSlice<T>(rows: T[], pageSize = 10) {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize });
  const pageRows = useMemo(
    () => rows.slice(pagination.pageIndex * pagination.pageSize, (pagination.pageIndex + 1) * pagination.pageSize),
    [rows, pagination],
  );
  const pageCount = Math.max(1, Math.ceil(rows.length / pagination.pageSize));
  return { pagination, setPagination, pageRows, pageCount };
}

export default function Inseminacao() {
  const { t } = useTranslation("inseminacao");
  const { canWrite } = useUserRole();
  const { toast } = useToast();
  const canEdit = canWrite("inseminacao");
  const prefersReducedMotion = useReducedMotion();

  const { data: centers = [], isLoading: loadingCenters } = useCentrosList();
  const { data: breeders = [], isLoading: loadingBreeders } = useReprodutoresList();
  const { data: tanks = [], isLoading: loadingTanks } = useTanquesList();
  const { data: doses = [], isLoading: loadingDoses } = useDosesList();
  const { data: insems = [], isLoading: loadingInsems } = useRegistosList();
  const { data: animalsData } = useAnimaisList({ page: 1, perPage: 100 });
  const animals = animalsData?.data ?? [];

  const createCentro = useCreateCentro();
  const updateCentro = useUpdateCentro();
  const deleteCentro = useDeleteCentro();
  const createReprodutor = useCreateReprodutor();
  const updateReprodutor = useUpdateReprodutor();
  const deleteReprodutor = useDeleteReprodutor();
  const createTanque = useCreateTanque();
  const updateTanque = useUpdateTanque();
  const deleteTanque = useDeleteTanque();
  const createDose = useCreateDose();
  const updateDose = useUpdateDose();
  const deleteDose = useDeleteDose();
  const createRegisto = useCreateRegisto();
  const updateRegisto = useUpdateRegisto();
  const deleteRegisto = useDeleteRegisto();

  // dialogs
  const [centerOpen, setCenterOpen] = useState(false);
  const [centerEdit, setCenterEdit] = useState<IACenterDto | null>(null);
  const [breederOpen, setBreederOpen] = useState(false);
  const [breederEdit, setBreederEdit] = useState<BreederDto | null>(null);
  const [tankOpen, setTankOpen] = useState(false);
  const [tankEdit, setTankEdit] = useState<TankDto | null>(null);
  const [doseOpen, setDoseOpen] = useState(false);
  const [doseEdit, setDoseEdit] = useState<DoseDto | null>(null);
  const [insemOpen, setInsemOpen] = useState(false);
  const [insemEdit, setInsemEdit] = useState<InsemDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const kpis = useMemo(() => {
    const totalDoses = doses.reduce((s, d) => s + (d.availableQuantity || 0), 0);
    const lowTanks = tanks.filter((t) => t.currentLevelL <= t.minLevelL).length;
    const confirmed = insems.filter((i) => i.result === "confirmada").length;
    const evaluated = insems.filter((i) => i.result !== "pendente").length;
    const rate = evaluated > 0 ? Math.round((confirmed / evaluated) * 100) : 0;
    return { totalDoses, lowTanks, rate, activeBreeders: breeders.filter((b) => b.status === "activo").length };
  }, [doses, tanks, insems, breeders]);

  const centerName = (id: string) => centers.find((c) => c.id === id)?.name ?? t("common.none");
  const breederTag = (id: string) => breeders.find((b) => b.id === id)?.tag ?? t("common.none");
  const tankCode = (id: string | null) => (id ? tanks.find((tk) => tk.id === id)?.code ?? t("common.none") : t("common.none"));
  const animalTag = (id: string) => animals.find((a) => a.id === id)?.tag ?? t("common.none");

  const centersPage = usePageSlice(centers);
  const breedersPage = usePageSlice(breeders);
  const tanksPage = usePageSlice(tanks);
  const dosesPage = usePageSlice(doses);
  const insemsPage = usePageSlice(insems);

  const centerColumns = useMemo<ColumnDef<IACenterDto>[]>(() => [
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("centros.table.name")} />,
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: "location",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("centros.table.location")} />,
      cell: ({ row }) => row.original.location ?? t("common.none"),
    },
    {
      accessorKey: "isActive",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("centros.table.status")} />,
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? "default" : "secondary"}>
          {row.original.isActive ? t("centros.status.active") : t("centros.status.inactive")}
        </Badge>
      ),
    },
  ], [t]);

  const breederColumns = useMemo<ColumnDef<BreederDto>[]>(() => [
    {
      accessorKey: "tag",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("reprodutores.table.tag")} />,
      cell: ({ row }) => <span className="font-mono">{row.original.tag}</span>,
    },
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("reprodutores.table.name")} />,
      cell: ({ row }) => row.original.name ?? t("common.none"),
    },
    {
      accessorKey: "species",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("reprodutores.table.species")} />,
    },
    {
      accessorKey: "breed",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("reprodutores.table.breed")} />,
      cell: ({ row }) => row.original.breed ?? t("common.none"),
    },
    {
      accessorKey: "centerId",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("reprodutores.table.center")} />,
      cell: ({ row }) => centerName(row.original.centerId),
    },
    {
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("reprodutores.table.status")} />,
      cell: ({ row }) => (
        <Badge variant={row.original.status === "activo" ? "default" : "secondary"}>
          {t(`breederStatus.${row.original.status}`)}
        </Badge>
      ),
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [t, centers]);

  const tankColumns = useMemo<ColumnDef<TankDto>[]>(() => [
    {
      accessorKey: "code",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("tanques.table.code")} />,
      cell: ({ row }) => <span className="font-mono">{row.original.code}</span>,
    },
    {
      accessorKey: "centerId",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("tanques.table.center")} />,
      cell: ({ row }) => centerName(row.original.centerId),
    },
    {
      accessorKey: "capacityL",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("tanques.table.capacity")} />,
    },
    {
      accessorKey: "currentLevelL",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("tanques.table.level")} />,
      cell: ({ row }) => `${row.original.currentLevelL} L`,
    },
    {
      accessorKey: "lastRefillDate",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("tanques.table.lastRefill")} />,
      cell: ({ row }) => row.original.lastRefillDate ?? t("common.none"),
    },
    {
      id: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("tanques.table.status")} />,
      cell: ({ row }) => {
        const low = row.original.currentLevelL <= row.original.minLevelL;
        return low
          ? <Badge variant="destructive">{t("tanques.low")}</Badge>
          : <Badge variant="default">{t("tanques.ok")}</Badge>;
      },
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [t, centers]);

  const doseColumns = useMemo<ColumnDef<DoseDto>[]>(() => [
    {
      accessorKey: "collectionDate",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("doses.table.date")} />,
    },
    {
      accessorKey: "breederId",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("doses.table.breeder")} />,
      cell: ({ row }) => <span className="font-mono">{breederTag(row.original.breederId)}</span>,
    },
    {
      accessorKey: "tankId",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("doses.table.tank")} />,
      cell: ({ row }) => tankCode(row.original.tankId),
    },
    {
      accessorKey: "quantity",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("doses.table.quantity")} />,
    },
    {
      accessorKey: "availableQuantity",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("doses.table.available")} />,
    },
    {
      accessorKey: "qualityGrade",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("doses.table.quality")} />,
      cell: ({ row }) => <Badge variant="outline">{row.original.qualityGrade ?? t("common.none")}</Badge>,
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [t, breeders, tanks]);

  const insemColumns = useMemo<ColumnDef<InsemDto>[]>(() => [
    {
      accessorKey: "inseminationDate",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("inseminacoes.table.date")} />,
    },
    {
      accessorKey: "animalId",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("inseminacoes.table.animal")} />,
      cell: ({ row }) => <span className="font-mono">{animalTag(row.original.animalId)}</span>,
    },
    {
      accessorKey: "doseId",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("inseminacoes.table.dose")} />,
      cell: ({ row }) => (
        <span className="font-mono">
          {row.original.doseId
            ? breederTag(doses.find((d) => d.id === row.original.doseId)?.breederId ?? "")
            : t("common.none")}
        </span>
      ),
    },
    {
      accessorKey: "result",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("inseminacoes.table.result")} />,
      cell: ({ row }) => <Badge variant={resultVariant[row.original.result]}>{t(`result.${row.original.result}`)}</Badge>,
    },
    {
      accessorKey: "pregnancyConfirmedAt",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("inseminacoes.table.confirmation")} />,
      cell: ({ row }) => row.original.pregnancyConfirmedAt ?? t("common.none"),
    },
    {
      accessorKey: "expectedBirthDate",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("inseminacoes.table.expectedBirth")} />,
      cell: ({ row }) => row.original.expectedBirthDate ?? t("common.none"),
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [t, doses, breeders]);

  // Envolve uma mutação com toast de sucesso/erro e fecho do dialog.
  const runSave = async (fn: () => Promise<unknown>, edit: boolean, close: () => void) => {
    try {
      await fn();
      toast({ title: edit ? t("toast.updated") : t("toast.created") });
      close();
    } catch {
      toast({ title: t("toast.error"), variant: "destructive" });
    }
  };

  const saveCenter = (form: Partial<IACenterDto>) => {
    if (!form.name) return toast({ title: t("toast.requiredFields"), variant: "destructive" });
    const payload = {
      name: form.name,
      location: form.location || null,
      notes: form.notes || null,
      isActive: form.isActive ?? true,
    };
    return runSave(
      () => (centerEdit ? updateCentro.mutateAsync({ id: centerEdit.id, payload }) : createCentro.mutateAsync(payload)),
      !!centerEdit,
      () => { setCenterOpen(false); setCenterEdit(null); },
    );
  };

  const saveBreeder = (form: Partial<BreederDto>) => {
    if (!form.centerId || !form.tag || !form.species) return toast({ title: t("toast.requiredFields"), variant: "destructive" });
    const payload = {
      centerId: form.centerId,
      tag: form.tag,
      name: form.name || null,
      species: form.species,
      breed: form.breed || null,
      birthDate: form.birthDate || null,
      status: form.status || "activo",
      notes: form.notes || null,
    };
    return runSave(
      () => (breederEdit ? updateReprodutor.mutateAsync({ id: breederEdit.id, payload }) : createReprodutor.mutateAsync(payload)),
      !!breederEdit,
      () => { setBreederOpen(false); setBreederEdit(null); },
    );
  };

  const saveTank = (form: Partial<TankDto>) => {
    if (!form.centerId || !form.code) return toast({ title: t("toast.requiredFields"), variant: "destructive" });
    const payload = {
      centerId: form.centerId,
      code: form.code,
      capacityL: Number(form.capacityL) || 0,
      currentLevelL: Number(form.currentLevelL) || 0,
      minLevelL: Number(form.minLevelL) || 0,
      lastRefillDate: form.lastRefillDate || null,
      notes: form.notes || null,
    };
    return runSave(
      () => (tankEdit ? updateTanque.mutateAsync({ id: tankEdit.id, payload }) : createTanque.mutateAsync(payload)),
      !!tankEdit,
      () => { setTankOpen(false); setTankEdit(null); },
    );
  };

  const saveDose = (form: Partial<DoseDto>) => {
    if (!form.breederId) return toast({ title: t("toast.requiredFields"), variant: "destructive" });
    const qty = Number(form.quantity) || 0;
    const payload = {
      breederId: form.breederId,
      tankId: form.tankId || null,
      collectionDate: form.collectionDate || new Date().toISOString().slice(0, 10),
      quantity: qty,
      availableQuantity: Number(form.availableQuantity ?? qty) || 0,
      qualityGrade: (form.qualityGrade as SemenQuality) || "A",
      notes: form.notes || null,
    };
    return runSave(
      () => (doseEdit ? updateDose.mutateAsync({ id: doseEdit.id, payload }) : createDose.mutateAsync(payload)),
      !!doseEdit,
      () => { setDoseOpen(false); setDoseEdit(null); },
    );
  };

  const saveInsem = (form: Partial<InsemDto>) => {
    if (!form.animalId) return toast({ title: t("toast.requiredFields"), variant: "destructive" });
    const payload = {
      animalId: form.animalId,
      doseId: form.doseId || null,
      inseminationDate: form.inseminationDate || new Date().toISOString().slice(0, 10),
      result: (form.result as InseminationResult) || "pendente",
      pregnancyConfirmedAt: form.pregnancyConfirmedAt || null,
      expectedBirthDate: form.expectedBirthDate || null,
      notes: form.notes || null,
    };
    return runSave(
      () => (insemEdit ? updateRegisto.mutateAsync({ id: insemEdit.id, payload }) : createRegisto.mutateAsync(payload)),
      !!insemEdit,
      () => { setInsemOpen(false); setInsemEdit(null); },
    );
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const byKind = {
      centro: deleteCentro,
      reprodutor: deleteReprodutor,
      tanque: deleteTanque,
      dose: deleteDose,
      registo: deleteRegisto,
    } as const;
    try {
      await byKind[deleteTarget.kind].mutateAsync(deleteTarget.id);
      toast({ title: t("toast.deleted") });
    } catch {
      toast({ title: t("toast.error"), variant: "destructive" });
    }
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader icon={Dna} title={t("page.title")} description={t("page.description")} />

      <motion.div
        className="grid gap-4 grid-cols-2 lg:grid-cols-4"
        variants={prefersReducedMotion ? undefined : staggerContainer}
        initial={prefersReducedMotion ? undefined : "hidden"}
        animate={prefersReducedMotion ? undefined : "visible"}
      >
        <motion.div variants={prefersReducedMotion ? undefined : fadeInUp}>
          <AdminCard variant="gradient-green-gold" icon={Building2} metric={kpis.activeBreeders} title={t("kpi.activeBreeders")} caption={t("kpi.activeBreedersCaption")} />
        </motion.div>
        <motion.div variants={prefersReducedMotion ? undefined : fadeInUp}>
          <AdminCard variant="glass" icon={FlaskConical} metric={kpis.totalDoses} title={t("kpi.doses")} caption={t("kpi.dosesCaption")} />
        </motion.div>
        <motion.div variants={prefersReducedMotion ? undefined : fadeInUp}>
          <AdminCard variant="glass" icon={Activity} metric={`${kpis.rate}%`} title={t("kpi.rate")} caption={t("kpi.rateCaption")} />
        </motion.div>
        <motion.div variants={prefersReducedMotion ? undefined : fadeInUp}>
          <AdminCard variant={kpis.lowTanks > 0 ? "gradient-gold" : "glass"} icon={AlertTriangle} metric={kpis.lowTanks} title={t("kpi.lowTanks")} caption={t("kpi.lowTanksCaption")} />
        </motion.div>
      </motion.div>

      <Tabs defaultValue="centros" className="space-y-4">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="centros"><Building2 className="h-4 w-4 mr-1" /> {t("tabs.centros")}</TabsTrigger>
          <TabsTrigger value="reprodutores"><Dna className="h-4 w-4 mr-1" /> {t("tabs.reprodutores")}</TabsTrigger>
          <TabsTrigger value="tanques"><Droplet className="h-4 w-4 mr-1" /> {t("tabs.tanques")}</TabsTrigger>
          <TabsTrigger value="doses"><FlaskConical className="h-4 w-4 mr-1" /> {t("tabs.doses")}</TabsTrigger>
          <TabsTrigger value="inseminacoes"><Activity className="h-4 w-4 mr-1" /> {t("tabs.inseminacoes")}</TabsTrigger>
        </TabsList>

        {/* ============ CENTROS ============ */}
        <TabsContent value="centros">
          <AdminCard title={t("centros.title")}>
            <div className="flex justify-end mb-3">
              {canEdit && (
                <Button onClick={() => { setCenterEdit(null); setCenterOpen(true); }} size="sm">
                  <Plus className="h-4 w-4 mr-1" /> {t("centros.new")}
                </Button>
              )}
            </div>
            <DataTable
              columns={centerColumns}
              data={centersPage.pageRows}
              loading={loadingCenters}
              pageCount={centersPage.pageCount}
              pagination={centersPage.pagination}
              onPaginationChange={centersPage.setPagination}
              rowCount={centers.length}
              emptyMessage={t("centros.empty")}
              hideToolbar
              renderRowActions={canEdit ? (c) => (
                <>
                  <Button size="icon" variant="ghost" onClick={() => { setCenterEdit(c); setCenterOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => setDeleteTarget({ kind: "centro", id: c.id })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </>
              ) : undefined}
            />
          </AdminCard>
        </TabsContent>

        {/* ============ REPRODUTORES ============ */}
        <TabsContent value="reprodutores">
          <AdminCard title={t("reprodutores.title")}>
            <div className="flex justify-end mb-3">
              {canEdit && (
                <Button onClick={() => { setBreederEdit(null); setBreederOpen(true); }} size="sm" disabled={centers.length === 0}>
                  <Plus className="h-4 w-4 mr-1" /> {t("reprodutores.new")}
                </Button>
              )}
            </div>
            <DataTable
              columns={breederColumns}
              data={breedersPage.pageRows}
              loading={loadingBreeders}
              pageCount={breedersPage.pageCount}
              pagination={breedersPage.pagination}
              onPaginationChange={breedersPage.setPagination}
              rowCount={breeders.length}
              emptyMessage={t("reprodutores.empty")}
              hideToolbar
              renderRowActions={canEdit ? (b) => (
                <>
                  <Button size="icon" variant="ghost" onClick={() => { setBreederEdit(b); setBreederOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => setDeleteTarget({ kind: "reprodutor", id: b.id })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </>
              ) : undefined}
            />
          </AdminCard>
        </TabsContent>

        {/* ============ TANQUES ============ */}
        <TabsContent value="tanques">
          <AdminCard title={t("tanques.title")}>
            <div className="flex justify-end mb-3">
              {canEdit && (
                <Button onClick={() => { setTankEdit(null); setTankOpen(true); }} size="sm" disabled={centers.length === 0}>
                  <Plus className="h-4 w-4 mr-1" /> {t("tanques.new")}
                </Button>
              )}
            </div>
            <DataTable
              columns={tankColumns}
              data={tanksPage.pageRows}
              loading={loadingTanks}
              pageCount={tanksPage.pageCount}
              pagination={tanksPage.pagination}
              onPaginationChange={tanksPage.setPagination}
              rowCount={tanks.length}
              emptyMessage={t("tanques.empty")}
              hideToolbar
              renderRowActions={canEdit ? (tk) => (
                <>
                  <Button size="icon" variant="ghost" onClick={() => { setTankEdit(tk); setTankOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => setDeleteTarget({ kind: "tanque", id: tk.id })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </>
              ) : undefined}
            />
          </AdminCard>
        </TabsContent>

        {/* ============ DOSES ============ */}
        <TabsContent value="doses">
          <AdminCard title={t("doses.title")}>
            <div className="flex justify-end mb-3">
              {canEdit && (
                <Button onClick={() => { setDoseEdit(null); setDoseOpen(true); }} size="sm" disabled={breeders.length === 0}>
                  <Plus className="h-4 w-4 mr-1" /> {t("doses.new")}
                </Button>
              )}
            </div>
            <DataTable
              columns={doseColumns}
              data={dosesPage.pageRows}
              loading={loadingDoses}
              pageCount={dosesPage.pageCount}
              pagination={dosesPage.pagination}
              onPaginationChange={dosesPage.setPagination}
              rowCount={doses.length}
              emptyMessage={t("doses.empty")}
              hideToolbar
              renderRowActions={canEdit ? (d) => (
                <>
                  <Button size="icon" variant="ghost" onClick={() => { setDoseEdit(d); setDoseOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => setDeleteTarget({ kind: "dose", id: d.id })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </>
              ) : undefined}
            />
          </AdminCard>
        </TabsContent>

        {/* ============ INSEMINAÇÕES ============ */}
        <TabsContent value="inseminacoes">
          <AdminCard title={t("inseminacoes.title")}>
            <div className="flex justify-end mb-3">
              {canEdit && (
                <Button onClick={() => { setInsemEdit(null); setInsemOpen(true); }} size="sm" disabled={animals.length === 0}>
                  <Plus className="h-4 w-4 mr-1" /> {t("inseminacoes.new")}
                </Button>
              )}
            </div>
            <DataTable
              columns={insemColumns}
              data={insemsPage.pageRows}
              loading={loadingInsems}
              pageCount={insemsPage.pageCount}
              pagination={insemsPage.pagination}
              onPaginationChange={insemsPage.setPagination}
              rowCount={insems.length}
              emptyMessage={t("inseminacoes.empty")}
              hideToolbar
              renderRowActions={canEdit ? (i) => (
                <>
                  <Button size="icon" variant="ghost" onClick={() => { setInsemEdit(i); setInsemOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => setDeleteTarget({ kind: "registo", id: i.id })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </>
              ) : undefined}
            />
          </AdminCard>
        </TabsContent>
      </Tabs>

      {/* ============ DIALOGS ============ */}
      <CenterDialog open={centerOpen} onOpenChange={(o) => { setCenterOpen(o); if (!o) setCenterEdit(null); }} initial={centerEdit} onSave={saveCenter} />
      <BreederDialog open={breederOpen} onOpenChange={(o) => { setBreederOpen(o); if (!o) setBreederEdit(null); }} initial={breederEdit} centers={centers} onSave={saveBreeder} />
      <TankDialog open={tankOpen} onOpenChange={(o) => { setTankOpen(o); if (!o) setTankEdit(null); }} initial={tankEdit} centers={centers} onSave={saveTank} />
      <DoseDialog open={doseOpen} onOpenChange={(o) => { setDoseOpen(o); if (!o) setDoseEdit(null); }} initial={doseEdit} breeders={breeders} tanks={tanks} onSave={saveDose} />
      <InsemDialog open={insemOpen} onOpenChange={(o) => { setInsemOpen(o); if (!o) setInsemEdit(null); }} initial={insemEdit} animals={animals} doses={doses} breeders={breeders} onSave={saveInsem} />

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title={t("delete.title")}
        description={t("delete.description")}
      />
    </div>
  );
}

/* ===== Sub-components (dialog forms) ===== */

function CenterDialog({ open, onOpenChange, initial, onSave }: { open: boolean; onOpenChange: (o: boolean) => void; initial: IACenterDto | null; onSave: (f: Partial<IACenterDto>) => void }) {
  const { t } = useTranslation("inseminacao");
  const [form, setForm] = useState<Partial<IACenterDto>>({});
  useEffect(() => { setForm(initial ?? { isActive: true }); }, [initial, open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{initial ? t("centros.dialog.editTitle") : t("centros.dialog.createTitle")}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>{t("centros.form.name")} {t("common.required")}</Label><Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>{t("centros.form.location")}</Label><Input value={form.location ?? ""} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
          <div><Label>{t("centros.form.notes")}</Label><Textarea value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
          <Button onClick={() => onSave(form)} disabled={!form.name}>{t("common.save")}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function BreederDialog({ open, onOpenChange, initial, centers, onSave }: { open: boolean; onOpenChange: (o: boolean) => void; initial: BreederDto | null; centers: IACenterDto[]; onSave: (f: Partial<BreederDto>) => void }) {
  const { t } = useTranslation("inseminacao");
  const [form, setForm] = useState<Partial<BreederDto>>({});
  useEffect(() => { setForm(initial ?? { status: "activo" }); }, [initial, open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{initial ? t("reprodutores.dialog.editTitle") : t("reprodutores.dialog.createTitle")}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>{t("reprodutores.form.tag")} {t("common.required")}</Label><Input value={form.tag ?? ""} onChange={(e) => setForm({ ...form, tag: e.target.value })} /></div>
          <div><Label>{t("reprodutores.form.name")}</Label><Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>{t("reprodutores.form.species")} {t("common.required")}</Label><Input value={form.species ?? ""} onChange={(e) => setForm({ ...form, species: e.target.value })} /></div>
          <div><Label>{t("reprodutores.form.breed")}</Label><Input value={form.breed ?? ""} onChange={(e) => setForm({ ...form, breed: e.target.value })} /></div>
          <div className="col-span-2">
            <Label>{t("reprodutores.form.center")} {t("common.required")}</Label>
            <Select value={form.centerId} onValueChange={(v) => setForm({ ...form, centerId: v })}>
              <SelectTrigger><SelectValue placeholder={t("reprodutores.form.selectCenter")} /></SelectTrigger>
              <SelectContent>{centers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>{t("reprodutores.form.birthDate")}</Label><Input type="date" value={form.birthDate ?? ""} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} /></div>
          <div>
            <Label>{t("reprodutores.form.status")}</Label>
            <Select value={form.status ?? "activo"} onValueChange={(v) => setForm({ ...form, status: v as BreederStatus })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="activo">{t("breederStatus.activo")}</SelectItem>
                <SelectItem value="inactivo">{t("breederStatus.inactivo")}</SelectItem>
                <SelectItem value="baixado">{t("breederStatus.baixado")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2"><Label>{t("reprodutores.form.notes")}</Label><Textarea value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
          <Button onClick={() => onSave(form)}>{t("common.save")}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TankDialog({ open, onOpenChange, initial, centers, onSave }: { open: boolean; onOpenChange: (o: boolean) => void; initial: TankDto | null; centers: IACenterDto[]; onSave: (f: Partial<TankDto>) => void }) {
  const { t } = useTranslation("inseminacao");
  const [form, setForm] = useState<Partial<TankDto>>({});
  useEffect(() => { setForm(initial ?? {}); }, [initial, open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{initial ? t("tanques.dialog.editTitle") : t("tanques.dialog.createTitle")}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>{t("tanques.form.code")} {t("common.required")}</Label><Input value={form.code ?? ""} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
          <div>
            <Label>{t("tanques.form.center")} {t("common.required")}</Label>
            <Select value={form.centerId} onValueChange={(v) => setForm({ ...form, centerId: v })}>
              <SelectTrigger><SelectValue placeholder={t("tanques.form.selectCenter")} /></SelectTrigger>
              <SelectContent>{centers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>{t("tanques.form.capacity")}</Label><Input type="number" step="0.1" value={form.capacityL ?? ""} onChange={(e) => setForm({ ...form, capacityL: Number(e.target.value) })} /></div>
          <div><Label>{t("tanques.form.current")}</Label><Input type="number" step="0.1" value={form.currentLevelL ?? ""} onChange={(e) => setForm({ ...form, currentLevelL: Number(e.target.value) })} /></div>
          <div><Label>{t("tanques.form.min")}</Label><Input type="number" step="0.1" value={form.minLevelL ?? ""} onChange={(e) => setForm({ ...form, minLevelL: Number(e.target.value) })} /></div>
          <div><Label>{t("tanques.form.lastRefill")}</Label><Input type="date" value={form.lastRefillDate ?? ""} onChange={(e) => setForm({ ...form, lastRefillDate: e.target.value })} /></div>
          <div className="col-span-2"><Label>{t("tanques.form.notes")}</Label><Textarea value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
          <Button onClick={() => onSave(form)}>{t("common.save")}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DoseDialog({ open, onOpenChange, initial, breeders, tanks, onSave }: { open: boolean; onOpenChange: (o: boolean) => void; initial: DoseDto | null; breeders: BreederDto[]; tanks: TankDto[]; onSave: (f: Partial<DoseDto>) => void }) {
  const { t } = useTranslation("inseminacao");
  const [form, setForm] = useState<Partial<DoseDto>>({});
  useEffect(() => { setForm(initial ?? { qualityGrade: "A" }); }, [initial, open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{initial ? t("doses.dialog.editTitle") : t("doses.dialog.createTitle")}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label>{t("doses.form.breeder")} {t("common.required")}</Label>
            <Select value={form.breederId} onValueChange={(v) => setForm({ ...form, breederId: v })}>
              <SelectTrigger><SelectValue placeholder={t("doses.form.selectBreeder")} /></SelectTrigger>
              <SelectContent>{breeders.map((b) => <SelectItem key={b.id} value={b.id}>{b.tag} — {b.species}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label>{t("doses.form.tank")}</Label>
            <Select value={form.tankId ?? "none"} onValueChange={(v) => setForm({ ...form, tankId: v === "none" ? null : v })}>
              <SelectTrigger><SelectValue placeholder={t("doses.form.noTank")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("doses.form.noTank")}</SelectItem>
                {tanks.map((tk) => <SelectItem key={tk.id} value={tk.id}>{tk.code}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>{t("doses.form.collectionDate")}</Label><Input type="date" value={form.collectionDate ?? ""} onChange={(e) => setForm({ ...form, collectionDate: e.target.value })} /></div>
          <div>
            <Label>{t("doses.form.quality")}</Label>
            <Select value={form.qualityGrade ?? "A"} onValueChange={(v) => setForm({ ...form, qualityGrade: v as SemenQuality })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="A">A</SelectItem><SelectItem value="B">B</SelectItem><SelectItem value="C">C</SelectItem></SelectContent>
            </Select>
          </div>
          <div><Label>{t("doses.form.quantity")}</Label><Input type="number" value={form.quantity ?? 0} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value), availableQuantity: form.availableQuantity ?? Number(e.target.value) })} /></div>
          <div><Label>{t("doses.form.available")}</Label><Input type="number" value={form.availableQuantity ?? 0} onChange={(e) => setForm({ ...form, availableQuantity: Number(e.target.value) })} /></div>
          <div className="col-span-2"><Label>{t("doses.form.notes")}</Label><Textarea value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
          <Button onClick={() => onSave(form)}>{t("common.save")}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InsemDialog({ open, onOpenChange, initial, animals, doses, breeders, onSave }: { open: boolean; onOpenChange: (o: boolean) => void; initial: InsemDto | null; animals: { id: string; tag: string; species: string }[]; doses: DoseDto[]; breeders: BreederDto[]; onSave: (f: Partial<InsemDto>) => void }) {
  const { t } = useTranslation("inseminacao");
  const [form, setForm] = useState<Partial<InsemDto>>({});
  useEffect(() => { setForm(initial ?? { result: "pendente" }); }, [initial, open]);
  const breederTag = (id: string) => breeders.find((b) => b.id === id)?.tag ?? "";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{initial ? t("inseminacoes.dialog.editTitle") : t("inseminacoes.dialog.createTitle")}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label>{t("inseminacoes.form.animal")} {t("common.required")}</Label>
            <Select value={form.animalId} onValueChange={(v) => setForm({ ...form, animalId: v })}>
              <SelectTrigger><SelectValue placeholder={t("inseminacoes.form.selectAnimal")} /></SelectTrigger>
              <SelectContent>{animals.map((a) => <SelectItem key={a.id} value={a.id}>{a.tag} — {a.species}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label>{t("inseminacoes.form.dose")}</Label>
            <Select value={form.doseId ?? "none"} onValueChange={(v) => setForm({ ...form, doseId: v === "none" ? null : v })}>
              <SelectTrigger><SelectValue placeholder={t("inseminacoes.form.noDose")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("inseminacoes.form.noDose")}</SelectItem>
                {doses.filter((d) => d.availableQuantity > 0).map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {t("inseminacoes.form.doseOption", { date: d.collectionDate, breeder: breederTag(d.breederId), available: d.availableQuantity })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div><Label>{t("inseminacoes.form.date")}</Label><Input type="date" value={form.inseminationDate ?? ""} onChange={(e) => setForm({ ...form, inseminationDate: e.target.value })} /></div>
          <div>
            <Label>{t("inseminacoes.form.result")}</Label>
            <Select value={form.result ?? "pendente"} onValueChange={(v) => setForm({ ...form, result: v as InseminationResult })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pendente">{t("result.pendente")}</SelectItem>
                <SelectItem value="confirmada">{t("result.confirmada")}</SelectItem>
                <SelectItem value="falhou">{t("result.falhou")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>{t("inseminacoes.form.pregnancyConfirmed")}</Label><Input type="date" value={form.pregnancyConfirmedAt ?? ""} onChange={(e) => setForm({ ...form, pregnancyConfirmedAt: e.target.value })} /></div>
          <div><Label>{t("inseminacoes.form.expectedBirth")}</Label><Input type="date" value={form.expectedBirthDate ?? ""} onChange={(e) => setForm({ ...form, expectedBirthDate: e.target.value })} /></div>
          <div className="col-span-2"><Label>{t("inseminacoes.form.notes")}</Label><Textarea value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
          <Button onClick={() => onSave(form)}>{t("common.save")}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
