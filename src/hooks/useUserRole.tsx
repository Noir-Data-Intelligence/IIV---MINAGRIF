import { useEffect, useState } from "react";
import { getPermissionsMatrix } from "@/services/api/rbac";
import { useAuth } from "@/hooks/useAuth";
import {
  type ModuleKey,
  canViewAny,
  canWriteAny,
  primaryRole,
  setDynamicPermissions,
} from "@/lib/permissions";

/**
 * Matriz de permissões (overrides dinâmicos ao default estático) — global,
 * não depende do utilizador com sessão activa. Carregada uma vez e mantida
 * em cache module-level; `refreshPermissionsMatrix()` força um recarregamento
 * (chamado por `useRbac.ts` depois de o admin editar a matriz).
 *
 * O papel do utilizador em si já não precisa de cache: vem directamente de
 * `useAuth().user.roles`, que é reactivo por si só (login/logout/refresh).
 */
let permsLoaded = false;
let permsLoading: Promise<void> | null = null;
const subscribers = new Set<() => void>();

async function ensurePermissionsLoaded() {
  if (permsLoaded) return;
  if (permsLoading) return permsLoading;
  permsLoading = (async () => {
    const rows = await getPermissionsMatrix();
    setDynamicPermissions(rows);
    permsLoaded = true;
  })();
  return permsLoading;
}

/** Force a re-fetch of the permission matrix (call after admin edits it). */
export async function refreshPermissionsMatrix() {
  permsLoaded = false;
  permsLoading = null;
  await ensurePermissionsLoaded();
  subscribers.forEach((cb) => cb());
}

export function useUserRole() {
  const { user, loading: authLoading } = useAuth();
  const role = user ? primaryRole(user.roles) : null;
  const [, forceRender] = useState(0);

  useEffect(() => {
    if (!user) return;
    ensurePermissionsLoaded().then(() => forceRender((n) => n + 1));
    const cb = () => forceRender((n) => n + 1);
    subscribers.add(cb);
    return () => {
      subscribers.delete(cb);
    };
  }, [user]);

  const roles = user?.roles ?? [];

  return {
    role,
    loading: authLoading,
    isAdmin: role === "admin",
    canView: (m: ModuleKey) => canViewAny(roles, m),
    canWrite: (m: ModuleKey) => canWriteAny(roles, m),
  };
}
