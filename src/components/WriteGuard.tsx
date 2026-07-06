import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { useUserRole } from "@/hooks/useUserRole";
import type { ModuleKey } from "@/lib/permissions";

interface WriteGuardProps {
  module: ModuleKey;
  children: ReactNode;
  /** Rendered instead of `children` when the user lacks write permission (default: nothing). */
  fallback?: ReactNode;
  /**
   * Instead of hiding `children`, clone it and force `disabled: true` (e.g. keep a button
   * visible but inert, so a tooltip explaining the restriction can still be shown around it).
   *
   * Limitation: this only works when `children` is a single valid React element that accepts a
   * `disabled` prop (buttons, inputs, etc). It uses `React.cloneElement`, so it does not attempt
   * to walk into nested children or merge disabled state for fragments/arrays/text nodes — in
   * those cases it silently falls back to the show/hide behaviour instead of throwing.
   */
  disableInstead?: boolean;
}

/**
 * Wraps write-only UI (buttons, actions, form controls) so pages stop repeating the inline
 * `{canEdit && <Button>...}` pattern. Mirrors the style of `RoleGuard` but checks `canWrite`
 * instead of `canView`, and never redirects — it only decides what to render locally.
 */
export function WriteGuard({ module, children, fallback = null, disableInstead = false }: WriteGuardProps) {
  const { canWrite } = useUserRole();
  const allowed = canWrite(module);

  if (allowed) return <>{children}</>;

  if (disableInstead && isValidElement(children)) {
    return cloneElement(children as ReactElement<{ disabled?: boolean }>, { disabled: true });
  }

  return <>{fallback}</>;
}
