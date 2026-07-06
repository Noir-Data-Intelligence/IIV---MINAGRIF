import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { PageHero } from "@/components/layout/PageHero";
import { SEO } from "@/components/SEO";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import heroInvestigacao from "@/assets/hero/hero-investigacao.jpg";

interface Noticia {
  id: string;
  slug: string;
  titulo: string;
  resumo: string | null;
  categoria: string;
  image_path: string | null;
  destaque: boolean;
  published_at: string | null;
  created_at: string;
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString("pt-AO", { day: "2-digit", month: "long", year: "numeric" });
}

const imageUrl = (path: string | null) =>
  path ? supabase.storage.from("noticias").getPublicUrl(path).data.publicUrl : heroInvestigacao;

export default function Noticias() {
  const [items, setItems] = useState<Noticia[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState("Todas");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("noticias")
        .select("id,slug,titulo,resumo,categoria,image_path,destaque,published_at,created_at")
        .eq("published", true)
        .order("destaque", { ascending: false })
        .order("published_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });
      setItems(data ?? []);
      setLoading(false);
    })();
  }, []);

  const categorias = ["Todas", ...Array.from(new Set(items.map((n) => n.categoria)))];
  const filtered = items.filter((n) => cat === "Todas" || n.categoria === cat);
  const destaque = filtered[0];
  const restantes = filtered.slice(1);

  return (
    <>
      <SEO
        title="Notícias"
        description="Notícias, campanhas e iniciativas do Instituto de Investigação Veterinária de Angola."
        path="/noticias"
      />
      <PageHero
        kicker="Sala de Imprensa"
        title="Notícias e actualizações institucionais."
        lead="Acompanhe os projectos, campanhas e iniciativas do Instituto de Investigação Veterinária."
        image={heroInvestigacao}
        breadcrumb={[{ label: "Notícias" }]}
      />

      <section className="py-10 border-b border-border/40">
        <div className="container">
          <div className="flex flex-wrap gap-2">
            {categorias.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={cn(
                  "rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors",
                  cat === c ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent",
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container space-y-16">
          {loading ? (
            <div className="grid gap-10 lg:grid-cols-12">
              <Skeleton className="lg:col-span-7 aspect-[16/10] rounded-2xl" />
              <div className="lg:col-span-5 space-y-4">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-20">Sem notícias para esta categoria.</p>
          ) : (
            <>
              {destaque && (
                <Link to={`/noticias/${destaque.slug}`} className="group grid gap-10 lg:grid-cols-12 items-center">
                  <div className="lg:col-span-7 overflow-hidden rounded-2xl">
                    <img
                      src={imageUrl(destaque.image_path)}
                      alt={destaque.titulo}
                      className="aspect-[16/10] w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <div className="lg:col-span-5">
                    <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-widest text-muted-foreground mb-4">
                      <span className="text-[hsl(var(--iiv-gold))]">{destaque.categoria}</span>
                      <span className="h-px w-4 bg-border" />
                      <time>{fmt(destaque.published_at ?? destaque.created_at)}</time>
                    </div>
                    <h2 className="font-serif text-3xl md:text-4xl leading-tight group-hover:text-primary transition-colors">
                      {destaque.titulo}
                    </h2>
                    {destaque.resumo && <p className="mt-5 text-muted-foreground leading-relaxed">{destaque.resumo}</p>}
                    <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                      Ler artigo <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              )}

              {restantes.length > 0 && (
                <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3 border-t border-border/40 pt-16">
                  {restantes.map((n) => (
                    <Link key={n.id} to={`/noticias/${n.slug}`} className="group">
                      <div className="aspect-[4/3] overflow-hidden rounded-xl bg-muted mb-5">
                        <img src={imageUrl(n.image_path)} alt={n.titulo} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                      </div>
                      <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
                        <span className="text-[hsl(var(--iiv-gold))]">{n.categoria}</span>
                        <span className="h-px w-4 bg-border" />
                        <time>{fmt(n.published_at ?? n.created_at)}</time>
                      </div>
                      <h3 className="font-serif text-xl leading-tight group-hover:text-primary transition-colors">{n.titulo}</h3>
                      {n.resumo && <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-2">{n.resumo}</p>}
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
