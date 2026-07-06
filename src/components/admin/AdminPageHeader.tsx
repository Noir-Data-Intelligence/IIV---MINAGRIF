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
    <div className="relative animate-fade-up">
      {/* Subtle gradient accent bar */}
      <div className="absolute -top-1 left-0 h-0.5 w-16 rounded-full gradient-green-gold" />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pt-2">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl gradient-green-soft text-primary-foreground shadow-elegant">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold tracking-tight leading-tight">{title}</h1>
            {description && (
              <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
            )}
          </div>
        </div>
        {children && <div className="flex items-center gap-2 mt-2 sm:mt-0">{children}</div>}
      </div>
    </div>
  );
}
