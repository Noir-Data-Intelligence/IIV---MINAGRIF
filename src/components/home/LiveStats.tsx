import { Award, Package, Syringe, MapPin } from "lucide-react";
import { usePublicStats } from "@/hooks/queries/usePublicStats";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Stat { value: string; label: string; icon: typeof Award; }

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(".", ",")}k+`;
  return `${n}+`;
}

export function LiveStats() {
  const { data, isLoading } = usePublicStats();

  const stats: Stat[] = data
    ? [
        { value: `${data.anosExperiencia}+`, label: "Anos de experiência", icon: Award },
        { value: String(data.produtosPortfolio), label: "Produtos no portfólio", icon: Package },
        {
          value: data.dosesProduzidas > 0 ? formatNumber(data.dosesProduzidas) : "—",
          label: "Doses produzidas",
          icon: Syringe,
        },
        { value: String(data.estacoesRegionais), label: "Estações regionais", icon: MapPin },
      ]
    : [];

  return (
    <section className="relative -mt-16 z-20">
      <div className="container">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading || stats.length === 0
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-2xl bg-card border border-border/60 shadow-xl p-6 space-y-3">
                  <Skeleton className="h-11 w-11 rounded-xl" />
                  <Skeleton className="h-9 w-16" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ))
            : stats.map((s, i) => {
                const isHero = i === 0;
                return (
                  <div
                    key={s.label}
                    className={cn(
                      "group relative overflow-hidden rounded-2xl p-6 shadow-xl transition-all duration-300 hover:-translate-y-1",
                      isHero
                        ? "gradient-green-gold text-primary-foreground shadow-2xl"
                        : "bg-card border border-border/60 hover:shadow-2xl",
                    )}
                  >
                    {isHero && (
                      <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-[hsl(var(--iiv-gold))]/25 blur-2xl" />
                    )}
                    <div
                      className={cn(
                        "relative flex h-11 w-11 items-center justify-center rounded-xl mb-4",
                        isHero ? "bg-white/15 backdrop-blur-sm" : "bg-[hsl(var(--iiv-gold-light))] dark:bg-accent",
                      )}
                    >
                      <s.icon className={cn("h-5 w-5", isHero ? "text-primary-foreground" : "text-[hsl(var(--iiv-gold-text))]")} strokeWidth={1.75} />
                    </div>
                    <p className={cn("relative font-serif text-3xl md:text-4xl leading-none", !isHero && "text-foreground")}>
                      {s.value}
                    </p>
                    <p className={cn("relative kicker mt-2.5 text-[10px]", isHero ? "text-primary-foreground/75" : "text-muted-foreground")}>
                      {s.label}
                    </p>
                  </div>
                );
              })}
        </div>
        <p className="mt-4 text-center text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[hsl(var(--iiv-gold))] mr-2 animate-pulse" />
          Dados actualizados em tempo real
        </p>
      </div>
    </section>
  );
}
