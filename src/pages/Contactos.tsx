import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import type { TFunction } from "i18next";
import { motion, useReducedMotion } from "framer-motion";
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";
import { PageHero } from "@/components/layout/PageHero";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { SEO } from "@/components/SEO";
import { useSubmitContactMessage } from "@/hooks/queries/useContactMessages";
import type { ApiError } from "@/lib/http";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import i18n from "@/i18n";
import ptContactos from "@/i18n/locales/pt/public/contactos.json";
import enContactos from "@/i18n/locales/en/public/contactos.json";
import contactosHeroOffice from "@/assets/contactos/contactos-hero-office.webp";

// Namespace "contactos" não faz parte do bundle central (src/i18n/index.ts,
// que só regista "common"/"nav"). Registamo-lo aqui em runtime para manter
// esta página autónoma sem tocar na configuração global do i18next.
if (!i18n.hasResourceBundle("pt", "contactos")) i18n.addResourceBundle("pt", "contactos", ptContactos, true, true);
if (!i18n.hasResourceBundle("en", "contactos")) i18n.addResourceBundle("en", "contactos", enContactos, true, true);

/**
 * Schema zod construído com `t()` para que as mensagens de validação sigam o
 * idioma activo. Reconstruído por render (via `useMemo` dependente de `t`),
 * custo desprezável para um formulário validado apenas no submit.
 */
function buildContactSchema(t: TFunction) {
  return z.object({
    nome: z.string().trim().min(2, t("validation.nomeCurto")).max(100),
    email: z.string().trim().email(t("validation.emailInvalido")).max(255),
    assunto: z.string().trim().min(2, t("validation.assuntoCurto")).max(200),
    mensagem: z.string().trim().min(5, t("validation.mensagemCurta")).max(2000),
  });
}

const estacoes = [
  { nome: "Estação Regional do Huambo", cidade: "Huambo" },
  { nome: "Estação Regional de Benguela", cidade: "Benguela" },
  { nome: "Estação Regional do Lubango", cidade: "Huíla" },
  { nome: "Estação Regional do Uíge", cidade: "Uíge" },
  { nome: "Estação Regional de Malanje", cidade: "Malanje" },
  { nome: "Estação Regional do Cuanza Sul", cidade: "Sumbe" },
];

export default function Contactos() {
  const { t } = useTranslation("contactos");
  const shouldReduceMotion = useReducedMotion();
  const { mutateAsync: submitMessage, isPending: submitting } = useSubmitContactMessage();

  const contactSchema = useMemo(() => buildContactSchema(t), [t]);

  const contactos = useMemo(
    () => [
      { icon: MapPin, label: t("contactLabels.morada"), value: "Rua do IIV, Luanda, Angola" },
      { icon: Phone, label: t("contactLabels.telefone"), value: "+244 222 000 000" },
      { icon: Mail, label: t("contactLabels.email"), value: "info@iiv.gov.ao" },
      { icon: Clock, label: t("contactLabels.horario"), value: "Segunda a Sexta, 08:00 — 16:00" },
    ],
    [t],
  );

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const formData = new FormData(formEl);
    const raw = {
      nome: String(formData.get("nome") || ""),
      email: String(formData.get("email") || ""),
      assunto: String(formData.get("assunto") || ""),
      mensagem: String(formData.get("mensagem") || ""),
    };
    const parsed = contactSchema.safeParse(raw);
    if (!parsed.success) {
      toast({
        title: t("toast.validationTitle"),
        description: parsed.error.errors[0]?.message ?? t("toast.validationFallback"),
        variant: "destructive",
      });
      return;
    }

    try {
      // Cast: nesta versão do zod (3.25.x) o tipo inferido de `safeParse().data`
      // marca incorrectamente todos os campos como opcionais mesmo sem
      // refinements (reproduzido isoladamente fora deste ficheiro) — em
      // runtime, após `parsed.success`, os 4 campos estão sempre presentes.
      await submitMessage(parsed.data as typeof raw);
      // NOTA: a notificação por e-mail à equipa (hoje feita, em produção, pela
      // edge function Supabase `send-transactional-email`) passa a ser
      // responsabilidade do backend Laravel (Fase 4), disparada ao processar
      // este POST. O endpoint mock não simula esse envio.
      formEl.reset();
      toast({ title: t("toast.successTitle"), description: t("toast.successDescription") });
    } catch (error) {
      const apiError = error as ApiError;
      toast({
        title: t("toast.errorTitle"),
        description: apiError?.message,
        variant: "destructive",
      });
    }
  }

  return (
    <>
      <SEO title={t("seo.title")} description={t("seo.description")} path="/contactos" />
      <PageHero
        kicker={t("hero.kicker")}
        title={t("hero.title")}
        lead={t("hero.lead")}
        image={contactosHeroOffice}
        breadcrumb={[{ label: t("hero.breadcrumb") }]}
      />

      {/* Form + info */}
      <section className="py-24">
        <div className="container">
          <motion.div
            className="grid gap-12 lg:grid-cols-12"
            initial={shouldReduceMotion ? undefined : "hidden"}
            animate={shouldReduceMotion ? undefined : "visible"}
            variants={shouldReduceMotion ? undefined : staggerContainer}
          >
            {/* FORM */}
            <motion.div
              className="lg:col-span-7 rounded-2xl border border-border/60 bg-card shadow-xl p-8 md:p-10"
              variants={shouldReduceMotion ? undefined : fadeInUp}
            >
              <p className="kicker text-[hsl(var(--iiv-gold-text))]"><span className="editorial-rule mr-3" /> {t("form.kicker")}</p>
              <h2 className="font-serif text-3xl md:text-4xl mt-5 leading-tight">{t("form.title")}</h2>
              <p className="mt-4 text-muted-foreground">{t("form.lead")}</p>

              <form className="mt-10 space-y-5" onSubmit={onSubmit}>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="nome">{t("form.labels.nome")}</Label>
                    <Input id="nome" name="nome" required placeholder={t("form.placeholders.nome")} className="h-11 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t("form.labels.email")}</Label>
                    <Input id="email" name="email" type="email" required placeholder={t("form.placeholders.email")} className="h-11 rounded-xl" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assunto">{t("form.labels.assunto")}</Label>
                  <Input id="assunto" name="assunto" required placeholder={t("form.placeholders.assunto")} className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mensagem">{t("form.labels.mensagem")}</Label>
                  <Textarea id="mensagem" name="mensagem" required rows={6} placeholder={t("form.placeholders.mensagem")} className="rounded-xl" />
                </div>
                <Button type="submit" disabled={submitting} size="lg" className="h-12 rounded-xl px-6 text-sm font-semibold">
                  {submitting ? t("form.submitting") : (<>{t("form.submit")} <Send className="ml-2 h-4 w-4" /></>)}
                </Button>
              </form>
            </motion.div>

            {/* INFO */}
            <motion.aside
              className="lg:col-span-5 lg:pl-8 space-y-6"
              variants={shouldReduceMotion ? undefined : fadeInUp}
            >
              <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
                <div className="gradient-green p-7 text-primary-foreground">
                  {/* --iiv-gold (não -text): este cartão usa gradient-green, fundo escuro. */}
                  <p className="kicker text-[hsl(var(--iiv-gold))]">{t("sidebar.kicker")}</p>
                  <h3 className="font-serif text-2xl mt-3 leading-tight">{t("sidebar.title")}</h3>
                </div>
                <ul className="divide-y divide-border/60">
                  {contactos.map((c) => (
                    <li key={c.label} className="p-5 flex items-start gap-4">
                      <div className="h-10 w-10 shrink-0 rounded-lg bg-accent text-primary flex items-center justify-center">
                        <c.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="kicker text-muted-foreground">{c.label}</p>
                        <p className="font-medium text-sm mt-1">{c.value}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.aside>
          </motion.div>
        </div>
      </section>

      {/* Mapa de localização */}
      <section className="section-divider py-20">
        <div className="container">
          <div className="mb-10 max-w-2xl">
            <p className="kicker text-[hsl(var(--iiv-gold-text))]"><span className="editorial-rule mr-3" /> {t("map.kicker")}</p>
            <h2 className="font-serif text-3xl md:text-4xl mt-5 leading-tight">{t("map.title")}</h2>
            <p className="mt-4 text-muted-foreground">{t("map.lead")}</p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border/60 shadow-elegant">
            <iframe
              title={t("map.iframeTitle")}
              src="https://www.openstreetmap.org/export/embed.html?bbox=13.20%2C-8.85%2C13.30%2C-8.78&layer=mapnik&marker=-8.815%2C13.246"
              loading="lazy"
              className="w-full h-[420px] border-0"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <p className="mt-3 text-xs text-muted-foreground text-center">
            {t("map.copyright")}{" "}
            <a
              href="https://www.openstreetmap.org/?mlat=-8.815&mlon=13.246#map=14/-8.815/13.246"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              {t("map.viewFull")}
            </a>
          </p>
        </div>
      </section>

      {/* Estações regionais */}
      <section className="section-divider py-24 bg-accent/30">
        <div className="container">
          <div className="mb-12 max-w-2xl">
            <p className="kicker text-[hsl(var(--iiv-gold-text))]"><span className="editorial-rule mr-3" /> {t("estacoes.kicker")}</p>
            <h2 className="font-serif text-3xl md:text-4xl mt-5 leading-tight">{t("estacoes.title")}</h2>
            <p className="mt-4 text-muted-foreground">{t("estacoes.lead")}</p>
          </div>
          <motion.div
            className="grid gap-px bg-border rounded-2xl overflow-hidden border border-border/60 sm:grid-cols-2 lg:grid-cols-3"
            initial={shouldReduceMotion ? undefined : "hidden"}
            whileInView={shouldReduceMotion ? undefined : "visible"}
            viewport={{ once: true, amount: 0.2 }}
            variants={shouldReduceMotion ? undefined : staggerContainer}
          >
            {estacoes.map((e) => (
              <motion.div
                key={e.nome}
                className="group bg-card p-6 hover:bg-accent/20 transition-colors duration-300"
                variants={shouldReduceMotion ? undefined : fadeInUp}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--iiv-gold-light))] dark:bg-accent mb-3.5 transition-transform duration-300 group-hover:scale-110">
                  <MapPin className="h-4.5 w-4.5 text-[hsl(var(--iiv-gold-text))]" />
                </div>
                <p className="font-serif text-lg leading-tight">{e.nome}</p>
                <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{e.cidade}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </>
  );
}
