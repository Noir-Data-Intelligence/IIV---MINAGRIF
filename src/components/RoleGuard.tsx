import { useEffect, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";
import type { ModuleKey } from "@/lib/permissions";

interface RoleGuardProps {
  module: ModuleKey;
  children: ReactNode;
}

export function RoleGuard({ module, children }: RoleGuardProps) {
  const { loading, role, canView } = useUserRole();
  const { toast } = useToast();
  const allowed = canView(module);
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

