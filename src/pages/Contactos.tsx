import { useMemo, useState } from "react";
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

/**
 * Estações no mapa interativo. `x`/`y` são percentagens dentro do contentor do
 * mapa, derivadas das coordenadas geográficas reais de cada cidade projectadas
 * no mesmo referencial do desenho SVG de Angola (viewBox 0 0 100 108,
 * lon 11.4–24.3 → x 0–100, lat -4.2–-18.3 → y 0–108).
 */
const estacoes = [
  { nome: "Sede Nacional — Luanda", cidade: "Luanda", provincia: "Luanda", sede: true, x: 14.3, y: 35.5,
    descricao: "Laboratórios centrais de referência, produção de vacinas e direcção-geral do Instituto." },
  { nome: "Estação Regional do Huambo", cidade: "Huambo", provincia: "Huambo", sede: false, x: 33.6, y: 65.7,
    descricao: "Planalto Central — diagnóstico veterinário e apoio directo à pecuária das terras altas." },
  { nome: "Estação Regional de Benguela", cidade: "Benguela", provincia: "Benguela", sede: false, x: 15.6, y: 64.2,
    descricao: "Litoral Sul — vigilância epidemiológica e apoio à avicultura do corredor de Benguela." },
  { nome: "Estação Regional do Lubango", cidade: "Lubango", provincia: "Huíla", sede: false, x: 16.2, y: 82.1,
    descricao: "Região Sul — sanidade do efectivo bovino e campanhas de vacinação transumante." },
  { nome: "Estação Regional do Uíge", cidade: "Uíge", provincia: "Uíge", sede: false, x: 28.4, y: 26.1,
    descricao: "Região Norte — controlo da tripanossomose e apoio à pecuária familiar." },
  { nome: "Estação Regional de Malanje", cidade: "Malanje", provincia: "Malanje", sede: false, x: 38.3, y: 40.9,
    descricao: "Centro-Norte — análises laboratoriais de campo e extensão rural." },
  { nome: "Estação Regional do Cuanza Sul", cidade: "Sumbe", provincia: "Cuanza Sul", sede: false, x: 18.9, y: 53.7,
    descricao: "Litoral Centro — inspecção sanitária e apoio à produção leiteira." },
];

/** Contorno simplificado de Angola (continente + enclave de Cabinda), no viewBox 0 0 100 108. */
const ANGOLA_MAINLAND =
  "M6.6,14.6 L15.5,12.7 L40.3,13.0 L43.0,22.2 L47.7,29.9 L61.6,28.7 L62.8,21.4 L71.3,21.1 " +
  "L72.5,23.7 L81.0,23.7 L81.4,32.2 L80.2,40.6 L83.7,44.4 L84.5,52.5 L97.3,51.7 L98.1,55.2 " +
  "L96.9,62.8 L98.1,65.9 L96.9,67.4 L81.8,67.4 L81.8,90.8 L83.3,95.0 L93.4,102.6 L77.5,105.7 " +
  "L58.9,104.6 L19.8,101.1 L14.0,97.7 L8.9,100.0 L2.7,100.0 L2.9,91.9 L5.8,84.3 L7.4,78.9 " +
  "L14.0,66.6 L15.5,62.8 L18.6,58.2 L19.0,53.6 L16.3,47.5 L14.3,41.4 L14.0,35.2 L12.2,30.6 " +
  "L12.8,26.0 L9.3,20.7 Z";
const ANGOLA_CABINDA =
  "M4.8,6.1 L6.2,1.5 L10.1,1.7 L13.0,3.4 L11.6,6.9 L7.8,11.5 Z";

export default function Contactos() {
  const { t } = useTranslation("contactos");
  const shouldReduceMotion = useReducedMotion();
  const { mutateAsync: submitMessage, isPending: submitting } = useSubmitContactMessage();

  // Estação seleccionada no mapa interativo (painel de detalhe à esquerda).
  const [estacaoIdx, setEstacaoIdx] = useState(0);
  const estacaoActiva = estacoes[estacaoIdx];

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

      {/* Estações regionais — mapa interativo de Angola */}
      <section className="section-divider py-24 bg-accent/30 overflow-hidden">
        <div className="container">
          <div className="mb-12 max-w-2xl">
            <p className="kicker text-[hsl(var(--iiv-gold-text))]"><span className="editorial-rule mr-3" /> {t("estacoes.kicker")}</p>
            <h2 className="font-serif text-3xl md:text-4xl mt-5 leading-tight">{t("estacoes.title")}</h2>
            <p className="mt-4 text-muted-foreground">{t("estacoes.lead")}</p>
          </div>

          <motion.div
            className="grid gap-10 lg:grid-cols-12 items-center"
            initial={shouldReduceMotion ? undefined : "hidden"}
            whileInView={shouldReduceMotion ? undefined : "visible"}
            viewport={{ once: true, amount: 0.2 }}
            variants={shouldReduceMotion ? undefined : staggerContainer}
          >
            {/* Painel de informação — à esquerda */}
            <motion.div
              className="lg:col-span-5 order-2 lg:order-1"
              variants={shouldReduceMotion ? undefined : fadeInUp}
            >
              <div
                key={estacaoActiva.nome}
                className="relative overflow-hidden rounded-3xl border border-border/60 bg-card p-8 shadow-xl animate-fade-up"
                aria-live="polite"
              >
                <div className="absolute -top-14 -right-14 h-40 w-40 rounded-full bg-[hsl(var(--iiv-gold))]/10 blur-3xl" />
                <div className="relative flex items-center gap-3 mb-5">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-lg text-primary-foreground ${estacaoActiva.sede ? "gradient-gold !text-secondary-foreground" : "gradient-green-soft"}`}>
                    <MapPin className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <span className="inline-flex items-center rounded-full bg-[hsl(var(--iiv-gold-light))] dark:bg-accent px-3 py-1 kicker text-[hsl(var(--iiv-gold-text))]">
                    {estacaoActiva.sede ? "Sede Nacional" : "Estação Regional"}
                  </span>
                </div>
                <h3 className="relative font-serif text-2xl md:text-3xl leading-tight">{estacaoActiva.nome}</h3>
                <p className="relative text-sm text-muted-foreground mt-1 uppercase tracking-wider">
                  {estacaoActiva.cidade} · Província de {estacaoActiva.provincia}
                </p>
                <p className="relative mt-4 text-muted-foreground leading-relaxed">{estacaoActiva.descricao}</p>

                {/* Selecção rápida (e alternativa acessível ao mapa) */}
                <div className="relative mt-7 flex flex-wrap gap-2 border-t border-border/50 pt-5">
                  {estacoes.map((e, i) => (
                    <button
                      key={e.nome}
                      type="button"
                      onClick={() => setEstacaoIdx(i)}
                      aria-pressed={i === estacaoIdx}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                        i === estacaoIdx
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      }`}
                    >
                      {e.cidade}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Mapa de Angola — à direita */}
            <motion.div
              className="lg:col-span-7 order-1 lg:order-2"
              variants={shouldReduceMotion ? undefined : fadeInUp}
            >
              <div className="relative mx-auto max-w-[540px] aspect-[100/108]" role="group" aria-label="Mapa de Angola com as estações do IIV">
                <svg
                  viewBox="0 0 100 108"
                  preserveAspectRatio="none"
                  className="absolute inset-0 h-full w-full"
                  aria-hidden="true"
                >
                  <path
                    d={ANGOLA_MAINLAND}
                    className="fill-[hsl(var(--iiv-green-light))] dark:fill-accent stroke-[hsl(var(--iiv-green))]/50"
                    strokeWidth="0.4"
                    strokeLinejoin="round"
                  />
                  <path
                    d={ANGOLA_CABINDA}
                    className="fill-[hsl(var(--iiv-green-light))] dark:fill-accent stroke-[hsl(var(--iiv-green))]/50"
                    strokeWidth="0.4"
                    strokeLinejoin="round"
                  />
                </svg>

                {estacoes.map((e, i) => {
                  const activa = i === estacaoIdx;
                  return (
                    <button
                      key={e.nome}
                      type="button"
                      onClick={() => setEstacaoIdx(i)}
                      aria-label={`${e.nome} — ver informação`}
                      aria-pressed={activa}
                      style={{ left: `${e.x}%`, top: `${e.y}%` }}
                      className="group absolute -translate-x-1/2 -translate-y-1/2 p-2 focus:outline-none"
                    >
                      {activa && !shouldReduceMotion && (
                        <span className={`absolute inset-1 rounded-full animate-ping opacity-40 ${e.sede ? "bg-[hsl(var(--iiv-gold))]" : "bg-primary"}`} />
                      )}
                      <span
                        className={`relative block rounded-full border-2 border-background shadow-lg transition-all duration-300 group-hover:scale-125 group-focus-visible:ring-2 group-focus-visible:ring-ring ${
                          activa ? "h-5 w-5" : "h-3.5 w-3.5"
                        } ${e.sede ? "gradient-gold" : activa ? "gradient-green" : "bg-primary/70"}`}
                      />
                      <span
                        className={`absolute left-1/2 top-full -translate-x-1/2 mt-0.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold transition-opacity ${
                          activa
                            ? "bg-primary text-primary-foreground opacity-100"
                            : "bg-card/90 text-foreground border border-border/60 opacity-0 group-hover:opacity-100"
                        }`}
                      >
                        {e.cidade}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
