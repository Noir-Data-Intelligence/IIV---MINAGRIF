const partners = [
  { name: "FAO", desc: "Food and Agriculture Organization" },
  { name: "OIE / WOAH", desc: "Organização Mundial da Saúde Animal" },
  { name: "MINAGRIP", desc: "Ministério da Agricultura e Pescas" },
  { name: "UAN", desc: "Universidade Agostinho Neto" },
  { name: "SADC", desc: "Comunidade de Desenvolvimento da África Austral" },
  { name: "OMS", desc: "Organização Mundial da Saúde" },
];

export function PartnersBar() {
  return (
    <section className="section-divider py-16 md:py-20">
      <div className="container">
        <div className="text-center mb-10">
          <p className="kicker text-[hsl(var(--iiv-gold))] justify-center inline-flex">
            <span className="editorial-rule mr-3" /> Parceiros institucionais
          </p>
          <h2 className="font-serif text-2xl md:text-3xl mt-4">
            Cooperação nacional e internacional
          </h2>
        </div>
        <div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-border rounded-2xl overflow-hidden border border-border/60"
          role="list"
          aria-label="Lista de parceiros institucionais"
        >
          {partners.map((p) => (
            <div
              key={p.name}
              role="listitem"
              title={p.desc}
              className="bg-card aspect-[3/2] flex flex-col items-center justify-center p-4 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
            >
              <p className="font-serif text-xl md:text-2xl text-primary tracking-tight">{p.name}</p>
              <p className="text-[10px] text-muted-foreground text-center mt-1 line-clamp-2 uppercase tracking-wider">
                {p.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
