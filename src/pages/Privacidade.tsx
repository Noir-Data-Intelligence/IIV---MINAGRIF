import { PageHero } from "@/components/layout/PageHero";
import { SEO } from "@/components/SEO";
import heroInvestigacao from "@/assets/hero/hero-investigacao.jpg";

export default function Privacidade() {
  return (
    <>
      <SEO
        title="Política de Privacidade"
        description="Como o IIV recolhe, utiliza e protege dados pessoais no portal institucional."
        path="/privacidade"
      />
      <PageHero
        kicker="Documentos Legais"
        title="Política de Privacidade"
        lead="Compromisso com a protecção dos dados pessoais dos utilizadores do portal."
        image={heroInvestigacao}
        breadcrumb={[{ label: "Privacidade" }]}
      />
      <section className="py-20">
        <div className="container max-w-3xl space-y-8">
          <article>
            <h2 className="font-serif text-2xl mb-3">1. Responsável pelo tratamento</h2>
            <p className="text-muted-foreground leading-relaxed">
              O Instituto de Investigação Veterinária (IIV) é o responsável pelo tratamento dos dados pessoais
              recolhidos através do presente portal.
            </p>
          </article>
          <article>
            <h2 className="font-serif text-2xl mb-3">2. Dados recolhidos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Recolhemos apenas os dados estritamente necessários: nome, e-mail e mensagem (no formulário de
              contacto); credenciais de acesso (na área restrita); e dados técnicos de navegação anonimizados
              (logs de acesso e endereço IP para fins de segurança).
            </p>
          </article>
          <article>
            <h2 className="font-serif text-2xl mb-3">3. Finalidade</h2>
            <p className="text-muted-foreground leading-relaxed">
              Os dados são utilizados para responder a pedidos, gerir os serviços laboratoriais, cumprir
              obrigações legais e melhorar a experiência de utilização do portal.
            </p>
          </article>
          <article>
            <h2 className="font-serif text-2xl mb-3">4. Conservação</h2>
            <p className="text-muted-foreground leading-relaxed">
              Os dados são conservados pelo tempo estritamente necessário ao cumprimento das finalidades para que
              foram recolhidos, ou pelos prazos exigidos por lei.
            </p>
          </article>
          <article>
            <h2 className="font-serif text-2xl mb-3">5. Direitos do titular</h2>
            <p className="text-muted-foreground leading-relaxed">
              O titular dos dados tem direito de acesso, rectificação, eliminação e oposição ao tratamento. Para
              exercer estes direitos, contacte-nos através do endereço <a href="mailto:info@iiv.gov.ao" className="text-primary underline">info@iiv.gov.ao</a>.
            </p>
          </article>
          <article>
            <h2 className="font-serif text-2xl mb-3">6. Segurança</h2>
            <p className="text-muted-foreground leading-relaxed">
              Adoptamos medidas técnicas e organizacionais adequadas para proteger os dados contra acessos não
              autorizados, perda, alteração ou divulgação indevida.
            </p>
          </article>
          <p className="text-xs text-muted-foreground mt-12">Última actualização: Maio de 2026.</p>
        </div>
      </section>
    </>
  );
}
