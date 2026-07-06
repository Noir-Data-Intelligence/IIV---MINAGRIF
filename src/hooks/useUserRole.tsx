import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  type AppRole,
  type ModuleKey,
  canView as canViewFn,
  canWrite as canWriteFn,
  setDynamicPermissions,
} from "@/lib/permissions";

let permsLoaded = false;
let permsLoading: Promise<void> | null = null;

async function ensurePermissionsLoaded() {
  if (permsLoaded) return;
  if (permsLoading) return permsLoading;
  permsLoading = (async () => {
    const { data } = await supabase
      .from("role_permissions")
      .select("role, module, can_view, can_write");
    if (data) setDynamicPermissions(data as any);
    permsLoaded = true;
  })();
  return permsLoading;
}

// ---- Shared role cache (module-level singleton) ----
let cachedRole: AppRole | null = null;
let cachedUserId: string | null = null;
let roleLoadingPromise: Promise<void> | null = null;
const subscribers = new Set<(role: AppRole | null) => void>();

function notify() {
  subscribers.forEach((cb) => cb(cachedRole));
}

async function loadRoleFor(userId: string) {
  if (cachedUserId === userId && cachedRole !== null) return;
  if (roleLoadingPromise && cachedUserId === userId) return roleLoadingPromise;
  cachedUserId = userId;
  roleLoadingPromise = (async () => {
    await ensurePermissionsLoaded();
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .order("role")
      .limit(1)
      .maybeSingle();
    cachedRole = ((data?.role as AppRole) ?? null);
    notify();
  })();
  try {
    await roleLoadingPromise;
  } finally {
    roleLoadingPromise = null;
  }
}

export function clearUserRoleCache() {
  cachedRole = null;
  cachedUserId = null;
  roleLoadingPromise = null;
  notify();
}

/** Force a re-fetch of the permission matrix (call after admin edits it). */
export async function refreshPermissionsMatrix() {
  permsLoaded = false;
  permsLoading = null;
  await ensurePermissionsLoaded();
  notify();
}

export function useUserRole() {
  const { user, loading: authLoading } = useAuth();
  // Initialize from cache so subsequent mounts don't flash a loading state.
  const initialRole = user && cachedUserId === user.id ? cachedRole : null;
  const initialLoading = !user ? false : !(cachedUserId === user.id && cachedRole !== null);
  const [role, setRole] = useState<AppRole | null>(initialRole);
  const [loading, setLoading] = useState(initialLoading);

  useEffect(() => {
    let active = true;

    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    // If cache already matches this user, use it immediately.
    if (cachedUserId === user.id && cachedRole !== null) {
      setRole(cachedRole);
      setLoading(false);
    } else {
      setLoading(true);
      loadRoleFor(user.id).then(() => {
        if (!active) return;
        setRole(cachedRole);
        setLoading(false);
      });
    }

    // Subscribe to global changes (matrix refresh, logout, etc.)
    const cb = (r: AppRole | null) => {
      if (!active) return;
      setRole(r);
    };
    subscribers.add(cb);
    return () => {
      active = false;
      subscribers.delete(cb);
    };
  }, [user]);

  return {
    role,
    loading: authLoading || loading,
    isAdmin: role === "admin",
    canView: (m: ModuleKey) => canViewFn(role, m),
    canWrite: (m: ModuleKey) => canWriteFn(role, m),
  };
}
