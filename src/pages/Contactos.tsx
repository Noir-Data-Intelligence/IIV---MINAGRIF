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
import { ANGOLA_PROVINCES, ANGOLA_VIEWBOX } from "@/data/angola-provinces";
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
 * Estações do IIV ligadas às províncias do mapa real (nova divisão
 * administrativa de 21 províncias — ver src/data/angola-provinces.ts).
 * O marcador de cada estação é ancorado no centróide da respectiva província.
 */
const estacoes = [
  { provinciaId: "luanda", nome: "Sede Nacional — Luanda", cidade: "Luanda", provincia: "Luanda", sede: true,
    descricao: "Laboratórios centrais de referência, produção de vacinas e direcção-geral do Instituto." },
  { provinciaId: "huambo", nome: "Estação Regional do Huambo", cidade: "Huambo", provincia: "Huambo", sede: false,
    descricao: "Planalto Central — diagnóstico veterinário e apoio directo à pecuária das terras altas." },
  { provinciaId: "benguela", nome: "Estação Regional de Benguela", cidade: "Benguela", provincia: "Benguela", sede: false,
    descricao: "Litoral Sul — vigilância epidemiológica e apoio à avicultura do corredor de Benguela." },
  { provinciaId: "huila", nome: "Estação Regional do Lubango", cidade: "Lubango", provincia: "Huíla", sede: false,
    descricao: "Região Sul — sanidade do efectivo bovino e campanhas de vacinação transumante." },
  { provinciaId: "uige", nome: "Estação Regional do Uíge", cidade: "Uíge", provincia: "Uíge", sede: false,
    descricao: "Região Norte — controlo da tripanossomose e apoio à pecuária familiar." },
  { provinciaId: "malanje", nome: "Estação Regional de Malanje", cidade: "Malanje", provincia: "Malanje", sede: false,
    descricao: "Centro-Norte — análises laboratoriais de campo e extensão rural." },
  { provinciaId: "cuanza-sul", nome: "Estação Regional do Cuanza Sul", cidade: "Sumbe", provincia: "Cuanza Sul", sede: false,
    descricao: "Litoral Centro — inspecção sanitária e apoio à produção leiteira." },
];

const estacaoPorProvincia = new Map(estacoes.map((e) => [e.provinciaId, e]));

export default function Contactos() {
  const { t } = useTranslation("contactos");
  const shouldReduceMotion = useReducedMotion();
  const { mutateAsync: submitMessage, isPending: submitting } = useSubmitContactMessage();

  // Província seleccionada no mapa interativo (painel de detalhe à esquerda).
  // Se a província tiver estação do IIV mostra-a; senão mostra nota de cobertura.
  const [provinciaId, setProvinciaId] = useState("luanda");
  const provinciaActiva = ANGOLA_PROVINCES.find((p) => p.id === provinciaId)!;
  const estacaoActiva = estacaoPorProvincia.get(provinciaId) ?? null;

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

      {/* Estações regionais — mapa interativo de Angola (21 províncias) */}
      <section className="py-24 bg-accent/30 overflow-hidden">
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
                key={provinciaId}
                className="relative overflow-hidden rounded-3xl border border-border/60 bg-card p-8 shadow-xl animate-fade-up"
                aria-live="polite"
              >
                <div className="absolute -top-14 -right-14 h-40 w-40 rounded-full bg-[hsl(var(--iiv-gold))]/10 blur-3xl" />
                {estacaoActiva ? (
                  <>
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
                  </>
                ) : (
                  <>
                    <div className="relative flex items-center gap-3 mb-5">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-lg bg-muted text-muted-foreground">
                        <MapPin className="h-5 w-5" strokeWidth={1.75} />
                      </div>
                      <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 kicker text-muted-foreground">
                        Província
                      </span>
                    </div>
                    <h3 className="relative font-serif text-2xl md:text-3xl leading-tight">{provinciaActiva.name}</h3>
                    <p className="relative mt-4 text-muted-foreground leading-relaxed">
                      Sem estação própria — esta província é coberta pela estação regional mais próxima da rede do IIV.
                    </p>
                  </>
                )}

                {/* Selecção rápida (e alternativa acessível ao mapa) */}
                <div className="relative mt-7 flex flex-wrap gap-2 border-t border-border/50 pt-5">
                  {estacoes.map((e) => (
                    <button
                      key={e.provinciaId}
                      type="button"
                      onClick={() => setProvinciaId(e.provinciaId)}
                      aria-pressed={e.provinciaId === provinciaId}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                        e.provinciaId === provinciaId
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

            {/* Mapa de Angola — à direita, com as 21 províncias e nomes */}
            <motion.div
              className="lg:col-span-7 order-1 lg:order-2"
              variants={shouldReduceMotion ? undefined : fadeInUp}
            >
              <svg
                viewBox={ANGOLA_VIEWBOX}
                className="mx-auto h-auto w-full max-w-[620px]"
                role="group"
                aria-label="Mapa de Angola — 21 províncias; seleccione uma para ver a informação"
              >
                {ANGOLA_PROVINCES.map((p) => {
                  const temEstacao = estacaoPorProvincia.has(p.id);
                  const sede = estacaoPorProvincia.get(p.id)?.sede ?? false;
                  const activa = p.id === provinciaId;
                  return (
                    <path
                      key={p.id}
                      d={p.d}
                      tabIndex={0}
                      role="button"
                      aria-label={temEstacao ? `${p.name} — estação do IIV` : p.name}
                      aria-pressed={activa}
                      onClick={() => setProvinciaId(p.id)}
                      onKeyDown={(ev) => {
                        if (ev.key === "Enter" || ev.key === " ") {
                          ev.preventDefault();
                          setProvinciaId(p.id);
                        }
                      }}
                      className={`cursor-pointer outline-none transition-colors duration-200 stroke-background focus-visible:stroke-ring ${
                        activa
                          ? sede
                            ? "fill-[hsl(var(--iiv-gold))]"
                            : "fill-[hsl(var(--iiv-green))]"
                          : temEstacao
                          ? "fill-[hsl(var(--iiv-green))]/35 hover:fill-[hsl(var(--iiv-green))]/55"
                          : "fill-[hsl(var(--iiv-green-light))] dark:fill-accent hover:fill-[hsl(var(--iiv-green))]/20"
                      }`}
                      strokeWidth={2}
                      strokeLinejoin="round"
                    />
                  );
                })}

                {/* Nomes das 21 províncias (centróides) */}
                {ANGOLA_PROVINCES.map((p) => {
                  const activa = p.id === provinciaId;
                  return (
                    <text
                      key={`label-${p.id}`}
                      x={p.cx}
                      y={p.cy}
                      textAnchor="middle"
                      paintOrder="stroke"
                      strokeLinejoin="round"
                      className={`pointer-events-none select-none font-sans text-[15px] font-semibold ${
                        activa
                          ? "fill-primary-foreground stroke-transparent"
                          : "fill-foreground/75 stroke-[hsl(var(--background))] [stroke-width:3px]"
                      }`}
                    >
                      {p.name}
                    </text>
                  );
                })}

                {/* Marcadores das estações (centróide da província) */}
                {estacoes.map((e) => {
                  const p = ANGOLA_PROVINCES.find((pp) => pp.id === e.provinciaId)!;
                  const activa = e.provinciaId === provinciaId;
                  return (
                    <g key={`marker-${e.provinciaId}`} className="pointer-events-none" transform={`translate(${p.cx} ${p.cy - 22})`}>
                      {activa && (
                        <circle r={11} className={`${e.sede ? "fill-[hsl(var(--iiv-gold))]/25" : "fill-primary/25"}`} />
                      )}
                      <circle
                        r={activa ? 7 : 5}
                        className={`stroke-background [stroke-width:2.5px] transition-all ${e.sede ? "fill-[hsl(var(--iiv-gold))]" : "fill-[hsl(var(--iiv-green))]"}`}
                      />
                    </g>
                  );
                })}
              </svg>

              <p className="mt-3 flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--iiv-gold))]" /> Sede Nacional</span>
                <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--iiv-green))]" /> Estação Regional</span>
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

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
    </>
  );
}
