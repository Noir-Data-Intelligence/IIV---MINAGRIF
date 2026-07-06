/**
 * Barrel export do preset de gráficos partilhado. O ChartContainer/ChartTooltip/ChartLegend
 * em si continuam a viver em @/components/ui/chart (shadcn) — importa-os de lá diretamente:
 *
 *   import { ChartContainer } from "@/components/ui/chart";
 *   import { chartColors, buildChartConfig, NoDataOverlay, ChartTooltipCard } from "@/components/charts";
 */
export {
  chartColors,
  getChartColor,
  chartTypography,
  axisTickStyle,
  legendWrapperStyle,
  buildChartConfig,
  formatAxisNumber,
  formatCompactNumber,
} from "./chartTheme";

export { ChartTooltipCard } from "./ChartTooltipCard";
export { NoDataOverlay } from "./NoDataOverlay";
export type { NoDataOverlayProps } from "./NoDataOverlay";
