import { type LucideIcon } from "lucide-react";
import { type ReactNode } from "react";

interface AdminPageHeaderProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  children?: ReactNode; // action buttons
}

export function AdminPageHeader({ icon: Icon, title, description, children }: AdminPageHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-[hsl(var(--iiv-green-light))] via-card to-card shadow-lg animate-fade-up dark:from-accent/40 dark:via-card dark:to-card">
      <div className="absolute -top-14 -right-14 h-40 w-40 rounded-full bg-[hsl(var(--iiv-gold))]/10 blur-3xl" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl gradient-green-soft text-primary-foreground shadow-lg">
            <Icon className="h-6 w-6" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-bold tracking-tight leading-tight">{title}</h1>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
        </div>
        {children && <div className="relative flex items-center gap-2">{children}</div>}
      </div>
    </div>
  );
}
