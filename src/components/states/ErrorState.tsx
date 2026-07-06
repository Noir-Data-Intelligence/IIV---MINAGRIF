import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ErrorStateProps {
  /** Title shown above the message. Defaults to a generic translated error title. */
  title?: string;
  /** Main message. Defaults to a generic translated error message. */
  message?: string;
  /** Called when the user clicks "Tentar novamente". If omitted, no retry button is shown. */
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ title, message, onRetry, className }: ErrorStateProps) {
  const { t } = useTranslation("common");
  const resolvedTitle = title ?? t("errorState.title");
  const resolvedMessage = message ?? t("errorState.defaultMessage");

  return (
    <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 mb-4">
        <AlertTriangle className="h-7 w-7 text-destructive" />
      </div>
      <p className="text-sm font-medium text-foreground mb-1">{resolvedTitle}</p>
      <p className="text-sm text-muted-foreground max-w-xs">{resolvedMessage}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          {t("errorState.retry")}
        </Button>
      )}
    </div>
  );
}
