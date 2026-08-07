import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "framer-motion";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Shield, Save, UserPlus, Trash2, Search, RefreshCw, Eye, Pencil, RotateCcw, Boxes, Users,
} from "lucide-react";
import {
  ALL_MODULES, ALL_ROLES, MODULE_LABEL, ROLE_LABEL, ROLE_PERMISSIONS,
  type AppRole, type ModuleKey,
} from "@/lib/permissions";
import {
  usePermissionsMatrix, useSavePermissionsMatrix, useUserRoleAssignments,
  useAddUserRole, useRemoveUserRole,
} from "@/hooks/queries/useRbac";
import type { PermissionEntryDto } from "@/types/dto/rbac";
import { cn } from "@/lib/utils";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import i18n from "@/i18n";
import ptRbac from "@/i18n/locales/pt/admin/rbac.json";
import enRbac from "@/i18n/locales/en/admin/rbac.json";

// Namespace "rbac" registado em runtime (à semelhança de Departamentos.tsx), para
// manter esta página autónoma sem tocar na configuração global (src/i18n/index.ts).
// Os labels de papel/módulo continuam a vir de ROLE_LABEL/MODULE_LABEL.
if (!i18n.hasResourceBundle("pt", "rbac"))
  i18n.addResourceBundle("pt", "rbac", ptRbac, true, true);
if (!i18n.hasResourceBundle("en", "rbac"))
  i18n.addResourceBundle("en", "rbac", enRbac, true, true);

type PermRow = { role: AppRole; module: ModuleKey; can_view: boolean; can_write: boolean };

const ROLE_TONE: Record<AppRole, string> = {
  admin: "bg-primary/10 text-primary border-primary/30",
  diretor: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
  "director-laboratorio": "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
  "responsavel-qualidade": "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/30",
  tecnico: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30",
  recepcionista: "bg-muted text-muted-foreground border-border",
  "gestor-stock": "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  "gestor-patrimonio": "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  "gestor-financeiro": "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  "gestor-rh": "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  "gestor-estacao": "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  isv: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30",
};

// Conversões entre o DTO REST (camelCase) e a linha interna da matriz (snake_case,
// preservada tal como a versão Supabase para não mexer na lógica de dirty-tracking).
const toPermRow = (e: PermissionEntryDto): PermRow => ({
  role: e.role, module: e.module, can_view: e.canView, can_write: e.canWrite,
});
const toEntry = (r: PermRow): PermissionEntryDto => ({
  role: r.role, module: r.module, canView: r.can_view, canWrite: r.can_write,
});

export default function RBAC() {
  const { t } = useTranslation("rbac");
  const { toast } = useToast();
  const prefersReducedMotion = useReducedMotion();

  // Origem dos dados: camada mock via react-query (substitui as 3 queries Supabase).
  const permsQuery = usePermissionsMatrix();
  const assignmentsQuery = useUserRoleAssignments();
  const saveMutation = useSavePermissionsMatrix();
  const addRoleMutation = useAddUserRole();
  const removeRoleMutation = useRemoveUserRole();

  const loading = permsQuery.isLoading || assignmentsQuery.isLoading;
  const saving = saveMutation.isPending;

  const [matrix, setMatrix] = useState<Record<string, PermRow>>({});
  const [baseline, setBaseline] = useState<Record<string, PermRow>>({});
  const [moduleSearch, setModuleSearch] = useState("");

  const [search, setSearch] = useState("");
  const [newRoleByUser, setNewRoleByUser] = useState<Record<string, AppRole>>({});

  const assignments = assignmentsQuery.data ?? [];

  const keyOf = (role: AppRole, m: ModuleKey) => `${role}:${m}`;

  function buildSeedMatrix(perms: PermRow[]) {
    const m: Record<string, PermRow> = {};
    for (const role of ALL_ROLES) {
      for (const mod of ALL_MODULES) {
        m[keyOf(role, mod)] = { role, module: mod, can_view: false, can_write: false };
      }
    }
    for (const p of perms) m[keyOf(p.role, p.module)] = p;
    return m;
  }

  // Semeia matriz/baseline quando a matriz chega (ou é recarregada). A lógica de
  // dirty-tracking permanece inalterada — só muda a fonte inicial dos dados.
  useEffect(() => {
    if (!permsQuery.data) return;
    const seeded = buildSeedMatrix(permsQuery.data.map(toPermRow));
    setMatrix(seeded);
    setBaseline(JSON.parse(JSON.stringify(seeded)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permsQuery.data]);

  function reloadAll() {
    permsQuery.refetch();
    assignmentsQuery.refetch();
  }

  function togglePerm(role: AppRole, mod: ModuleKey, field: "can_view" | "can_write", value: boolean) {
    if (role === "admin") return;
    setMatrix((prev) => {
      const k = keyOf(role, mod);
      const cur = prev[k] ?? { role, module: mod, can_view: false, can_write: false };
      const next = { ...cur, [field]: value };
      if (field === "can_write" && value) next.can_view = true;
      if (field === "can_view" && !value) next.can_write = false;
      return { ...prev, [k]: next };
    });
  }

  function setRowAll(mod: ModuleKey, kind: "view" | "write" | "none") {
    setMatrix((prev) => {
      const next = { ...prev };
      for (const role of ALL_ROLES) {
        if (role === "admin") continue;
        const k = keyOf(role, mod);
        const cur = next[k] ?? { role, module: mod, can_view: false, can_write: false };
        if (kind === "none") next[k] = { ...cur, can_view: false, can_write: false };
        else if (kind === "view") next[k] = { ...cur, can_view: true };
        else next[k] = { ...cur, can_view: true, can_write: true };
      }
      return next;
    });
  }

  function resetRoleToDefault(role: AppRole) {
    if (role === "admin") return;
    const def = ROLE_PERMISSIONS[role];
    setMatrix((prev) => {
      const next = { ...prev };
      for (const mod of ALL_MODULES) {
        next[keyOf(role, mod)] = {
          role, module: mod,
          can_view: def.view.includes(mod),
          can_write: def.write.includes(mod),
        };
      }
      return next;
    });
    toast({
      title: t("toast.resetApplied.title"),
      description: t("toast.resetApplied.description", { role: ROLE_LABEL[role] }),
    });
  }

  const dirtyCount = useMemo(() => {
    let n = 0;
    for (const k of Object.keys(matrix)) {
      const a = matrix[k], b = baseline[k];
      if (!b || a.can_view !== b.can_view || a.can_write !== b.can_write) n++;
    }
    return n;
  }, [matrix, baseline]);

  async function savePermissions() {
    // Mantém o comportamento original: envia a matriz completa (todos os papéis
    // excepto admin). O handler PUT substitui o conjunto pelo enviado.
    const entries = Object.values(matrix).filter((r) => r.role !== "admin").map(toEntry);
    try {
      await saveMutation.mutateAsync(entries);
      setBaseline(JSON.parse(JSON.stringify(matrix)));
      toast({
        title: t("toast.saveSuccess.title"),
        description: t("toast.saveSuccess.description"),
      });
    } catch (err) {
      toast({
        title: t("toast.saveError.title"),
        description: err instanceof Error ? err.message : t("toast.error.description"),
        variant: "destructive",
      });
    }
  }

  async function assignRole(userId: string, role: AppRole) {
    const assignment = assignments.find((a) => a.userId === userId);
    if (assignment?.roles.includes(role)) {
      toast({
        title: t("toast.alreadyAssigned.title"),
        description: t("toast.alreadyAssigned.description", { role: ROLE_LABEL[role] }),
      });
      return;
    }
    try {
      await addRoleMutation.mutateAsync({ userId, role });
      toast({
        title: t("toast.roleAssigned.title"),
        description: t("toast.roleAssigned.description", { role: ROLE_LABEL[role] }),
      });
    } catch (err) {
      toast({
        title: t("toast.error.title"),
        description: err instanceof Error ? err.message : t("toast.error.description"),
        variant: "destructive",
      });
    }
  }

  async function removeRole(userId: string, role: AppRole) {
    try {
      await removeRoleMutation.mutateAsync({ userId, role });
      toast({ title: t("toast.roleRemoved.title") });
    } catch (err) {
      toast({
        title: t("toast.error.title"),
        description: err instanceof Error ? err.message : t("toast.error.description"),
        variant: "destructive",
      });
    }
  }

  const filteredProfiles = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return assignments;
    return assignments.filter((p) => (p.fullName || "").toLowerCase().includes(q));
  }, [assignments, search]);

  const filteredModules = useMemo(() => {
    const q = moduleSearch.trim().toLowerCase();
    if (!q) return ALL_MODULES;
    return ALL_MODULES.filter((m) => MODULE_LABEL[m].toLowerCase().includes(q) || m.includes(q));
  }, [moduleSearch]);

  const totals = useMemo(() => {
    const out = {} as Record<AppRole, { view: number; write: number }>;
    for (const role of ALL_ROLES) {
      out[role] = role === "admin"
        ? { view: ALL_MODULES.length, write: ALL_MODULES.length }
        : { view: 0, write: 0 };
    }
    for (const role of ALL_ROLES) {
      if (role === "admin") continue;
      for (const mod of ALL_MODULES) {
        const c = matrix[keyOf(role, mod)];
        if (c?.can_view) out[role].view++;
        if (c?.can_write) out[role].write++;
      }
    }
    return out;
  }, [matrix]);

  // KPIs de topo — panorama rápido do estado do RBAC (módulos, papéis, cobertura
  // de atribuição e alterações por gravar), à semelhança do Painel de Controlo.
  const usersWithRole = useMemo(
    () => assignments.filter((a) => (a.roles ?? []).length > 0).length,
    [assignments],
  );

  function isCellDirty(role: AppRole, mod: ModuleKey) {
    const k = keyOf(role, mod);
    const a = matrix[k], b = baseline[k];
    if (!b) return false;
    return a.can_view !== b.can_view || a.can_write !== b.can_write;
  }

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-6">
        <AdminPageHeader
          icon={Shield}
          title={t("page.title")}
          description={t("page.description")}
        >
          <Button variant="outline" size="sm" onClick={reloadAll} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            {t("actions.reload")}
          </Button>
        </AdminPageHeader>

        {/* KPIs — panorama rápido do estado do RBAC */}
        <motion.div
          className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4"
          variants={prefersReducedMotion ? undefined : staggerContainer}
          initial={prefersReducedMotion ? undefined : "hidden"}
          animate={prefersReducedMotion ? undefined : "visible"}
        >
          <motion.div variants={prefersReducedMotion ? undefined : fadeInUp}>
            <AdminCard
              icon={Boxes}
              metric={ALL_MODULES.length}
              title={t("kpis.modules")}
              caption={t("kpis.modulesCaption")}
              variant="gradient-green"
            />
          </motion.div>
          <motion.div variants={prefersReducedMotion ? undefined : fadeInUp}>
            <AdminCard
              icon={Shield}
              metric={ALL_ROLES.length}
              title={t("kpis.roles")}
              caption={t("kpis.rolesCaption")}
              variant="gradient-gold"
            />
          </motion.div>
          <motion.div variants={prefersReducedMotion ? undefined : fadeInUp}>
            <AdminCard
              icon={Users}
              metric={usersWithRole}
              title={t("kpis.assignedUsers")}
              caption={t("kpis.assignedUsersCaption", { count: assignments.length })}
              variant="gradient-teal"
            />
          </motion.div>
          <motion.div variants={prefersReducedMotion ? undefined : fadeInUp}>
            <AdminCard
              icon={Save}
              metric={dirtyCount}
              title={t("kpis.unsaved")}
              caption={t("kpis.unsavedCaption")}
              variant="glass"
            />
          </motion.div>
        </motion.div>

        <Tabs defaultValue="matrix" className="space-y-4">
          <TabsList>
            <TabsTrigger value="matrix">{t("tabs.matrix")}</TabsTrigger>
            <TabsTrigger value="users">{t("tabs.users")}</TabsTrigger>
          </TabsList>

          {/* MATRIX */}
          <TabsContent value="matrix" className="space-y-4">
            <AdminCard title={t("matrix.cardTitle")} icon={Shield} loading={loading}>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <div className="relative max-w-xs flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={moduleSearch}
                    onChange={(e) => setModuleSearch(e.target.value)}
                    placeholder={t("matrix.filterPlaceholder")}
                    className="pl-9"
                  />
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {t("matrix.view")}</span>
                  <span className="inline-flex items-center gap-1"><Pencil className="h-3.5 w-3.5" /> {t("matrix.write")}</span>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  {dirtyCount > 0 && (
                    <Badge variant="outline" className="border-amber-500/40 text-amber-700 dark:text-amber-300">
                      {t("matrix.dirty", { count: dirtyCount })}
                    </Badge>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMatrix(JSON.parse(JSON.stringify(baseline)))}
                    disabled={dirtyCount === 0 || saving}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    {t("matrix.revert")}
                  </Button>
                  <Button onClick={savePermissions} disabled={saving || dirtyCount === 0}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? t("matrix.saving") : t("matrix.save")}
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border overflow-auto max-h-[70vh]">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-card">
                    <TableRow>
                      <TableHead className="min-w-[180px] sticky left-0 bg-card z-20">{t("matrix.thModule")}</TableHead>
                      {ALL_ROLES.map((r) => (
                        <TableHead key={r} className="text-center min-w-[150px]">
                          <div className="flex flex-col items-center gap-1.5 py-1">
                            <Badge variant="outline" className={cn("border", ROLE_TONE[r])}>
                              {ROLE_LABEL[r]}
                            </Badge>
                            <div className="text-[10px] font-normal text-muted-foreground">
                              {t("matrix.totals", { view: totals[r].view, write: totals[r].write })}
                            </div>
                            {r !== "admin" && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => resetRoleToDefault(r)}
                                    className="text-[10px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                                  >
                                    {t("matrix.resetDefault")}
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>{t("matrix.resetTooltip")}</TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </TableHead>
                      ))}
                      <TableHead className="w-28 text-center">{t("matrix.thShortcuts")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredModules.map((m) => (
                      <TableRow key={m} className="hover:bg-muted/30">
                        <TableCell className="font-medium sticky left-0 bg-card">
                          {MODULE_LABEL[m]}
                          <div className="text-[10px] text-muted-foreground">{m}</div>
                        </TableCell>
                        {ALL_ROLES.map((role) => {
                          const cell = matrix[keyOf(role, m)];
                          const isAdmin = role === "admin";
                          const view = isAdmin || !!cell?.can_view;
                          const write = isAdmin || !!cell?.can_write;
                          const dirty = !isAdmin && isCellDirty(role, m);
                          return (
                            <TableCell key={role} className={cn("text-center", dirty && "bg-amber-500/5")}>
                              <div className="flex items-center justify-center gap-3">
                                <label className="inline-flex items-center gap-1 cursor-pointer">
                                  <Checkbox
                                    checked={view}
                                    disabled={isAdmin}
                                    onCheckedChange={(v) => togglePerm(role, m, "can_view", !!v)}
                                    aria-label={t("matrix.canViewAria", { role: ROLE_LABEL[role], module: MODULE_LABEL[m] })}
                                  />
                                  <Eye className={cn("h-3.5 w-3.5", view ? "text-primary" : "text-muted-foreground/40")} />
                                </label>
                                <label className="inline-flex items-center gap-1 cursor-pointer">
                                  <Checkbox
                                    checked={write}
                                    disabled={isAdmin}
                                    onCheckedChange={(v) => togglePerm(role, m, "can_write", !!v)}
                                    aria-label={t("matrix.canWriteAria", { role: ROLE_LABEL[role], module: MODULE_LABEL[m] })}
                                  />
                                  <Pencil className={cn("h-3.5 w-3.5", write ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground/40")} />
                                </label>
                              </div>
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setRowAll(m, "view")}>
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{t("matrix.allView")}</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setRowAll(m, "write")}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{t("matrix.allWrite")}</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setRowAll(m, "none")}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{t("matrix.allNone")}</TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredModules.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={ALL_ROLES.length + 2} className="text-center text-sm text-muted-foreground py-8">
                          {t("matrix.noModules")}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                {t("matrix.note")}
              </p>
            </AdminCard>
          </TabsContent>

          {/* USERS */}
          <TabsContent value="users" className="space-y-4">
            <AdminCard
              title={t("users.cardTitle")}
              icon={UserPlus}
              loading={loading}
              isEmpty={!loading && filteredProfiles.length === 0}
              emptyMessage={t("users.empty")}
            >
              <div className="relative mb-4 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("users.searchPlaceholder")}
                  className="pl-9"
                />
              </div>

              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("users.thUser")}</TableHead>
                      <TableHead>{t("users.thRoles")}</TableHead>
                      <TableHead className="w-72 text-right">{t("users.thAssign")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProfiles.map((p) => {
                      const roles = p.roles ?? [];
                      const selected = newRoleByUser[p.userId] ?? "recepcionista";
                      return (
                        <TableRow key={p.userId}>
                          <TableCell className="font-medium">{p.fullName || t("users.emptyName")}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1.5">
                              {roles.length === 0 && (
                                <span className="text-xs text-muted-foreground">{t("users.noRoles")}</span>
                              )}
                              {roles.map((r) => (
                                <Badge key={r} variant="outline" className={cn("gap-1.5 pr-1 border", ROLE_TONE[r])}>
                                  {ROLE_LABEL[r]}
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <button
                                        className="h-4 w-4 rounded hover:bg-destructive/20 inline-flex items-center justify-center"
                                        aria-label={t("users.removeAria", { role: ROLE_LABEL[r] })}
                                      >
                                        <Trash2 className="h-3 w-3 text-destructive" />
                                      </button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>{t("users.removeTitle")}</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          {t("users.removeDescription", { role: ROLE_LABEL[r] })}
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => removeRole(p.userId, r)}>
                                          {t("common.remove")}
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-2">
                              <Select
                                value={selected}
                                onValueChange={(v) => setNewRoleByUser((s) => ({ ...s, [p.userId]: v as AppRole }))}
                              >
                                <SelectTrigger className="w-44">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {ALL_ROLES.map((r) => (
                                    <SelectItem key={r} value={r}>{ROLE_LABEL[r]}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button size="sm" onClick={() => assignRole(p.userId, selected)}>
                                <UserPlus className="h-4 w-4 mr-1.5" />
                                {t("users.assign")}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </AdminCard>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}
