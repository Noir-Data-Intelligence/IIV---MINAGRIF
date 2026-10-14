import { useEffect, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";
import type { ModuleKey } from "@/lib/permissions";

interface RoleGuardProps {
  /** Um módulo, ou vários alternativos (basta poder ver um — ex. páginas do Laboratório partilhadas por fases). */
  module: ModuleKey | ModuleKey[];
  children: ReactNode;
}

export function RoleGuard({ module, children }: RoleGuardProps) {
  const { loading, role, canView } = useUserRole();
  const { toast } = useToast();
  const allowed = Array.isArray(module) ? module.some((m) => canView(m)) : canView(module);
  // If role already known (from cache), render immediately to avoid flash between routes.
  const ready = !loading || role !== null;

  useEffect(() => {
    if (ready && !allowed) {
      toast({
        title: "Acesso restrito",
        description: "Não tem permissão para aceder a este módulo.",
        variant: "destructive",
      });
    }
  }, [ready, allowed, toast]);

  if (!ready) return null;
  if (!allowed) return <Navigate to="/admin" replace />;
  return <>{children}</>;
}

