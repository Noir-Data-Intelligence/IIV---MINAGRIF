import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageHero } from "@/components/layout/PageHero";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, FileText, ArrowLeft } from "lucide-react";
import heroInvestigacao from "@/assets/hero/hero-investigacao.jpg";

interface Item {
  id: string; num: string; slug: string; titulo: string;
  descricao: string | null; tipo: string; ano: string; pdf_path: string | null;
}

export default function LegislacaoDetalhe() {
  const { slug } = useParams<{ slug: string }>();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("legislation").select("*").eq("slug", slug!).eq("published", true).maybeSingle();
      if (!data) setNotFound(true);
      else setItem(data as Item);
      setLoading(false);
    })();
  }, [slug]);

  const pdfUrl = item?.pdf_path
    ? supabase.storage.from("legislation").getPublicUrl(item.pdf_path).data.publicUrl
    : null;

  if (loading) {
    return (
      <div className="container py-20 space-y-6">
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (notFound || !item) {
    return (
      <div className="container py-32 text-center">
        <h1 className="font-serif text-3xl mb-4">Diploma não encontrado</h1>
        <Button asChild variant="outline"><Link to="/legislacao"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar à legislação</Link></Button>
      </div>
    );
  }

  return (
    <>
      <SEO
        title={`${item.num} — ${item.titulo}`}
        description={item.descricao || `${item.tipo} de ${item.ano}: ${item.titulo}`}
        path={`/legislacao/${item.slug}`}
        type="article"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Legislation",
          name: item.titulo,
          legislationIdentifier: item.num,
          legislationType: item.tipo,
          datePublished: item.ano,
        }}
      />
      <PageHero
        kicker={`${item.tipo} • ${item.ano}`}
        title={item.titulo}
        lead={item.descricao || undefined}
        image={heroInvestigacao}
        breadcrumb={[{ label: "Legislação", href: "/legislacao" }, { label: item.num }]}
      />

      <section className="py-12 border-b border-border/40">
        <div className="container max-w-5xl flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="font-mono">Nº {item.num}</span>
            <span>•</span>
            <span className="kicker text-[hsl(var(--iiv-gold))]">{item.tipo}</span>
            <span>•</span>
            <span>{item.ano}</span>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline"><Link to="/legislacao"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar</Link></Button>
            {pdfUrl && (
              <Button asChild>
                <a href={pdfUrl} download target="_blank" rel="noreferrer">
                  <Download className="mr-2 h-4 w-4" /> Descarregar PDF
                </a>
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container max-w-5xl">
          {pdfUrl ? (
            <div className="rounded-2xl border border-border/60 overflow-hidden shadow-elegant bg-card">
              <iframe
                src={`${pdfUrl}#view=FitH`}
                title={item.titulo}
                className="w-full h-[80vh]"
              />
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/60 p-16 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Documento PDF ainda não disponível para este diploma.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
