import { PageHero } from "@/components/layout/PageHero";
import { SEO } from "@/components/SEO";
import heroLab from "@/assets/hero/hero-lab.jpg";

export default function Termos() {
  return (
    <>
      <SEO
        title="Termos de Uso"
        description="Termos e condições de utilização do portal do Instituto de Investigação Veterinária."
        path="/termos"
      />
      <PageHero
        kicker="Documentos Legais"
        title="Termos de Uso"
        lead="Condições aplicáveis à utilização do portal institucional do IIV."
        image={heroLab}
        breadcrumb={[{ label: "Termos" }]}
      />
      <section className="py-20">
        <div className="container max-w-3xl prose-sm space-y-8">
          <article>
            <h2 className="font-serif text-2xl mb-3">1. Âmbito</h2>
            <p className="text-muted-foreground leading-relaxed">
              Os presentes termos regulam o acesso e a utilização do portal do Instituto de Investigação Veterinária
              (IIV), entidade pública da República de Angola, tutelada pelo Ministério da Agricultura e Pescas.
            </p>
          </article>
          <article>
            <h2 className="font-serif text-2xl mb-3">2. Utilização permitida</h2>
            <p className="text-muted-foreground leading-relaxed">
              O conteúdo deste portal destina-se exclusivamente a fins informativos, educativos e de apoio ao sector
              veterinário nacional. É proibida a sua utilização para fins comerciais não autorizados, bem como
              qualquer tentativa de acesso indevido a áreas restritas.
            </p>
          </article>
          <article>
            <h2 className="font-serif text-2xl mb-3">3. Propriedade intelectual</h2>
            <p className="text-muted-foreground leading-relaxed">
              Todos os conteúdos publicados (textos, imagens, marcas, documentos) são propriedade do IIV ou dos
              respectivos titulares, encontrando-se protegidos pela legislação aplicável em matéria de direitos de
              autor e propriedade industrial.
            </p>
          </article>
          <article>
            <h2 className="font-serif text-2xl mb-3">4. Limitação de responsabilidade</h2>
            <p className="text-muted-foreground leading-relaxed">
              O IIV envida esforços para manter a informação actualizada, mas não garante a inexistência de erros
              nem se responsabiliza por decisões tomadas exclusivamente com base no conteúdo do portal sem
              consulta técnica formal.
            </p>
          </article>
          <article>
            <h2 className="font-serif text-2xl mb-3">5. Alterações</h2>
            <p className="text-muted-foreground leading-relaxed">
              O IIV reserva-se o direito de actualizar os presentes termos a qualquer momento. A versão em vigor é
              sempre a publicada neste endereço.
            </p>
          </article>
          <p className="text-xs text-muted-foreground mt-12">Última actualização: Maio de 2026.</p>
        </div>
      </section>
    </>
  );
}
