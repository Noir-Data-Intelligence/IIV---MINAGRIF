import type { HeroSlideDto } from "@/types/dto/heroSlide";

/**
 * Réplica dos `defaultSlides` que hoje vivem embutidos em `HeroSlideshow.tsx`
 * (mesmos kickers/títulos/subtítulos/CTAs/links), servindo os handlers MSW
 * enquanto o backend Laravel não existe.
 *
 * `imageUrl` fica sempre `null`: o componente já tem lógica de fallback para
 * as imagens locais (`hero-lab.jpg`, `hero-vacinas.jpg`, ...) quando não há
 * `image_url` vindo do backend, e mantemos esse comportamento.
 *
 * NOTA: exportado como `let` para ser MUTÁVEL — os handlers create/update/delete
 * (ver `mocks/handlers/heroSlides.ts`) operam sobre este array em memória,
 * persistindo alterações durante a sessão do browser (perde-se no refresh,
 * que é o comportamento esperado de um mock).
 */
export let heroSlidesFixtures: HeroSlideDto[] = [
  {
    id: "hs-01",
    kicker: "Diagnóstico Laboratorial",
    title: "Ciência ao serviço da saúde animal",
    subtitle:
      "Laboratórios de referência com padrões internacionais para o sector veterinário angolano.",
    ctaLabel: "Conheça os nossos serviços",
    ctaLink: "/servicos",
    imageUrl: null,
    sortOrder: 1,
    published: true,
  },
  {
    id: "hs-02",
    kicker: "Produção de Vacinas",
    title: "Vacinas e reagentes feitos em Angola",
    subtitle:
      "Produção nacional de imunobiológicos veterinários para reforçar a segurança alimentar.",
    ctaLabel: "Ver produção",
    ctaLink: "/servicos",
    imageUrl: null,
    sortOrder: 2,
    published: true,
  },
  {
    id: "hs-03",
    kicker: "Saúde no Terreno",
    title: "Presença em cada província",
    subtitle:
      "Oito estações regionais a apoiar criadores e médicos veterinários em todo o território.",
    ctaLabel: "Sobre o Instituto",
    ctaLink: "/sobre",
    imageUrl: null,
    sortOrder: 3,
    published: true,
  },
  {
    id: "hs-04",
    kicker: "Investigação Científica",
    title: "Investigação aplicada com impacto",
    subtitle:
      "Programas de pesquisa em parceria com universidades e organizações internacionais.",
    ctaLabel: "Saiba mais",
    ctaLink: "/sobre",
    imageUrl: null,
    sortOrder: 4,
    published: true,
  },
  {
    id: "hs-05",
    kicker: "Vigilância Epidemiológica",
    title: "Protegendo a pecuária nacional",
    subtitle:
      "Vigilância contínua de doenças animais que ameaçam a economia e a saúde pública.",
    ctaLabel: "Últimas notícias",
    ctaLink: "/noticias",
    imageUrl: null,
    sortOrder: 5,
    published: true,
  },
];

export default heroSlidesFixtures;
