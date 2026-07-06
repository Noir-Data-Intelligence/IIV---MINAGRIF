/**
 * Preset fino sobre `ChartTooltipContent` (shadcn, já definido e funcional em
 * `@/components/ui/chart`). NÃO recria o tooltip do zero — reaproveita o layout,
 * indicador de cor e agrupamento por label do componente shadcn, e só acrescenta
 * formatação de valores numéricos consistente (pt-AO, via `chartTheme.formatAxisNumber`).
 *
 * Uso: <Tooltip content={<ChartTooltipCard />} /> dentro de um <ChartContainer config={...}>.
 * Para formatação diferente (ex: moeda), passa `valueFormatter={formatKwanza}`.
 */
import * as React from "react";
import { ChartTooltipContent } from "@/components/ui/chart";
import { formatAxisNumber } from "./chartTheme";

type ChartTooltipContentProps = React.ComponentProps<typeof ChartTooltipContent>;
type TooltipFormatter = NonNullable<ChartTooltipContentProps["formatter"]>;

export const ChartTooltipCard = React.forwardRef<
  HTMLDivElement,
  ChartTooltipContentProps & { valueFormatter?: (value: number) => string }
>(({ valueFormatter = formatAxisNumber, formatter, ...props }, ref) => {
  const defaultFormatter: TooltipFormatter = (value, name, item) => {
    const indicatorColor = item.payload?.fill ?? item.color;
    const label = typeof value === "number" ? valueFormatter(value) : String(value);
    return (
      <div className="flex w-full flex-1 flex-wrap items-center justify-between gap-2 leading-none">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 shrink-0 rounded-[2px]" style={{ backgroundColor: indicatorColor }} />
          <span className="text-muted-foreground">{name}</span>
        </div>
        <span className="font-mono font-medium tabular-nums text-foreground">{label}</span>
      </div>
    );
  };

  return <ChartTooltipContent ref={ref} formatter={formatter ?? defaultFormatter} {...props} />;
});
ChartTooltipCard.displayName = "ChartTooltipCard";
