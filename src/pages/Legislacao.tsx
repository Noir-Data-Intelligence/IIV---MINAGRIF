import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { Download, Search, FileText } from "lucide-react";
import { PageHero } from "@/components/layout/PageHero";
import { SEO } from "@/components/SEO";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import heroInvestigacao from "@/assets/hero/hero-investigacao.jpg";

interface Item {
  id: string; num: string; slug: string; titulo: string;
  descricao: string | null; tipo: string; ano: string; pdf_path: string | null;
}

const tipos = ["Todos", "Lei", "Decreto", "Regulamento", "Norma", "Portaria"];

export default function Legislacao() {
  const [tipo, setTipo] = useState("Todos");
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("legislation")
        .select("*")
        .eq("published", true)
        .order("num");
      setItems((data as Item[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    return items.filter((l) => {
      const matchTipo = tipo === "Todos" || l.tipo === tipo;
      const matchQ = !q || l.titulo.toLowerCase().includes(q.toLowerCase()) || (l.descricao || "").toLowerCase().includes(q.toLowerCase());
      return matchTipo && matchQ;
    });
  }, [items, tipo, q]);

  const pdfUrl = (path: string) => supabase.storage.from("legislation").getPublicUrl(path).data.publicUrl;

  return (
    <>
      <SEO
        title="Legislação"
        description="Diplomas, normas e regulamentos aplicáveis à saúde animal e à actividade veterinária em Angola."
        path="/legislacao"
      />
      <PageHero
        kicker="Quadro Legal"
        title="Legislação e regulamentação do sector."
        lead="Diplomas, normas e regulamentos aplicáveis à saúde animal e ao exercício da actividade veterinária em Angola."
        image={heroInvestigacao}
        breadcrumb={[{ label: "Legislação" }]}
      />

      <section className="py-10 border-b border-border/40 bg-accent/20">
        <div className="container">
          <div className="flex flex-col lg:flex-row gap-6 lg:items-center lg:justify-between">
            <Tabs value={tipo} onValueChange={setTipo}>
              <TabsList className="bg-transparent p-0 gap-2 flex-wrap h-auto">
                {tipos.map((t) => (
                  <TabsTrigger
                    key={t}
                    value={t}
                    className="rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    {t}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Pesquisar legislação..."
                className="pl-9 h-11 rounded-xl"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container max-w-5xl">
          {loading ? (
            <div className="space-y-6">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground">Nenhum diploma encontrado.</p>
            </div>
          ) : (
            <ul>
              {filtered.map((l) => (
                <li key={l.id} className="grid grid-cols-12 gap-6 items-center py-8 border-b border-border/40 first:border-t group hover:bg-accent/20 transition-colors -mx-4 px-4 rounded-xl">
                  <div className="col-span-2">
                    <Link to={`/legislacao/${l.slug}`} className="block">
                      <p className="font-serif text-4xl md:text-5xl text-primary/30 group-hover:text-[hsl(var(--iiv-gold))] tracking-tight transition-colors">
                        {l.num}
                      </p>
                    </Link>
                  </div>
                  <div className="col-span-10 md:col-span-7">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="kicker text-[hsl(var(--iiv-gold))]">{l.tipo}</span>
                      <span className="font-mono text-[11px] text-muted-foreground">{l.ano}</span>
                    </div>
                    <Link to={`/legislacao/${l.slug}`}>
                      <h3 className="font-serif text-xl md:text-2xl leading-tight hover:text-primary transition-colors">{l.titulo}</h3>
                    </Link>
                    {l.descricao && <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{l.descricao}</p>}
                  </div>
                  <div className="col-span-12 md:col-span-3 md:text-right flex md:justify-end gap-4">
                    <Link to={`/legislacao/${l.slug}`} className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:gap-3 transition-all">
                      Ver detalhes
                    </Link>
                    {l.pdf_path && (
                      <a href={pdfUrl(l.pdf_path)} download target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-[hsl(var(--iiv-gold))] hover:gap-3 transition-all">
                        <Download className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
