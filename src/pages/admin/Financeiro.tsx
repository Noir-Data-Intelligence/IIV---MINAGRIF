import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "framer-motion";
import { z } from "zod";
import type { TFunction } from "i18next";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Wallet, TrendingUp, TrendingDown, Scale, Target, Receipt, FolderTree,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { axisTickStyle, buildChartConfig, chartColors, formatCompactNumber, NoDataOverlay } from "@/components/charts";
import { useEntityForm } from "@/hooks/useEntityForm";
import { useUserRole } from "@/hooks/useUserRole";
import { formatDate, formatKwanza } from "@/lib/format";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import { useDepartamentosList } from "@/hooks/queries/useDepartamentos";
import {
  useAccountsList, useCreateAccount, useUpdateAccount, useDeleteAccount,
  useTransactionsList, useCreateTransaction, useUpdateTransaction, useDeleteTransaction,
  useBudgetsList, useCreateBudget, useUpdateBudget, useDeleteBudget,
} from "@/hooks/queries/useFinanceiro";
import type {
  AccountDto, AccountType, BudgetDto, TransactionDto, TransactionStatus,
} from "@/types/dto/financeiro";
import i18n from "@/i18n";
import ptFinanceiro from "@/i18n/locales/pt/admin/financeiro.json";
import enFinanceiro from "@/i18n/locales/en/admin/financeiro.json";

// Namespace autónomo registado em runtime, seguindo o padrão de Planeamento.tsx.
if (!i18n.hasResourceBundle("pt", "financeiro"))
  i18n.addResourceBundle("pt", "financeiro", ptFinanceiro, true, true);
if (!i18n.hasResourceBundle("en", "financeiro"))
  i18n.addResourceBundle("en", "financeiro", enFinanceiro, true, true);

const ACCOUNT_TYPES: AccountType[] = ["receita", "despesa"];
const TX_STATUSES: TransactionStatus[] = ["pendente", "pago", "cancelado"];

const statusVariant: Record<TransactionStatus, "default" | "secondary" | "destructive" | "outline"> = {
  pago: "default",
  pendente: "secondary",
  cancelado: "destructive",
};

const NONE = "none";

// --- Schemas (mensagens i18n reconstruídas via useMemo dependente de t) ------

function buildAccountSchema(t: TFunction) {
  return z.object({
    code: z.string().trim().min(1, t("accounts.validation.code")),
    name: z.string().trim().min(2, t("accounts.validation.name")),
    type: z.enum(["receita", "despesa"]),
    description: z.string().trim().optional(),
    isActive: z.enum(["true", "false"]),
  });
}
type AccountFormValues = z.infer<ReturnType<typeof buildAccountSchema>>;

function buildTransactionSchema(t: TFunction) {
  return z.object({
    accountId: z.string().min(1, t("transactions.validation.account")),
    type: z.enum(["receita", "despesa"]),
    amount: z
      .string()
      .trim()
      .refine((v) => Number.isFinite(Number(v)) && Number(v) > 0, t("transactions.validation.amount")),
    currency: z.string().trim().min(1),
    transactionDate: z.string().min(1, t("transactions.validation.date")),
    departmentId: z.string().optional(),
    status: z.enum(["pendente", "pago", "cancelado"]),
    description: z.string().trim().min(2, t("transactions.validation.description")),
    reference: z.string().trim().optional(),
    notes: z.string().trim().optional(),
  });
}
type TransactionFormValues = z.infer<ReturnType<typeof buildTransactionSchema>>;

function buildBudgetSchema(t: TFunction) {
  return z.object({
    year: z.string().trim().refine((v) => /^\d{4}$/.test(v), t("budgets.validation.year")),
    accountId: z.string().min(1, t("budgets.validation.account")),
    departmentId: z.string().optional(),
    plannedAmount: z
      .string()
      .trim()
      .refine((v) => Number.isFinite(Number(v)) && Number(v) > 0, t("budgets.validation.planned")),
    notes: z.string().trim().optional(),
  });
}
type BudgetFormValues = z.infer<ReturnType<typeof buildBudgetSchema>>;

const BIG_PAGE = { page: 1, perPage: 1000 } as const;

export default function Financeiro() {
  const { t, i18n: i18nInstance } = useTranslation("financeiro");
  const { canWrite } = useUserRole();
  const canEdit = canWrite("financeiro");
  const prefersReduced = useReducedMotion();
  const locale = i18nInstance.language === "en" ? "en-GB" : "pt-AO";
  const currentYear = new Date().getFullYear();

  // --- Pagination / search por separador ---
  const [accPage, setAccPage] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [accSearch, setAccSearch] = useState("");
  const [txPage, setTxPage] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [txSearch, setTxSearch] = useState("");
  const [txStatusFilter, setTxStatusFilter] = useState<string>("todos");
  const [txTypeFilter, setTxTypeFilter] = useState<string>("todos");
  const [budPage, setBudPage] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [budSearch, setBudSearch] = useState("");

  // --- Dialog state por entidade ---
  const [accForm, setAccForm] = useState(false);
  const [accEdit, setAccEdit] = useState<AccountDto | null>(null);
  const [accView, setAccView] = useState<AccountDto | null>(null);
  const [txForm, setTxForm] = useState(false);
  const [txEdit, setTxEdit] = useState<TransactionDto | null>(null);
  const [txView, setTxView] = useState<TransactionDto | null>(null);
  const [budForm, setBudForm] = useState(false);
  const [budEdit, setBudEdit] = useState<BudgetDto | null>(null);
  const [budView, setBudView] = useState<BudgetDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ kind: "account" | "transaction" | "budget"; id: string } | null>(null);

  // --- Queries: tabela paginada + dataset completo p/ lookups, KPIs e gráfico ---
  const accountsQuery = useAccountsList({
    page: accPage.pageIndex + 1, perPage: accPage.pageSize, search: accSearch || undefined,
  });
  const accountsAll = useAccountsList(BIG_PAGE);

  const transactionsQuery = useTransactionsList({
    page: txPage.pageIndex + 1,
    perPage: txPage.pageSize,
    search: txSearch || undefined,
    status: txStatusFilter !== "todos" ? (txStatusFilter as TransactionStatus) : undefined,
    type: txTypeFilter !== "todos" ? (txTypeFilter as AccountType) : undefined,
  });
  const transactionsAll = useTransactionsList(BIG_PAGE);

  const budgetsQuery = useBudgetsList({
    page: budPage.pageIndex + 1, perPage: budPage.pageSize, search: budSearch || undefined,
  });
  const budgetsAll = useBudgetsList(BIG_PAGE);

  const departamentosQuery = useDepartamentosList(BIG_PAGE);

  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const deleteAccount = useDeleteAccount();
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();
  const deleteTransaction = useDeleteTransaction();
  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();
  const deleteBudget = useDeleteBudget();

  // --- Lookups ---
  const accounts = useMemo(() => accountsAll.data?.data ?? [], [accountsAll.data]);
  const departamentos = useMemo(() => departamentosQuery.data?.data ?? [], [departamentosQuery.data]);
  const accountMap = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);
  const deptMap = useMemo(() => new Map(departamentos.map((d) => [d.id, d])), [departamentos]);
  const accountLabel = (id: string) => {
    const a = accountMap.get(id);
    return a ? `${a.code} — ${a.name}` : t("common.emptyCell");
  };
  const deptName = (id: string | null) => (id ? deptMap.get(id)?.name ?? t("common.emptyCell") : t("common.emptyCell"));

  // --- KPIs + execução orçamental (dataset completo, ano corrente) ---
  const allTx = useMemo(() => transactionsAll.data?.data ?? [], [transactionsAll.data]);
  const allBudgets = useMemo(() => budgetsAll.data?.data ?? [], [budgetsAll.data]);
  const paidTx = useMemo(() => allTx.filter((tx) => tx.status === "pago"), [allTx]);

  const executedFor = useMemo(
    () => (b: BudgetDto) =>
      paidTx
        .filter(
          (tx) =>
            tx.accountId === b.accountId &&
            (b.departmentId ? tx.departmentId === b.departmentId : true) &&
            new Date(tx.transactionDate).getFullYear() === b.year,
        )
        .reduce((s, tx) => s + tx.amount, 0),
    [paidTx],
  );

  const kpis = useMemo(() => {
    const paidYear = paidTx.filter((tx) => new Date(tx.transactionDate).getFullYear() === currentYear);
    const revenue = paidYear.filter((tx) => tx.type === "receita").reduce((s, tx) => s + tx.amount, 0);
    const expense = paidYear.filter((tx) => tx.type === "despesa").reduce((s, tx) => s + tx.amount, 0);
    const yearBudgets = allBudgets.filter((b) => b.year === currentYear);
    const planned = yearBudgets.reduce((s, b) => s + b.plannedAmount, 0);
    const executed = yearBudgets.reduce((s, b) => s + executedFor(b), 0);
    const executionPct = planned > 0 ? Math.round((executed / planned) * 100) : 0;
    return { revenue, expense, balance: revenue - expense, executionPct };
  }, [paidTx, allBudgets, executedFor, currentYear]);

  // --- Gráfico receita vs despesa por mês (movimentos pagos do ano corrente) ---
  const chartData = useMemo(() => {
    const buckets = new Map<number, { monthIdx: number; receita: number; despesa: number }>();
    for (const tx of paidTx) {
      const d = new Date(tx.transactionDate);
      if (d.getFullYear() !== currentYear) continue;
      const m = d.getMonth();
      const entry = buckets.get(m) ?? { monthIdx: m, receita: 0, despesa: 0 };
      if (tx.type === "receita") entry.receita += tx.amount;
      else entry.despesa += tx.amount;
      buckets.set(m, entry);
    }
    return Array.from(buckets.values())
      .sort((a, b) => a.monthIdx - b.monthIdx)
      .map((e) => ({
        month: new Date(currentYear, e.monthIdx, 1).toLocaleDateString(locale, { month: "short" }),
        receita: e.receita,
        despesa: e.despesa,
      }));
  }, [paidTx, currentYear, locale]);

  const chartConfig = useMemo(
    () => buildChartConfig(["receita", "despesa"], { receita: t("chart.revenue"), despesa: t("chart.expense") }),
    [t],
  );

  // --- Forms ---
  const accountSchema = useMemo(() => buildAccountSchema(t), [t]);
  const accountInitial = useMemo<Partial<AccountFormValues> | undefined>(
    () =>
      accEdit
        ? {
            code: accEdit.code,
            name: accEdit.name,
            type: accEdit.type,
            description: accEdit.description ?? "",
            isActive: accEdit.isActive ? "true" : "false",
          }
        : undefined,
    [accEdit],
  );
  const accountForm = useEntityForm({
    schema: accountSchema,
    initialValues: accountInitial,
    defaultValues: { code: "", name: "", type: "despesa", description: "", isActive: "true" },
    open: accForm,
    onSubmit: async (values) => {
      const payload = {
        code: values.code,
        name: values.name,
        type: values.type,
        description: values.description?.trim() ? values.description.trim() : null,
        isActive: values.isActive === "true",
      };
      if (accEdit) await updateAccount.mutateAsync({ id: accEdit.id, payload });
      else await createAccount.mutateAsync(payload);
    },
    successMessage: accEdit ? t("accounts.toast.updateSuccess") : t("accounts.toast.createSuccess"),
    errorMessage: t("toast.error"),
    onSuccess: () => setAccForm(false),
  });

  const transactionSchema = useMemo(() => buildTransactionSchema(t), [t]);
  const transactionInitial = useMemo<Partial<TransactionFormValues> | undefined>(
    () =>
      txEdit
        ? {
            accountId: txEdit.accountId,
            type: txEdit.type,
            amount: String(txEdit.amount),
            currency: txEdit.currency,
            transactionDate: txEdit.transactionDate,
            departmentId: txEdit.departmentId ?? "",
            status: txEdit.status,
            description: txEdit.description,
            reference: txEdit.reference ?? "",
            notes: txEdit.notes ?? "",
          }
        : undefined,
    [txEdit],
  );
  const transactionForm = useEntityForm({
    schema: transactionSchema,
    initialValues: transactionInitial,
    defaultValues: {
      accountId: "", type: "despesa", amount: "", currency: "AOA",
      transactionDate: new Date().toISOString().slice(0, 10),
      departmentId: "", status: "pago", description: "", reference: "", notes: "",
    },
    open: txForm,
    onSubmit: async (values) => {
      const payload = {
        accountId: values.accountId,
        departmentId: values.departmentId && values.departmentId !== NONE ? values.departmentId : null,
        type: values.type,
        amount: Number(values.amount),
        currency: values.currency,
        transactionDate: values.transactionDate,
        description: values.description,
        reference: values.reference?.trim() ? values.reference.trim() : null,
        status: values.status,
        notes: values.notes?.trim() ? values.notes.trim() : null,
      };
      if (txEdit) await updateTransaction.mutateAsync({ id: txEdit.id, payload });
      else await createTransaction.mutateAsync(payload);
    },
    successMessage: txEdit ? t("transactions.toast.updateSuccess") : t("transactions.toast.createSuccess"),
    errorMessage: t("toast.error"),
    onSuccess: () => setTxForm(false),
  });

  const budgetSchema = useMemo(() => buildBudgetSchema(t), [t]);
  const budgetInitial = useMemo<Partial<BudgetFormValues> | undefined>(
    () =>
      budEdit
        ? {
            year: String(budEdit.year),
            accountId: budEdit.accountId,
            departmentId: budEdit.departmentId ?? "",
            plannedAmount: String(budEdit.plannedAmount),
            notes: budEdit.notes ?? "",
          }
        : undefined,
    [budEdit],
  );
  const budgetForm = useEntityForm({
    schema: budgetSchema,
    initialValues: budgetInitial,
    defaultValues: { year: String(currentYear), accountId: "", departmentId: "", plannedAmount: "", notes: "" },
    open: budForm,
    onSubmit: async (values) => {
      const payload = {
        year: Number(values.year),
        accountId: values.accountId,
        departmentId: values.departmentId && values.departmentId !== NONE ? values.departmentId : null,
        plannedAmount: Number(values.plannedAmount),
        notes: values.notes?.trim() ? values.notes.trim() : null,
      };
      if (budEdit) await updateBudget.mutateAsync({ id: budEdit.id, payload });
      else await createBudget.mutateAsync(payload);
    },
    successMessage: budEdit ? t("budgets.toast.updateSuccess") : t("budgets.toast.createSuccess"),
    errorMessage: t("toast.error"),
    onSuccess: () => setBudForm(false),
  });

  // --- Open helpers ---
  const openAccCreate = () => { setAccEdit(null); setAccForm(true); };
  const openAccEdit = (a: AccountDto) => { setAccEdit(a); setAccForm(true); };
  const openTxCreate = () => { setTxEdit(null); setTxForm(true); };
  const openTxEdit = (tx: TransactionDto) => { setTxEdit(tx); setTxForm(true); };
  const openBudCreate = () => { setBudEdit(null); setBudForm(true); };
  const openBudEdit = (b: BudgetDto) => { setBudEdit(b); setBudForm(true); };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.kind === "account") await deleteAccount.mutateAsync(deleteTarget.id);
    else if (deleteTarget.kind === "transaction") await deleteTransaction.mutateAsync(deleteTarget.id);
    else await deleteBudget.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  // --- Columns ---
  const accountColumns = useMemo<ColumnDef<AccountDto>[]>(
    () => [
      {
        accessorKey: "code",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("accounts.table.code")} />,
        cell: ({ row }) => <span className="font-medium">{row.original.code}</span>,
      },
      {
        accessorKey: "name",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("accounts.table.name")} />,
      },
      {
        accessorKey: "type",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("accounts.table.type")} />,
        cell: ({ row }) => (
          <Badge variant={row.original.type === "receita" ? "default" : "outline"}>{t(`type.${row.original.type}`)}</Badge>
        ),
      },
      {
        accessorKey: "isActive",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("accounts.table.active")} />,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.isActive ? t("accounts.active.yes") : t("accounts.active.no")}
          </span>
        ),
      },
    ],
    [t],
  );

  const transactionColumns = useMemo<ColumnDef<TransactionDto>[]>(
    () => [
      {
        accessorKey: "transactionDate",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("transactions.table.date")} />,
        cell: ({ row }) => <span className="text-sm">{formatDate(row.original.transactionDate)}</span>,
      },
      {
        id: "account",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("transactions.table.account")} />,
        cell: ({ row }) => <span className="text-xs text-muted-foreground">{accountLabel(row.original.accountId)}</span>,
      },
      {
        id: "department",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("transactions.table.department")} />,
        cell: ({ row }) => <span className="text-sm">{deptName(row.original.departmentId)}</span>,
      },
      {
        accessorKey: "amount",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("transactions.table.amount")} />,
        cell: ({ row }) => (
          <span className={row.original.type === "receita" ? "text-primary font-medium" : "text-destructive font-medium"}>
            {formatKwanza(row.original.amount)}
          </span>
        ),
      },
      {
        accessorKey: "description",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("transactions.table.description")} />,
        cell: ({ row }) => (
          <span className="block max-w-[240px] truncate" title={row.original.description}>{row.original.description}</span>
        ),
      },
      {
        accessorKey: "status",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("transactions.table.status")} />,
        cell: ({ row }) => <Badge variant={statusVariant[row.original.status]}>{t(`status.${row.original.status}`)}</Badge>,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, accountMap, deptMap],
  );

  const budgetColumns = useMemo<ColumnDef<BudgetDto>[]>(
    () => [
      {
        accessorKey: "year",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("budgets.table.year")} />,
        cell: ({ row }) => <span className="font-medium">{row.original.year}</span>,
      },
      {
        id: "account",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("budgets.table.account")} />,
        cell: ({ row }) => <span className="text-xs text-muted-foreground">{accountLabel(row.original.accountId)}</span>,
      },
      {
        id: "department",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("budgets.table.department")} />,
        cell: ({ row }) => <span className="text-sm">{deptName(row.original.departmentId)}</span>,
      },
      {
        accessorKey: "plannedAmount",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("budgets.table.planned")} />,
        cell: ({ row }) => formatKwanza(row.original.plannedAmount),
      },
      {
        id: "executed",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("budgets.table.executed")} />,
        cell: ({ row }) => formatKwanza(executedFor(row.original)),
      },
      {
        id: "execution",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("budgets.table.execution")} />,
        cell: ({ row }) => {
          const pct = row.original.plannedAmount > 0 ? Math.round((executedFor(row.original) / row.original.plannedAmount) * 100) : 0;
          return <Badge variant={pct > 100 ? "destructive" : "outline"}>{pct}%</Badge>;
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, accountMap, executedFor],
  );

  // --- Row actions ---
  const accountActions = (row: AccountDto) => {
    const actions: RowAction[] = [{ label: t("actions.view"), icon: Eye, onClick: () => setAccView(row) }];
    if (canEdit) {
      actions.push({ label: t("actions.edit"), icon: Pencil, onClick: () => openAccEdit(row) });
      actions.push({ label: t("actions.delete"), icon: Trash2, destructive: true, onClick: () => setDeleteTarget({ kind: "account", id: row.id }) });
    }
    return <RowActions actions={actions} />;
  };
  const transactionActions = (row: TransactionDto) => {
    const actions: RowAction[] = [{ label: t("actions.view"), icon: Eye, onClick: () => setTxView(row) }];
    if (canEdit) {
      actions.push({ label: t("actions.edit"), icon: Pencil, onClick: () => openTxEdit(row) });
      actions.push({ label: t("actions.delete"), icon: Trash2, destructive: true, onClick: () => setDeleteTarget({ kind: "transaction", id: row.id }) });
    }
    return <RowActions actions={actions} />;
  };
  const budgetActions = (row: BudgetDto) => {
    const actions: RowAction[] = [{ label: t("actions.view"), icon: Eye, onClick: () => setBudView(row) }];
    if (canEdit) {
      actions.push({ label: t("actions.edit"), icon: Pencil, onClick: () => openBudEdit(row) });
      actions.push({ label: t("actions.delete"), icon: Trash2, destructive: true, onClick: () => setDeleteTarget({ kind: "budget", id: row.id }) });
    }
    return <RowActions actions={actions} />;
  };

  const motionSection = prefersReduced
    ? {}
    : { initial: "hidden" as const, animate: "visible" as const, variants: fadeInUp };

  const kpiCards = [
    { key: "revenue", icon: TrendingUp, label: t("kpis.revenue"), value: formatKwanza(kpis.revenue), caption: t("kpis.revenueCaption"), variant: "gradient-green" as const },
    { key: "expense", icon: TrendingDown, label: t("kpis.expense"), value: formatKwanza(kpis.expense), caption: t("kpis.expenseCaption"), variant: "gradient-gold" as const },
    { key: "balance", icon: Scale, label: t("kpis.balance"), value: formatKwanza(kpis.balance), caption: t("kpis.balanceCaption"), variant: "gradient-teal" as const },
    { key: "execution", icon: Target, label: t("kpis.execution"), value: `${kpis.executionPct}%`, caption: t("kpis.executionCaption"), variant: "gradient-green-gold" as const },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader icon={Wallet} title={t("page.title")} description={t("page.description")} />

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

      {/* Gráfico receita vs despesa por mês */}
      <motion.div {...motionSection}>
        <Card className="glass-card shadow-elegant rounded-xl hover-lift">
          <CardHeader className="pb-2 p-6">
            <CardTitle className="text-base font-semibold font-serif">{t("chart.title")}</CardTitle>
            <p className="text-xs text-muted-foreground">{t("chart.subtitle")}</p>
          </CardHeader>
          <CardContent className="p-6 pt-2">
            {chartData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[320px] w-full">
                <BarChart data={chartData} margin={{ left: 12, right: 16, top: 8 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={axisTickStyle} tickLine={false} axisLine={false} />
                  <YAxis tick={axisTickStyle} tickFormatter={formatCompactNumber} tickLine={false} axisLine={false} width={70} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="receita" name={t("chart.revenue")} fill={chartColors[0]} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="despesa" name={t("chart.expense")} fill={chartColors[1]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <NoDataOverlay message={t("chart.empty")} height={320} />
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Separadores */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions"><Receipt className="h-4 w-4 mr-1" /> {t("tabs.transactions")}</TabsTrigger>
          <TabsTrigger value="accounts"><FolderTree className="h-4 w-4 mr-1" /> {t("tabs.accounts")}</TabsTrigger>
          <TabsTrigger value="budgets"><Target className="h-4 w-4 mr-1" /> {t("tabs.budgets")}</TabsTrigger>
        </TabsList>

        {/* --- Movimentos --- */}
        <TabsContent value="transactions" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Select value={txTypeFilter} onValueChange={(v) => { setTxTypeFilter(v); setTxPage((p) => ({ ...p, pageIndex: 0 })); }}>
                <SelectTrigger className="sm:w-[180px]"><SelectValue placeholder={t("filters.typePlaceholder")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">{t("filters.allTypes")}</SelectItem>
                  {ACCOUNT_TYPES.map((ty) => <SelectItem key={ty} value={ty}>{t(`type.${ty}`)}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={txStatusFilter} onValueChange={(v) => { setTxStatusFilter(v); setTxPage((p) => ({ ...p, pageIndex: 0 })); }}>
                <SelectTrigger className="sm:w-[180px]"><SelectValue placeholder={t("filters.statusPlaceholder")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">{t("filters.allStatus")}</SelectItem>
                  {TX_STATUSES.map((s) => <SelectItem key={s} value={s}>{t(`status.${s}`)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <WriteGuard module="financeiro">
              <Button onClick={openTxCreate} disabled={accounts.length === 0}>
                <Plus className="mr-2 h-4 w-4" /> {t("transactions.new")}
              </Button>
            </WriteGuard>
          </div>
          <DataTable
            columns={transactionColumns}
            data={transactionsQuery.data?.data ?? []}
            loading={transactionsQuery.isLoading}
            pageCount={transactionsQuery.data?.meta.lastPage ?? 0}
            pagination={txPage}
            onPaginationChange={setTxPage}
            rowCount={transactionsQuery.data?.meta.total}
            globalFilter={txSearch}
            onGlobalFilterChange={setTxSearch}
            searchPlaceholder={t("transactions.table.searchPlaceholder")}
            emptyMessage={t("transactions.table.empty")}
            renderRowActions={transactionActions}
          />
        </TabsContent>

        {/* --- Contas --- */}
        <TabsContent value="accounts" className="space-y-4">
          <div className="flex justify-end">
            <WriteGuard module="financeiro">
              <Button onClick={openAccCreate}>
                <Plus className="mr-2 h-4 w-4" /> {t("accounts.new")}
              </Button>
            </WriteGuard>
          </div>
          <DataTable
            columns={accountColumns}
            data={accountsQuery.data?.data ?? []}
            loading={accountsQuery.isLoading}
            pageCount={accountsQuery.data?.meta.lastPage ?? 0}
            pagination={accPage}
            onPaginationChange={setAccPage}
            rowCount={accountsQuery.data?.meta.total}
            globalFilter={accSearch}
            onGlobalFilterChange={setAccSearch}
            searchPlaceholder={t("accounts.table.searchPlaceholder")}
            emptyMessage={t("accounts.table.empty")}
            renderRowActions={accountActions}
          />
        </TabsContent>

        {/* --- Orçamentos --- */}
        <TabsContent value="budgets" className="space-y-4">
          <div className="flex justify-end">
            <WriteGuard module="financeiro">
              <Button onClick={openBudCreate} disabled={accounts.length === 0}>
                <Plus className="mr-2 h-4 w-4" /> {t("budgets.new")}
              </Button>
            </WriteGuard>
          </div>
          <DataTable
            columns={budgetColumns}
            data={budgetsQuery.data?.data ?? []}
            loading={budgetsQuery.isLoading}
            pageCount={budgetsQuery.data?.meta.lastPage ?? 0}
            pagination={budPage}
            onPaginationChange={setBudPage}
            rowCount={budgetsQuery.data?.meta.total}
            globalFilter={budSearch}
            onGlobalFilterChange={setBudSearch}
            searchPlaceholder={t("budgets.table.searchPlaceholder")}
            emptyMessage={t("budgets.table.empty")}
            renderRowActions={budgetActions}
          />
        </TabsContent>
      </Tabs>

      {/* ===================== Dialogs de conta ===================== */}
      <EntityFormDialog
        open={accForm}
        onOpenChange={setAccForm}
        title={accEdit ? t("accounts.dialog.editTitle") : t("accounts.dialog.createTitle")}
        form={accountForm}
        submitLabel={accEdit ? t("form.submitEdit") : t("form.submitCreate")}
        submittingLabel={t("form.submitting")}
        cancelLabel={t("form.cancel")}
      >
        {(form) => (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="code" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("accounts.form.code")}</FormLabel>
                  <FormControl><Input placeholder={t("accounts.form.codePlaceholder")} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("accounts.form.type")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {ACCOUNT_TYPES.map((ty) => <SelectItem key={ty} value={ty}>{t(`type.${ty}`)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("accounts.form.name")}</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="isActive" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("accounts.form.status")}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="true">{t("accounts.form.activeOption")}</SelectItem>
                    <SelectItem value="false">{t("accounts.form.inactiveOption")}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("accounts.form.description")}</FormLabel>
                <FormControl><Textarea {...field} value={field.value ?? ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </>
        )}
      </EntityFormDialog>

      {/* ===================== Dialogs de lançamento ===================== */}
      <EntityFormDialog
        open={txForm}
        onOpenChange={setTxForm}
        title={txEdit ? t("transactions.dialog.editTitle") : t("transactions.dialog.createTitle")}
        form={transactionForm}
        submitLabel={txEdit ? t("form.submitEdit") : t("form.submitCreate")}
        submittingLabel={t("form.submitting")}
        cancelLabel={t("form.cancel")}
      >
        {(form) => (
          <>
            <FormField control={form.control} name="accountId" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("transactions.form.account")}</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(v) => {
                    field.onChange(v);
                    const acc = accountMap.get(v);
                    if (acc) form.setValue("type", acc.type);
                  }}
                >
                  <FormControl><SelectTrigger><SelectValue placeholder={t("common.selectPlaceholder")} /></SelectTrigger></FormControl>
                  <SelectContent>
                    {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.code} — {a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("transactions.form.type")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {ACCOUNT_TYPES.map((ty) => <SelectItem key={ty} value={ty}>{t(`type.${ty}`)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("transactions.form.status")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {TX_STATUSES.map((s) => <SelectItem key={s} value={s}>{t(`status.${s}`)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField control={form.control} name="amount" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("transactions.form.amount")}</FormLabel>
                  <FormControl><Input type="number" min="0" step="0.01" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="currency" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("transactions.form.currency")}</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="transactionDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("transactions.form.date")}</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="departmentId" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("transactions.form.department")}</FormLabel>
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
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("transactions.form.description")} <span className="text-destructive">*</span></FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="reference" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("transactions.form.reference")}</FormLabel>
                <FormControl><Input placeholder={t("transactions.form.referencePlaceholder")} {...field} value={field.value ?? ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("transactions.form.notes")}</FormLabel>
                <FormControl><Textarea {...field} value={field.value ?? ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </>
        )}
      </EntityFormDialog>

      {/* ===================== Dialogs de orçamento ===================== */}
      <EntityFormDialog
        open={budForm}
        onOpenChange={setBudForm}
        title={budEdit ? t("budgets.dialog.editTitle") : t("budgets.dialog.createTitle")}
        form={budgetForm}
        submitLabel={budEdit ? t("form.submitEdit") : t("form.submitCreate")}
        submittingLabel={t("form.submitting")}
        cancelLabel={t("form.cancel")}
      >
        {(form) => (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="year" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("budgets.form.year")}</FormLabel>
                  <FormControl><Input type="number" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="plannedAmount" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("budgets.form.planned")}</FormLabel>
                  <FormControl><Input type="number" min="0" step="0.01" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="accountId" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("budgets.form.account")}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger><SelectValue placeholder={t("common.selectPlaceholder")} /></SelectTrigger></FormControl>
                  <SelectContent>
                    {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.code} — {a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="departmentId" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("budgets.form.department")}</FormLabel>
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
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("budgets.form.notes")}</FormLabel>
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

      {/* ===================== Detalhes: conta ===================== */}
      <Dialog open={!!accView} onOpenChange={(o) => !o && setAccView(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-serif">{t("accounts.dialog.detailsTitle")}</DialogTitle></DialogHeader>
          {accView && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground">{t("accounts.details.code")}:</span><p className="font-medium">{accView.code}</p></div>
                <div><span className="text-muted-foreground">{t("accounts.details.type")}:</span><p><Badge variant={accView.type === "receita" ? "default" : "outline"}>{t(`type.${accView.type}`)}</Badge></p></div>
                <div><span className="text-muted-foreground">{t("accounts.details.name")}:</span><p className="font-medium">{accView.name}</p></div>
                <div><span className="text-muted-foreground">{t("accounts.details.status")}:</span><p className="font-medium">{accView.isActive ? t("accounts.active.yes") : t("accounts.active.no")}</p></div>
                <div><span className="text-muted-foreground">{t("accounts.details.createdAt")}:</span><p className="font-medium">{formatDate(accView.createdAt)}</p></div>
              </div>
              {accView.description && (
                <div><span className="text-muted-foreground">{t("accounts.details.description")}:</span><p className="font-medium mt-1">{accView.description}</p></div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ===================== Detalhes: lançamento ===================== */}
      <Dialog open={!!txView} onOpenChange={(o) => !o && setTxView(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-serif">{t("transactions.dialog.detailsTitle")}</DialogTitle></DialogHeader>
          {txView && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground">{t("transactions.details.account")}:</span><p className="font-medium">{accountLabel(txView.accountId)}</p></div>
                <div><span className="text-muted-foreground">{t("transactions.details.department")}:</span><p className="font-medium">{deptName(txView.departmentId)}</p></div>
                <div><span className="text-muted-foreground">{t("transactions.details.type")}:</span><p><Badge variant={txView.type === "receita" ? "default" : "outline"}>{t(`type.${txView.type}`)}</Badge></p></div>
                <div><span className="text-muted-foreground">{t("transactions.details.status")}:</span><p><Badge variant={statusVariant[txView.status]}>{t(`status.${txView.status}`)}</Badge></p></div>
                <div><span className="text-muted-foreground">{t("transactions.details.amount")}:</span><p className={txView.type === "receita" ? "text-primary font-medium" : "text-destructive font-medium"}>{formatKwanza(txView.amount)}</p></div>
                <div><span className="text-muted-foreground">{t("transactions.details.date")}:</span><p className="font-medium">{formatDate(txView.transactionDate)}</p></div>
                {txView.reference && (
                  <div><span className="text-muted-foreground">{t("transactions.details.reference")}:</span><p className="font-medium">{txView.reference}</p></div>
                )}
              </div>
              <div><span className="text-muted-foreground">{t("transactions.details.description")}:</span><p className="font-medium mt-1">{txView.description}</p></div>
              {txView.notes && (
                <div><span className="text-muted-foreground">{t("transactions.details.notes")}:</span><p className="font-medium mt-1">{txView.notes}</p></div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ===================== Detalhes: orçamento ===================== */}
      <Dialog open={!!budView} onOpenChange={(o) => !o && setBudView(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-serif">{t("budgets.dialog.detailsTitle")}</DialogTitle></DialogHeader>
          {budView && (() => {
            const executed = executedFor(budView);
            const pct = budView.plannedAmount > 0 ? Math.round((executed / budView.plannedAmount) * 100) : 0;
            return (
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div><span className="text-muted-foreground">{t("budgets.details.year")}:</span><p className="font-medium">{budView.year}</p></div>
                  <div><span className="text-muted-foreground">{t("budgets.details.account")}:</span><p className="font-medium">{accountLabel(budView.accountId)}</p></div>
                  <div><span className="text-muted-foreground">{t("budgets.details.department")}:</span><p className="font-medium">{deptName(budView.departmentId)}</p></div>
                  <div><span className="text-muted-foreground">{t("budgets.details.execution")}:</span><p><Badge variant={pct > 100 ? "destructive" : "outline"}>{pct}%</Badge></p></div>
                  <div><span className="text-muted-foreground">{t("budgets.details.planned")}:</span><p className="font-medium">{formatKwanza(budView.plannedAmount)}</p></div>
                  <div><span className="text-muted-foreground">{t("budgets.details.executed")}:</span><p className="font-medium">{formatKwanza(executed)}</p></div>
                </div>
                {budView.notes && (
                  <div><span className="text-muted-foreground">{t("budgets.details.notes")}:</span><p className="font-medium mt-1">{budView.notes}</p></div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
