import { type LucideIcon, Inbox } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  /** Icon shown inside the circle. Defaults to `Inbox`. */
  icon?: LucideIcon;
  /** Optional title shown above the message. */
  title?: string;
  /** Main message. Defaults to a generic translated "no records" message. */
  message?: string;
  /** Optional call-to-action button, e.g. { label: "Criar novo", onClick } */
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon: Icon = Inbox, title, message, action, className }: EmptyStateProps) {
  const { t } = useTranslation("common");
  const resolvedMessage = message ?? t("emptyState.defaultMessage");

  return (
    <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-4">
        <Icon className="h-7 w-7 text-muted-foreground/60" />
      </div>
      {title && <p className="text-sm font-medium text-foreground mb-1">{title}</p>}
      <p className="text-sm text-muted-foreground max-w-xs">{resolvedMessage}</p>
      {action && (
        <Button variant="outline" size="sm" className="mt-4" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
