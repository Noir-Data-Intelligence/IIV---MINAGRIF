import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { SEO } from "@/components/SEO";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import heroInvestigacao from "@/assets/hero/hero-investigacao.jpg";

interface Noticia {
  id: string;
  slug: string;
  titulo: string;
  resumo: string | null;
  conteudo: string | null;
  categoria: string;
  image_path: string | null;
  published_at: string | null;
  created_at: string;
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString("pt-AO", { day: "2-digit", month: "long", year: "numeric" });
}

const imageUrl = (path: string | null) =>
  path ? supabase.storage.from("noticias").getPublicUrl(path).data.publicUrl : heroInvestigacao;

export default function NoticiaDetalhe() {
  const { slug } = useParams<{ slug: string }>();
  const [item, setItem] = useState<Noticia | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("noticias")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();
      if (!data) setNotFound(true);
      else setItem(data as Noticia);
      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="container py-20 max-w-4xl space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="aspect-[16/9] w-full rounded-2xl" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (notFound || !item) {
    return (
      <div className="container py-32 text-center">
        <SEO title="Notícia não encontrada" description="A notícia procurada não está disponível." path={`/noticias/${slug}`} />
        <h1 className="font-serif text-3xl mb-4">Notícia não encontrada</h1>
        <p className="text-muted-foreground mb-8">A notícia que procura pode ter sido removida ou não está publicada.</p>
        <Link to="/noticias" className="inline-flex items-center gap-2 text-primary font-semibold">
          <ArrowLeft className="h-4 w-4" /> Voltar às notícias
        </Link>
      </div>
    );
  }

  const paragrafos = (item.conteudo ?? "").split(/\n\s*\n/).filter(Boolean);

  return (
    <>
      <SEO
        title={item.titulo}
        description={item.resumo ?? `Notícia do IIV publicada em ${fmt(item.published_at ?? item.created_at)}.`}
        path={`/noticias/${item.slug}`}
        type="article"
        image={item.image_path ? imageUrl(item.image_path) : undefined}
      />

      <article className="pt-16 pb-24">
        <div className="container max-w-4xl">
          <Link to="/noticias" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8">
            <ArrowLeft className="h-4 w-4" /> Notícias
          </Link>

          <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-widest text-muted-foreground mb-4">
            <span className="text-[hsl(var(--iiv-gold))]">{item.categoria}</span>
            <span className="h-px w-4 bg-border" />
            <time>{fmt(item.published_at ?? item.created_at)}</time>
          </div>

          <h1 className="font-serif text-4xl md:text-5xl leading-tight mb-6">{item.titulo}</h1>
          {item.resumo && <p className="text-xl text-muted-foreground leading-relaxed mb-10">{item.resumo}</p>}

          <div className="aspect-[16/9] overflow-hidden rounded-2xl mb-12 bg-muted">
            <img src={imageUrl(item.image_path)} alt={item.titulo} className="h-full w-full object-cover" />
          </div>

          {paragrafos.length > 0 ? (
            <div className="prose prose-lg max-w-none">
              {paragrafos.map((p, i) => (
                <p key={i} className="text-foreground/90 leading-relaxed mb-6 whitespace-pre-wrap">{p}</p>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground italic">Conteúdo em preparação.</p>
          )}
        </div>
      </article>
    </>
  );
}
