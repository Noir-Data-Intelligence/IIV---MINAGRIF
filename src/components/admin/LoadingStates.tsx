import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function KPISkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
      {[...Array(count)].map((_, i) => (
        <Card key={i} className="shadow-elegant border-border/50 rounded-xl overflow-hidden">
          <CardContent className="p-5 space-y-3">
            <div className="flex justify-between items-start">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function CardSkeleton({ height = 280 }: { height?: number }) {
  return (
    <Card className="shadow-elegant border-border/50 rounded-xl">
      <CardContent className="p-5 space-y-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="w-full" style={{ height }} />
      </CardContent>
    </Card>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          {[...Array(cols)].map((_, j) => (
            <Skeleton key={j} className={j === 0 ? "h-4 w-4 rounded" : j === cols - 1 ? "h-4 w-16" : "h-4 flex-1"} />
          ))}
        </div>
      ))}
    </div>
  );
}
