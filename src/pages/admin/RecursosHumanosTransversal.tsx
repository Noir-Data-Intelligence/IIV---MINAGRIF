import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "framer-motion";
import { z } from "zod";
import type { TFunction } from "i18next";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import {
  Users, UserCheck, FileWarning, CalendarOff, FileText, Plus, Eye, Pencil, Trash2,
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
import { formatDate, formatKwanza } from "@/lib/format";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import { useDepartamentosList } from "@/hooks/queries/useDepartamentos";
import {
  useEmployeesTransversalList, useCreateEmployeeTransversal, useUpdateEmployeeTransversal, useDeleteEmployeeTransversal,
  useContractsTransversalList, useCreateContractTransversal, useUpdateContractTransversal, useDeleteContractTransversal,
  useLeavesTransversalList, useCreateLeaveTransversal, useUpdateLeaveTransversal, useDeleteLeaveTransversal,
} from "@/hooks/queries/useRecursosHumanosTransversal";
import type {
  ContractDto, ContractType, EmployeeDto, LeaveDto, LeaveStatus, LeaveType,
} from "@/types/dto/recursosHumanos";
import i18n from "@/i18n";
import ptRecursosHumanosTransversal from "@/i18n/locales/pt/admin/recursosHumanosTransversal.json";
import enRecursosHumanosTransversal from "@/i18n/locales/en/admin/recursosHumanosTransversal.json";

// Namespace autónomo registado em runtime, seguindo o padrão de Financeiro.tsx.
if (!i18n.hasResourceBundle("pt", "recursosHumanosTransversal"))
  i18n.addResourceBundle("pt", "recursosHumanosTransversal", ptRecursosHumanosTransversal, true, true);
if (!i18n.hasResourceBundle("en", "recursosHumanosTransversal"))
  i18n.addResourceBundle("en", "recursosHumanosTransversal", enRecursosHumanosTransversal, true, true);

const CONTRACT_TYPES: ContractType[] = [
  "efectivo", "termo_certo", "termo_incerto", "prestacao_servicos", "estagio",
];
const LEAVE_TYPES: LeaveType[] = [
  "ferias", "doenca", "maternidade", "paternidade", "luto", "sem_vencimento", "outro",
];
const LEAVE_STATUSES: LeaveStatus[] = ["pendente", "aprovada", "rejeitada", "concluida"];

const leaveStatusVariant: Record<LeaveStatus, "default" | "secondary" | "destructive" | "outline"> = {
  aprovada: "default",
  pendente: "secondary",
  rejeitada: "destructive",
  concluida: "outline",
};

const NONE = "none";
const BIG_PAGE = { page: 1, perPage: 1000 } as const;

// --- Schemas (mensagens i18n reconstruídas via useMemo dependente de t) ------

function buildEmployeeSchema(t: TFunction) {
  return z.object({
    employeeNumber: z.string().trim().min(1, t("employees.validation.number")),
    fullName: z.string().trim().min(2, t("employees.validation.name")),
    position: z.string().trim().optional(),
    nationalId: z.string().trim().optional(),
    phone: z.string().trim().optional(),
    email: z.string().trim().optional(),
    departmentId: z.string().optional(),
    hireDate: z.string().optional(),
    isActive: z.enum(["true", "false"]),
    qualifications: z.string().trim().optional(),
    notes: z.string().trim().optional(),
  });
}
type EmployeeFormValues = z.infer<ReturnType<typeof buildEmployeeSchema>>;

function buildContractSchema(t: TFunction) {
  return z.object({
    employeeId: z.string().min(1, t("contracts.validation.employee")),
    contractType: z.enum(["efectivo", "termo_certo", "termo_incerto", "prestacao_servicos", "estagio"]),
    position: z.string().trim().min(2, t("contracts.validation.position")),
    startDate: z.string().min(1, t("contracts.validation.startDate")),
    endDate: z.string().optional(),
    salary: z
      .string()
      .trim()
      .refine((v) => Number.isFinite(Number(v)) && Number(v) >= 0, t("contracts.validation.salary")),
    currency: z.string().trim().min(1),
    isActive: z.enum(["true", "false"]),
    notes: z.string().trim().optional(),
  });
}
type ContractFormValues = z.infer<ReturnType<typeof buildContractSchema>>;

function buildLeaveSchema(t: TFunction) {
  return z.object({
    employeeId: z.string().min(1, t("leaves.validation.employee")),
    leaveType: z.enum(["ferias", "doenca", "maternidade", "paternidade", "luto", "sem_vencimento", "outro"]),
    startDate: z.string().min(1, t("leaves.validation.startDate")),
    endDate: z.string().min(1, t("leaves.validation.endDate")),
    status: z.enum(["pendente", "aprovada", "rejeitada", "concluida"]),
    reason: z.string().trim().min(1, t("leaves.validation.reason")),
  });
}
type LeaveFormValues = z.infer<ReturnType<typeof buildLeaveSchema>>;

export default function RecursosHumanosTransversal() {
  const { t } = useTranslation("recursosHumanosTransversal");
  const { canWrite } = useUserRole();
  const canEdit = canWrite("rh");
  const prefersReduced = useReducedMotion();

  // --- Pagination / search por separador ---
  const [empPage, setEmpPage] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [empSearch, setEmpSearch] = useState("");
  const [conPage, setConPage] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [conSearch, setConSearch] = useState("");
  const [conTypeFilter, setConTypeFilter] = useState<string>("todos");
  const [leavePage, setLeavePage] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [leaveSearch, setLeaveSearch] = useState("");
  const [leaveStatusFilter, setLeaveStatusFilter] = useState<string>("todos");

  // --- Dialog state por entidade ---
  const [empForm, setEmpForm] = useState(false);
  const [empEdit, setEmpEdit] = useState<EmployeeDto | null>(null);
  const [empView, setEmpView] = useState<EmployeeDto | null>(null);
  const [conForm, setConForm] = useState(false);
  const [conEdit, setConEdit] = useState<ContractDto | null>(null);
  const [conView, setConView] = useState<ContractDto | null>(null);
  const [leaveForm, setLeaveForm] = useState(false);
  const [leaveEdit, setLeaveEdit] = useState<LeaveDto | null>(null);
  const [leaveView, setLeaveView] = useState<LeaveDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ kind: "employee" | "contract" | "leave"; id: string } | null>(null);

  // --- Queries: tabela paginada + dataset completo p/ lookups e KPIs ---
  const employeesQuery = useEmployeesTransversalList({
    page: empPage.pageIndex + 1, perPage: empPage.pageSize, search: empSearch || undefined,
  });
  const employeesAll = useEmployeesTransversalList(BIG_PAGE);

  const contractsQuery = useContractsTransversalList({
    page: conPage.pageIndex + 1,
    perPage: conPage.pageSize,
    search: conSearch || undefined,
    contractType: conTypeFilter !== "todos" ? (conTypeFilter as ContractType) : undefined,
  });
  const contractsAll = useContractsTransversalList(BIG_PAGE);

  const leavesQuery = useLeavesTransversalList({
    page: leavePage.pageIndex + 1,
    perPage: leavePage.pageSize,
    search: leaveSearch || undefined,
    status: leaveStatusFilter !== "todos" ? (leaveStatusFilter as LeaveStatus) : undefined,
  });
  const leavesAll = useLeavesTransversalList(BIG_PAGE);

  const departamentosQuery = useDepartamentosList(BIG_PAGE);

  const createEmployee = useCreateEmployeeTransversal();
  const updateEmployee = useUpdateEmployeeTransversal();
  const deleteEmployee = useDeleteEmployeeTransversal();
  const createContract = useCreateContractTransversal();
  const updateContract = useUpdateContractTransversal();
  const deleteContract = useDeleteContractTransversal();
  const createLeave = useCreateLeaveTransversal();
  const updateLeave = useUpdateLeaveTransversal();
  const deleteLeave = useDeleteLeaveTransversal();

  // --- Lookups ---
  const employees = useMemo(() => employeesAll.data?.data ?? [], [employeesAll.data]);
  const departamentos = useMemo(() => departamentosQuery.data?.data ?? [], [departamentosQuery.data]);
  const employeeMap = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees]);
  const deptMap = useMemo(() => new Map(departamentos.map((d) => [d.id, d])), [departamentos]);
  const employeeName = (id: string) => employeeMap.get(id)?.fullName ?? t("common.emptyCell");
  const deptName = (id: string | null) => (id ? deptMap.get(id)?.name ?? t("common.emptyCell") : t("common.emptyCell"));

  // --- KPIs (dataset completo) ---
  const allContracts = useMemo(() => contractsAll.data?.data ?? [], [contractsAll.data]);
  const allLeaves = useMemo(() => leavesAll.data?.data ?? [], [leavesAll.data]);

  const kpis = useMemo(() => {
    const total = employees.length;
    const active = employees.filter((e) => e.isActive).length;

    const now = new Date();
    const soon = new Date();
    soon.setDate(soon.getDate() + 60);
    const expiring = allContracts.filter((c) => {
      if (!c.isActive || !c.endDate) return false;
      const end = new Date(c.endDate);
      return end >= now && end <= soon;
    }).length;

    const today = new Date().toISOString().slice(0, 10);
    const onLeave = allLeaves.filter(
      (l) => l.status === "aprovada" && l.startDate <= today && l.endDate >= today,
    ).length;

    return { total, active, expiring, onLeave };
  }, [employees, allContracts, allLeaves]);

  // --- Forms: Colaborador ---
  const employeeSchema = useMemo(() => buildEmployeeSchema(t), [t]);
  const employeeInitial = useMemo<Partial<EmployeeFormValues> | undefined>(
    () =>
      empEdit
        ? {
            employeeNumber: empEdit.employeeNumber,
            fullName: empEdit.fullName,
            position: empEdit.position ?? "",
            nationalId: empEdit.nationalId ?? "",
            phone: empEdit.phone ?? "",
            email: empEdit.email ?? "",
            departmentId: empEdit.departmentId ?? "",
            hireDate: empEdit.hireDate ?? "",
            isActive: empEdit.isActive ? "true" : "false",
            qualifications: empEdit.qualifications ?? "",
            notes: empEdit.notes ?? "",
          }
        : undefined,
    [empEdit],
  );
  const employeeForm = useEntityForm({
    schema: employeeSchema,
    initialValues: employeeInitial,
    defaultValues: {
      employeeNumber: "", fullName: "", position: "", nationalId: "", phone: "", email: "",
      departmentId: "", hireDate: "", isActive: "true", qualifications: "", notes: "",
    },
    open: empForm,
    onSubmit: async (values) => {
      const payload = {
        employeeNumber: values.employeeNumber,
        fullName: values.fullName,
        position: values.position?.trim() ? values.position.trim() : null,
        nationalId: values.nationalId?.trim() ? values.nationalId.trim() : null,
        phone: values.phone?.trim() ? values.phone.trim() : null,
        email: values.email?.trim() ? values.email.trim() : null,
        departmentId: values.departmentId && values.departmentId !== NONE ? values.departmentId : null,
        hireDate: values.hireDate?.trim() ? values.hireDate.trim() : null,
        isActive: values.isActive === "true",
        qualifications: values.qualifications?.trim() ? values.qualifications.trim() : null,
        notes: values.notes?.trim() ? values.notes.trim() : null,
      };
      if (empEdit) await updateEmployee.mutateAsync({ id: empEdit.id, payload });
      else await createEmployee.mutateAsync(payload);
    },
    successMessage: empEdit ? t("employees.toast.updateSuccess") : t("employees.toast.createSuccess"),
    errorMessage: t("toast.error"),
    onSuccess: () => setEmpForm(false),
  });

  // --- Forms: Contrato ---
  const contractSchema = useMemo(() => buildContractSchema(t), [t]);
  const contractInitial = useMemo<Partial<ContractFormValues> | undefined>(
    () =>
      conEdit
        ? {
            employeeId: conEdit.employeeId,
            contractType: conEdit.contractType,
            position: conEdit.position,
            startDate: conEdit.startDate,
            endDate: conEdit.endDate ?? "",
            salary: String(conEdit.salary),
            currency: conEdit.currency,
            isActive: conEdit.isActive ? "true" : "false",
            notes: conEdit.notes ?? "",
          }
        : undefined,
    [conEdit],
  );
  const contractForm = useEntityForm({
    schema: contractSchema,
    initialValues: contractInitial,
    defaultValues: {
      employeeId: "", contractType: "efectivo", position: "",
      startDate: new Date().toISOString().slice(0, 10), endDate: "",
      salary: "", currency: "AOA", isActive: "true", notes: "",
    },
    open: conForm,
    onSubmit: async (values) => {
      const payload = {
        employeeId: values.employeeId,
        contractType: values.contractType,
        position: values.position,
        startDate: values.startDate,
        endDate: values.endDate?.trim() ? values.endDate.trim() : null,
        salary: Number(values.salary),
        currency: values.currency,
        isActive: values.isActive === "true",
        notes: values.notes?.trim() ? values.notes.trim() : null,
      };
      if (conEdit) await updateContract.mutateAsync({ id: conEdit.id, payload });
      else await createContract.mutateAsync(payload);
    },
    successMessage: conEdit ? t("contracts.toast.updateSuccess") : t("contracts.toast.createSuccess"),
    errorMessage: t("toast.error"),
    onSuccess: () => setConForm(false),
  });

  // --- Forms: Ausência ---
  const leaveSchema = useMemo(() => buildLeaveSchema(t), [t]);
  const leaveInitial = useMemo<Partial<LeaveFormValues> | undefined>(
    () =>
      leaveEdit
        ? {
            employeeId: leaveEdit.employeeId,
            leaveType: leaveEdit.leaveType,
            startDate: leaveEdit.startDate,
            endDate: leaveEdit.endDate,
            status: leaveEdit.status,
            reason: leaveEdit.reason ?? "",
          }
        : undefined,
    [leaveEdit],
  );
  const leaveEntityForm = useEntityForm({
    schema: leaveSchema,
    initialValues: leaveInitial,
    defaultValues: {
      employeeId: "", leaveType: "ferias",
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date().toISOString().slice(0, 10),
      status: "pendente", reason: "",
    },
    open: leaveForm,
    onSubmit: async (values) => {
      const payload = {
        employeeId: values.employeeId,
        leaveType: values.leaveType,
        startDate: values.startDate,
        endDate: values.endDate,
        status: values.status,
        reason: values.reason?.trim() ? values.reason.trim() : null,
      };
      if (leaveEdit) await updateLeave.mutateAsync({ id: leaveEdit.id, payload });
      else await createLeave.mutateAsync(payload);
    },
    successMessage: leaveEdit ? t("leaves.toast.updateSuccess") : t("leaves.toast.createSuccess"),
    errorMessage: t("toast.error"),
    onSuccess: () => setLeaveForm(false),
  });

  // --- Open helpers ---
  const openEmpCreate = () => { setEmpEdit(null); setEmpForm(true); };
  const openEmpEdit = (e: EmployeeDto) => { setEmpEdit(e); setEmpForm(true); };
  const openConCreate = () => { setConEdit(null); setConForm(true); };
  const openConEdit = (c: ContractDto) => { setConEdit(c); setConForm(true); };
  const openLeaveCreate = () => { setLeaveEdit(null); setLeaveForm(true); };
  const openLeaveEdit = (l: LeaveDto) => { setLeaveEdit(l); setLeaveForm(true); };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.kind === "employee") await deleteEmployee.mutateAsync(deleteTarget.id);
    else if (deleteTarget.kind === "contract") await deleteContract.mutateAsync(deleteTarget.id);
    else await deleteLeave.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  // --- Columns: Colaboradores ---
  const employeeColumns = useMemo<ColumnDef<EmployeeDto>[]>(
    () => [
      {
        accessorKey: "employeeNumber",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("employees.table.number")} />,
        cell: ({ row }) => <span className="font-mono text-xs">{row.original.employeeNumber}</span>,
      },
      {
        accessorKey: "fullName",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("employees.table.name")} />,
        cell: ({ row }) => <span className="font-medium">{row.original.fullName}</span>,
      },
      {
        accessorKey: "position",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("employees.table.position")} />,
        cell: ({ row }) => <span className="text-sm">{row.original.position ?? t("common.emptyCell")}</span>,
      },
      {
        id: "department",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("employees.table.department")} />,
        cell: ({ row }) => <span className="text-sm">{deptName(row.original.departmentId)}</span>,
      },
      {
        accessorKey: "phone",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("employees.table.phone")} />,
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.phone ?? t("common.emptyCell")}</span>,
      },
      {
        accessorKey: "hireDate",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("employees.table.hireDate")} />,
        cell: ({ row }) => <span className="text-sm">{row.original.hireDate ? formatDate(row.original.hireDate) : t("common.emptyCell")}</span>,
      },
      {
        accessorKey: "isActive",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("employees.table.status")} />,
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? "default" : "outline"}>
            {row.original.isActive ? t("employees.active.yes") : t("employees.active.no")}
          </Badge>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, deptMap],
  );

  // --- Columns: Contratos ---
  const contractColumns = useMemo<ColumnDef<ContractDto>[]>(
    () => [
      {
        id: "employee",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("contracts.table.employee")} />,
        cell: ({ row }) => <span className="font-medium">{employeeName(row.original.employeeId)}</span>,
      },
      {
        accessorKey: "position",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("contracts.table.position")} />,
      },
      {
        accessorKey: "contractType",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("contracts.table.type")} />,
        cell: ({ row }) => <Badge variant="outline">{t(`contractType.${row.original.contractType}`)}</Badge>,
      },
      {
        accessorKey: "startDate",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("contracts.table.startDate")} />,
        cell: ({ row }) => <span className="text-sm">{formatDate(row.original.startDate)}</span>,
      },
      {
        accessorKey: "endDate",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("contracts.table.endDate")} />,
        cell: ({ row }) => <span className="text-sm">{row.original.endDate ? formatDate(row.original.endDate) : t("common.emptyCell")}</span>,
      },
      {
        accessorKey: "salary",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("contracts.table.salary")} />,
        cell: ({ row }) => <span className="text-sm font-medium">{formatKwanza(row.original.salary)}</span>,
      },
      {
        accessorKey: "isActive",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("contracts.table.status")} />,
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? "default" : "outline"}>
            {row.original.isActive ? t("contracts.active.yes") : t("contracts.active.no")}
          </Badge>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, employeeMap],
  );

  // --- Columns: Ausências ---
  const leaveColumns = useMemo<ColumnDef<LeaveDto>[]>(
    () => [
      {
        id: "employee",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("leaves.table.employee")} />,
        cell: ({ row }) => <span className="font-medium">{employeeName(row.original.employeeId)}</span>,
      },
      {
        accessorKey: "leaveType",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("leaves.table.type")} />,
        cell: ({ row }) => <Badge variant="outline">{t(`leaveType.${row.original.leaveType}`)}</Badge>,
      },
      {
        accessorKey: "startDate",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("leaves.table.startDate")} />,
        cell: ({ row }) => <span className="text-sm">{formatDate(row.original.startDate)}</span>,
      },
      {
        accessorKey: "endDate",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("leaves.table.endDate")} />,
        cell: ({ row }) => <span className="text-sm">{formatDate(row.original.endDate)}</span>,
      },
      {
        accessorKey: "days",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("leaves.table.days")} />,
        cell: ({ row }) => <span className="text-sm">{row.original.days}</span>,
      },
      {
        accessorKey: "status",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("leaves.table.status")} />,
        cell: ({ row }) => <Badge variant={leaveStatusVariant[row.original.status]}>{t(`leaveStatus.${row.original.status}`)}</Badge>,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, employeeMap],
  );

  // --- Row actions ---
  const employeeActions = (row: EmployeeDto) => {
    const actions: RowAction[] = [{ label: t("actions.view"), icon: Eye, onClick: () => setEmpView(row) }];
    if (canEdit) {
      actions.push({ label: t("actions.edit"), icon: Pencil, onClick: () => openEmpEdit(row) });
      actions.push({ label: t("actions.delete"), icon: Trash2, destructive: true, onClick: () => setDeleteTarget({ kind: "employee", id: row.id }) });
    }
    return <RowActions actions={actions} />;
  };
  const contractActions = (row: ContractDto) => {
    const actions: RowAction[] = [{ label: t("actions.view"), icon: Eye, onClick: () => setConView(row) }];
    if (canEdit) {
      actions.push({ label: t("actions.edit"), icon: Pencil, onClick: () => openConEdit(row) });
      actions.push({ label: t("actions.delete"), icon: Trash2, destructive: true, onClick: () => setDeleteTarget({ kind: "contract", id: row.id }) });
    }
    return <RowActions actions={actions} />;
  };
  const leaveActions = (row: LeaveDto) => {
    const actions: RowAction[] = [{ label: t("actions.view"), icon: Eye, onClick: () => setLeaveView(row) }];
    if (canEdit) {
      actions.push({ label: t("actions.edit"), icon: Pencil, onClick: () => openLeaveEdit(row) });
      actions.push({ label: t("actions.delete"), icon: Trash2, destructive: true, onClick: () => setDeleteTarget({ kind: "leave", id: row.id }) });
    }
    return <RowActions actions={actions} />;
  };

  const kpiCards = [
    { key: "total", icon: Users, label: t("kpis.total"), value: kpis.total, caption: t("kpis.totalCaption"), variant: "gradient-green-gold" as const },
    { key: "active", icon: UserCheck, label: t("kpis.active"), value: kpis.active, caption: t("kpis.activeCaption"), variant: "gradient-green" as const },
    { key: "expiring", icon: FileWarning, label: t("kpis.expiring"), value: kpis.expiring, caption: t("kpis.expiringCaption"), variant: "gradient-gold" as const },
    { key: "onLeave", icon: CalendarOff, label: t("kpis.onLeave"), value: kpis.onLeave, caption: t("kpis.onLeaveCaption"), variant: "gradient-teal" as const },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader icon={Users} title={t("page.title")} description={t("page.description")} />

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
      <Tabs defaultValue="employees" className="space-y-4">
        <TabsList>
          <TabsTrigger value="employees"><Users className="h-4 w-4 mr-1" /> {t("tabs.employees")}</TabsTrigger>
          <TabsTrigger value="contracts"><FileText className="h-4 w-4 mr-1" /> {t("tabs.contracts")}</TabsTrigger>
          <TabsTrigger value="leaves"><CalendarOff className="h-4 w-4 mr-1" /> {t("tabs.leaves")}</TabsTrigger>
        </TabsList>

        {/* --- Colaboradores --- */}
        <TabsContent value="employees" className="space-y-4">
          <div className="flex justify-end">
            <WriteGuard module="rh">
              <Button onClick={openEmpCreate}>
                <Plus className="mr-2 h-4 w-4" /> {t("employees.new")}
              </Button>
            </WriteGuard>
          </div>
          <DataTable
            columns={employeeColumns}
            data={employeesQuery.data?.data ?? []}
            loading={employeesQuery.isLoading}
            pageCount={employeesQuery.data?.meta.lastPage ?? 0}
            pagination={empPage}
            onPaginationChange={setEmpPage}
            rowCount={employeesQuery.data?.meta.total}
            globalFilter={empSearch}
            onGlobalFilterChange={setEmpSearch}
            searchPlaceholder={t("employees.table.searchPlaceholder")}
            emptyMessage={t("employees.table.empty")}
            renderRowActions={employeeActions}
          />
        </TabsContent>

        {/* --- Contratos --- */}
        <TabsContent value="contracts" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Select value={conTypeFilter} onValueChange={(v) => { setConTypeFilter(v); setConPage((p) => ({ ...p, pageIndex: 0 })); }}>
              <SelectTrigger className="sm:w-[220px]"><SelectValue placeholder={t("filters.typePlaceholder")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">{t("filters.allTypes")}</SelectItem>
                {CONTRACT_TYPES.map((ty) => <SelectItem key={ty} value={ty}>{t(`contractType.${ty}`)}</SelectItem>)}
              </SelectContent>
            </Select>
            <WriteGuard module="rh">
              <Button onClick={openConCreate} disabled={employees.length === 0}>
                <Plus className="mr-2 h-4 w-4" /> {t("contracts.new")}
              </Button>
            </WriteGuard>
          </div>
          <DataTable
            columns={contractColumns}
            data={contractsQuery.data?.data ?? []}
            loading={contractsQuery.isLoading}
            pageCount={contractsQuery.data?.meta.lastPage ?? 0}
            pagination={conPage}
            onPaginationChange={setConPage}
            rowCount={contractsQuery.data?.meta.total}
            globalFilter={conSearch}
            onGlobalFilterChange={setConSearch}
            searchPlaceholder={t("contracts.table.searchPlaceholder")}
            emptyMessage={t("contracts.table.empty")}
            renderRowActions={contractActions}
          />
        </TabsContent>

        {/* --- Ausências --- */}
        <TabsContent value="leaves" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Select value={leaveStatusFilter} onValueChange={(v) => { setLeaveStatusFilter(v); setLeavePage((p) => ({ ...p, pageIndex: 0 })); }}>
              <SelectTrigger className="sm:w-[220px]"><SelectValue placeholder={t("filters.statusPlaceholder")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">{t("filters.allStatus")}</SelectItem>
                {LEAVE_STATUSES.map((s) => <SelectItem key={s} value={s}>{t(`leaveStatus.${s}`)}</SelectItem>)}
              </SelectContent>
            </Select>
            <WriteGuard module="rh">
              <Button onClick={openLeaveCreate} disabled={employees.length === 0}>
                <Plus className="mr-2 h-4 w-4" /> {t("leaves.new")}
              </Button>
            </WriteGuard>
          </div>
          <DataTable
            columns={leaveColumns}
            data={leavesQuery.data?.data ?? []}
            loading={leavesQuery.isLoading}
            pageCount={leavesQuery.data?.meta.lastPage ?? 0}
            pagination={leavePage}
            onPaginationChange={setLeavePage}
            rowCount={leavesQuery.data?.meta.total}
            globalFilter={leaveSearch}
            onGlobalFilterChange={setLeaveSearch}
            searchPlaceholder={t("leaves.table.searchPlaceholder")}
            emptyMessage={t("leaves.table.empty")}
            renderRowActions={leaveActions}
          />
        </TabsContent>
      </Tabs>

      {/* ===================== Dialog: colaborador ===================== */}
      <EntityFormDialog
        open={empForm}
        onOpenChange={setEmpForm}
        title={empEdit ? t("employees.dialog.editTitle") : t("employees.dialog.createTitle")}
        form={employeeForm}
        submitLabel={empEdit ? t("form.submitEdit") : t("form.submitCreate")}
        submittingLabel={t("form.submitting")}
        cancelLabel={t("form.cancel")}
      >
        {(form) => (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="employeeNumber" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("employees.form.number")}</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="fullName" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("employees.form.name")}</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="position" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("employees.form.position")}</FormLabel>
                <FormControl><Input {...field} value={field.value ?? ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="nationalId" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("employees.form.nationalId")}</FormLabel>
                  <FormControl><Input {...field} value={field.value ?? ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("employees.form.phone")}</FormLabel>
                  <FormControl><Input {...field} value={field.value ?? ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("employees.form.email")}</FormLabel>
                <FormControl><Input type="email" {...field} value={field.value ?? ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="departmentId" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("employees.form.department")}</FormLabel>
                  <Select value={field.value || NONE} onValueChange={(v) => field.onChange(v === NONE ? "" : v)}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value={NONE}>{t("common.none")}</SelectItem>
                      {departamentos.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="hireDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("employees.form.hireDate")}</FormLabel>
                  <FormControl><Input type="date" {...field} value={field.value ?? ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="isActive" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("employees.form.status")}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="true">{t("employees.form.activeOption")}</SelectItem>
                    <SelectItem value="false">{t("employees.form.inactiveOption")}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="qualifications" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("employees.form.qualifications")}</FormLabel>
                <FormControl><Textarea {...field} value={field.value ?? ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("employees.form.notes")}</FormLabel>
                <FormControl><Textarea {...field} value={field.value ?? ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </>
        )}
      </EntityFormDialog>

      {/* ===================== Dialog: contrato ===================== */}
      <EntityFormDialog
        open={conForm}
        onOpenChange={setConForm}
        title={conEdit ? t("contracts.dialog.editTitle") : t("contracts.dialog.createTitle")}
        form={contractForm}
        submitLabel={conEdit ? t("form.submitEdit") : t("form.submitCreate")}
        submittingLabel={t("form.submitting")}
        cancelLabel={t("form.cancel")}
      >
        {(form) => (
          <>
            <FormField control={form.control} name="employeeId" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("contracts.form.employee")}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger><SelectValue placeholder={t("common.selectPlaceholder")} /></SelectTrigger></FormControl>
                  <SelectContent>
                    {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.fullName}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="position" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("contracts.form.position")}</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="contractType" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("contracts.form.type")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {CONTRACT_TYPES.map((ty) => <SelectItem key={ty} value={ty}>{t(`contractType.${ty}`)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="startDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("contracts.form.startDate")}</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="endDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("contracts.form.endDate")}</FormLabel>
                  <FormControl><Input type="date" {...field} value={field.value ?? ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField control={form.control} name="salary" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("contracts.form.salary")}</FormLabel>
                  <FormControl><Input type="number" min="0" step="0.01" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="currency" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("contracts.form.currency")}</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="isActive" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("contracts.form.status")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="true">{t("contracts.form.activeOption")}</SelectItem>
                      <SelectItem value="false">{t("contracts.form.inactiveOption")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("contracts.form.notes")}</FormLabel>
                <FormControl><Textarea {...field} value={field.value ?? ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </>
        )}
      </EntityFormDialog>

      {/* ===================== Dialog: ausência ===================== */}
      <EntityFormDialog
        open={leaveForm}
        onOpenChange={setLeaveForm}
        title={leaveEdit ? t("leaves.dialog.editTitle") : t("leaves.dialog.createTitle")}
        form={leaveEntityForm}
        submitLabel={leaveEdit ? t("form.submitEdit") : t("form.submitCreate")}
        submittingLabel={t("form.submitting")}
        cancelLabel={t("form.cancel")}
      >
        {(form) => (
          <>
            <FormField control={form.control} name="employeeId" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("leaves.form.employee")}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger><SelectValue placeholder={t("common.selectPlaceholder")} /></SelectTrigger></FormControl>
                  <SelectContent>
                    {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.fullName}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="leaveType" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("leaves.form.type")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {LEAVE_TYPES.map((ty) => <SelectItem key={ty} value={ty}>{t(`leaveType.${ty}`)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("leaves.form.status")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {LEAVE_STATUSES.map((s) => <SelectItem key={s} value={s}>{t(`leaveStatus.${s}`)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="startDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("leaves.form.startDate")}</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="endDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("leaves.form.endDate")}</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="reason" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("leaves.form.reason")} <span className="text-destructive">*</span></FormLabel>
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

      {/* ===================== Detalhes: colaborador ===================== */}
      <Dialog open={!!empView} onOpenChange={(o) => !o && setEmpView(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-serif">{t("employees.dialog.detailsTitle")}</DialogTitle></DialogHeader>
          {empView && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground">{t("employees.details.number")}:</span><p className="font-medium">{empView.employeeNumber}</p></div>
                <div><span className="text-muted-foreground">{t("employees.details.name")}:</span><p className="font-medium">{empView.fullName}</p></div>
                <div><span className="text-muted-foreground">{t("employees.details.position")}:</span><p className="font-medium">{empView.position ?? t("common.emptyCell")}</p></div>
                <div><span className="text-muted-foreground">{t("employees.details.department")}:</span><p className="font-medium">{deptName(empView.departmentId)}</p></div>
                <div><span className="text-muted-foreground">{t("employees.details.status")}:</span><p><Badge variant={empView.isActive ? "default" : "outline"}>{empView.isActive ? t("employees.active.yes") : t("employees.active.no")}</Badge></p></div>
                <div><span className="text-muted-foreground">{t("employees.details.nationalId")}:</span><p className="font-medium">{empView.nationalId ?? t("common.emptyCell")}</p></div>
                <div><span className="text-muted-foreground">{t("employees.details.phone")}:</span><p className="font-medium">{empView.phone ?? t("common.emptyCell")}</p></div>
                <div><span className="text-muted-foreground">{t("employees.details.email")}:</span><p className="font-medium">{empView.email ?? t("common.emptyCell")}</p></div>
                <div><span className="text-muted-foreground">{t("employees.details.hireDate")}:</span><p className="font-medium">{empView.hireDate ? formatDate(empView.hireDate) : t("common.emptyCell")}</p></div>
              </div>
              {empView.qualifications && (
                <div><span className="text-muted-foreground">{t("employees.details.qualifications")}:</span><p className="font-medium mt-1">{empView.qualifications}</p></div>
              )}
              {empView.notes && (
                <div><span className="text-muted-foreground">{t("employees.details.notes")}:</span><p className="font-medium mt-1">{empView.notes}</p></div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ===================== Detalhes: contrato ===================== */}
      <Dialog open={!!conView} onOpenChange={(o) => !o && setConView(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-serif">{t("contracts.dialog.detailsTitle")}</DialogTitle></DialogHeader>
          {conView && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground">{t("contracts.details.employee")}:</span><p className="font-medium">{employeeName(conView.employeeId)}</p></div>
                <div><span className="text-muted-foreground">{t("contracts.details.position")}:</span><p className="font-medium">{conView.position}</p></div>
                <div><span className="text-muted-foreground">{t("contracts.details.type")}:</span><p><Badge variant="outline">{t(`contractType.${conView.contractType}`)}</Badge></p></div>
                <div><span className="text-muted-foreground">{t("contracts.details.status")}:</span><p><Badge variant={conView.isActive ? "default" : "outline"}>{conView.isActive ? t("contracts.active.yes") : t("contracts.active.no")}</Badge></p></div>
                <div><span className="text-muted-foreground">{t("contracts.details.startDate")}:</span><p className="font-medium">{formatDate(conView.startDate)}</p></div>
                <div><span className="text-muted-foreground">{t("contracts.details.endDate")}:</span><p className="font-medium">{conView.endDate ? formatDate(conView.endDate) : t("common.emptyCell")}</p></div>
                <div><span className="text-muted-foreground">{t("contracts.details.salary")}:</span><p className="font-medium">{formatKwanza(conView.salary)}</p></div>
              </div>
              {conView.notes && (
                <div><span className="text-muted-foreground">{t("contracts.details.notes")}:</span><p className="font-medium mt-1">{conView.notes}</p></div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ===================== Detalhes: ausência ===================== */}
      <Dialog open={!!leaveView} onOpenChange={(o) => !o && setLeaveView(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-serif">{t("leaves.dialog.detailsTitle")}</DialogTitle></DialogHeader>
          {leaveView && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground">{t("leaves.details.employee")}:</span><p className="font-medium">{employeeName(leaveView.employeeId)}</p></div>
                <div><span className="text-muted-foreground">{t("leaves.details.type")}:</span><p><Badge variant="outline">{t(`leaveType.${leaveView.leaveType}`)}</Badge></p></div>
                <div><span className="text-muted-foreground">{t("leaves.details.status")}:</span><p><Badge variant={leaveStatusVariant[leaveView.status]}>{t(`leaveStatus.${leaveView.status}`)}</Badge></p></div>
                <div><span className="text-muted-foreground">{t("leaves.details.days")}:</span><p className="font-medium">{leaveView.days}</p></div>
                <div><span className="text-muted-foreground">{t("leaves.details.startDate")}:</span><p className="font-medium">{formatDate(leaveView.startDate)}</p></div>
                <div><span className="text-muted-foreground">{t("leaves.details.endDate")}:</span><p className="font-medium">{formatDate(leaveView.endDate)}</p></div>
              </div>
              {leaveView.reason && (
                <div><span className="text-muted-foreground">{t("leaves.details.reason")}:</span><p className="font-medium mt-1">{leaveView.reason}</p></div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
