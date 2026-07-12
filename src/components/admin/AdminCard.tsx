import { type ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { type LucideIcon, Inbox, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "glass" | "gradient-green" | "gradient-gold" | "gradient-teal" | "gradient-green-gold";

interface AdminCardProps {
  title?: string;
  icon?: LucideIcon;
  loading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  children?: ReactNode;
  variant?: Variant;
  /** KPI mode: shows a large metric value and optional trend */
  metric?: string | number;
  trend?: { value: string; direction: "up" | "down" };
  /** Caption shown below metric */
  caption?: string;
  className?: string;
  stagger?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-4">
        <Inbox className="h-7 w-7 text-muted-foreground/60" />
      </div>
      <p className="text-sm text-muted-foreground max-w-xs">{message}</p>
    </div>
  );
}

const variantClass: Record<Variant, string> = {
  "glass": "glass-card",
  "gradient-green": "gradient-green border-0 text-primary-foreground",
  "gradient-gold": "gradient-gold border-0 text-primary-foreground",
  "gradient-teal": "gradient-teal border-0 text-primary-foreground",
  "gradient-green-gold": "gradient-green-gold border-0 text-primary-foreground",
};

export function AdminCard({
  title,
  icon: Icon,
  loading,
  isEmpty,
  emptyMessage = "Nenhum registo encontrado.",
  children,
  variant = "glass",
  metric,
  trend,
  caption,
  className,
  stagger,
}: AdminCardProps) {
  const isGradient = variant !== "glass";
  const isKpi = metric !== undefined;

  // KPI compact card
  if (isKpi) {
    return (
      <Card
        className={cn(
          "shadow-elegant rounded-xl overflow-hidden relative group hover-lift animate-fade-up",
          variantClass[variant],
          stagger && `stagger-${stagger}`,
          className
        )}
      >
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 shimmer-bg pointer-events-none" />
        <CardContent className="p-5 relative">
          <div className="flex items-center justify-between mb-3">
            {Icon && (
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl backdrop-blur-sm transition-transform duration-300 group-hover:scale-105",
                  isGradient ? "bg-white/15" : "gradient-green-soft text-primary-foreground shadow-md"
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </div>
            )}
            {trend && (
              <div
                className={cn(
                  "flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                  isGradient
                    ? "bg-white/15 text-primary-foreground"
                    : trend.direction === "up"
                    ? "bg-primary/10 text-primary"
                    : "bg-destructive/10 text-destructive"
                )}
              >
                {trend.direction === "up" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {trend.value}
              </div>
            )}
          </div>
          <p className={cn("text-3xl font-serif leading-none", isGradient ? "" : "text-foreground")}>{metric}</p>
          {title && (
            <p className={cn("text-xs mt-2 font-medium", isGradient ? "text-primary-foreground/85" : "text-muted-foreground")}>
              {title}
            </p>
          )}
          {caption && (
            <p className={cn("text-[10px] mt-0.5", isGradient ? "text-primary-foreground/60" : "text-muted-foreground")}>
              {caption}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  // Standard content card
  return (
    <Card
      className={cn(
        "shadow-elegant rounded-xl overflow-hidden animate-fade-up",
        variantClass[variant],
        stagger && `stagger-${stagger}`,
        className
      )}
    >
      {title && (
        <CardHeader className="pb-3 border-b border-border/40">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            {Icon && <Icon className="h-4 w-4" />}
            {title}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className={cn(title ? "pt-5" : "p-5")}>
        {loading ? <LoadingSkeleton /> : isEmpty ? <EmptyState message={emptyMessage} /> : children}
      </CardContent>
    </Card>
  );
}
