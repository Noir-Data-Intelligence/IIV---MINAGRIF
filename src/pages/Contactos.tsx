import { useState } from "react";
import { z } from "zod";
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";
import { PageHero } from "@/components/layout/PageHero";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import heroCampo from "@/assets/hero/hero-campo.jpg";

const contactSchema = z.object({
  nome: z.string().trim().min(2, "Nome demasiado curto").max(100),
  email: z.string().trim().email("Email inválido").max(255),
  assunto: z.string().trim().min(2, "Assunto demasiado curto").max(200),
  mensagem: z.string().trim().min(5, "Mensagem demasiado curta").max(2000),
});

const contactos = [
  { icon: MapPin, label: "Morada", value: "Rua do IIV, Luanda, Angola" },
  { icon: Phone, label: "Telefone", value: "+244 222 000 000" },
  { icon: Mail, label: "Email", value: "info@iiv.gov.ao" },
  { icon: Clock, label: "Horário", value: "Segunda a Sexta, 08:00 — 16:00" },
];

const estacoes = [
  { nome: "Estação Regional do Huambo", cidade: "Huambo" },
  { nome: "Estação Regional de Benguela", cidade: "Benguela" },
  { nome: "Estação Regional do Lubango", cidade: "Huíla" },
  { nome: "Estação Regional do Uíge", cidade: "Uíge" },
  { nome: "Estação Regional de Malanje", cidade: "Malanje" },
  { nome: "Estação Regional do Cuanza Sul", cidade: "Sumbe" },
];

export default function Contactos() {
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const raw = {
      nome: String(formData.get("nome") || ""),
      email: String(formData.get("email") || ""),
      assunto: String(formData.get("assunto") || ""),
      mensagem: String(formData.get("mensagem") || ""),
    };
    const parsed = contactSchema.safeParse(raw);
    if (!parsed.success) {
      toast({
        title: "Verifique os campos",
        description: parsed.error.errors[0]?.message ?? "Dados inválidos",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    const id = crypto.randomUUID();
    const { nome, email, assunto, mensagem } = parsed.data;
    const { error } = await supabase
      .from("contact_messages")
      .insert([{ id, nome, email, assunto, mensagem }]);

    if (error) {
      setSubmitting(false);
      toast({ title: "Erro ao enviar", description: error.message, variant: "destructive" });
      return;
    }

    // Notificação por e-mail à equipa (silencioso se ainda não configurado)
    try {
      await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "contact-team-notification",
          recipientEmail: "info@iiv.gov.ao",
          idempotencyKey: `contact-${id}`,
          templateData: parsed.data,
        },
      });
    } catch {
      // O e-mail de notificação é opcional; mensagem já foi guardada
    }

    setSubmitting(false);
    (e.target as HTMLFormElement).reset();
    toast({ title: "Mensagem enviada", description: "Entraremos em contacto brevemente." });
  }


  return (
    <>
      <SEO
        title="Contactos"
        description="Envie-nos uma mensagem, consulte horários, contactos e estações regionais do Instituto de Investigação Veterinária de Angola."
        path="/contactos"
      />
      <PageHero
        kicker="Fale Connosco"
        title="Entre em contacto com o Instituto."
        lead="Esclareça dúvidas, solicite análises ou inicie uma parceria com o IIV."
        image={heroCampo}
        breadcrumb={[{ label: "Contactos" }]}
      />

      {/* Form + info */}
      <section className="py-24">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-12">
            {/* FORM */}
            <div className="lg:col-span-7">
              <p className="kicker text-[hsl(var(--iiv-gold))]"><span className="editorial-rule mr-3" /> Mensagem</p>
              <h2 className="font-serif text-3xl md:text-4xl mt-5 leading-tight">Envie-nos uma mensagem</h2>
              <p className="mt-4 text-muted-foreground">Resposta em até dois dias úteis.</p>

              <form className="mt-10 space-y-5" onSubmit={onSubmit}>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome</Label>
                    <Input id="nome" required placeholder="O seu nome" className="h-11 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" required placeholder="seu@email.com" className="h-11 rounded-xl" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assunto">Assunto</Label>
                  <Input id="assunto" required placeholder="Assunto da mensagem" className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mensagem">Mensagem</Label>
                  <Textarea id="mensagem" required rows={6} placeholder="Escreva a sua mensagem..." className="rounded-xl" />
                </div>
                <Button type="submit" disabled={submitting} size="lg" className="h-12 rounded-xl px-6 text-sm font-semibold">
                  {submitting ? "A enviar..." : (<>Enviar mensagem <Send className="ml-2 h-4 w-4" /></>)}
                </Button>
              </form>
            </div>

            {/* INFO */}
            <aside className="lg:col-span-5 lg:pl-8 space-y-6">
              <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
                <div className="gradient-green p-7 text-primary-foreground">
                  <p className="kicker text-[hsl(var(--iiv-gold))]">Sede</p>
                  <h3 className="font-serif text-2xl mt-3 leading-tight">Instituto de Investigação Veterinária</h3>
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
            </aside>
          </div>
        </div>
      </section>

      {/* Mapa de localização */}
      <section className="section-divider py-20">
        <div className="container">
          <div className="mb-10 max-w-2xl">
            <p className="kicker text-[hsl(var(--iiv-gold))]"><span className="editorial-rule mr-3" /> Como chegar</p>
            <h2 className="font-serif text-3xl md:text-4xl mt-5 leading-tight">A nossa localização</h2>
            <p className="mt-4 text-muted-foreground">
              Sede do Instituto em Luanda. Visitas técnicas mediante marcação prévia.
            </p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border/60 shadow-elegant">
            <iframe
              title="Mapa da sede do IIV em Luanda"
              src="https://www.openstreetmap.org/export/embed.html?bbox=13.20%2C-8.85%2C13.30%2C-8.78&layer=mapnik&marker=-8.815%2C13.246"
              loading="lazy"
              className="w-full h-[420px] border-0"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <p className="mt-3 text-xs text-muted-foreground text-center">
            Mapa: © OpenStreetMap contributors —{" "}
            <a
              href="https://www.openstreetmap.org/?mlat=-8.815&mlon=13.246#map=14/-8.815/13.246"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              ver mapa completo
            </a>
          </p>
        </div>
      </section>

      {/* Estações regionais */}
      <section className="section-divider py-24 bg-accent/30">
        <div className="container">
          <div className="mb-12 max-w-2xl">
            <p className="kicker text-[hsl(var(--iiv-gold))]"><span className="editorial-rule mr-3" /> Rede Nacional</p>
            <h2 className="font-serif text-3xl md:text-4xl mt-5 leading-tight">Estações regionais</h2>
            <p className="mt-4 text-muted-foreground">
              Presença em todas as principais regiões do país, ao serviço de produtores e médicos veterinários.
            </p>
          </div>
          <div className="grid gap-px bg-border rounded-2xl overflow-hidden border border-border/60 sm:grid-cols-2 lg:grid-cols-3">
            {estacoes.map((e) => (
              <div key={e.nome} className="bg-card p-6">
                <MapPin className="h-4 w-4 text-[hsl(var(--iiv-gold))] mb-3" />
                <p className="font-serif text-lg leading-tight">{e.nome}</p>
                <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{e.cidade}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
