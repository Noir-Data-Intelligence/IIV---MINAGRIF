import {
  Bug,
  FlaskConical,
  TestTubes,
  Dna,
  Wheat,
  Droplets,
  ShieldAlert,
  SprayCan,
  Thermometer,
  type LucideIcon,
} from "lucide-react";

/**
 * Catálogo público das 8 áreas laboratoriais + Sala de Incubação
 * (SIG-IIV-MEMORIA-PROJETO.md §7). Conteúdo institucional não sensível —
 * nunca inclui SLA, validadores nomeados ou qualquer dado operacional do
 * `Laboratorio` interno (esses só existem no `/admin`, autenticado).
 * Textos (nome/descrição/técnicas) vêm do i18n (`public/laboratorios.json`),
 * indexados por `slug`; este ficheiro só fixa a estrutura/ícone/ordem.
 */
export interface LaboratorioPublico {
  slug: string;
  code: string | null;
  icon: LucideIcon;
}

export const LABORATORIOS_PUBLICOS: LaboratorioPublico[] = [
  { slug: "parasitologia", code: "AP", icon: Bug },
  { slug: "bacteriologia", code: "AB", icon: FlaskConical },
  { slug: "serologia", code: "AS", icon: TestTubes },
  { slug: "biologia-molecular", code: "BM", icon: Dna },
  { slug: "bromatologia", code: "BR", icon: Wheat },
  { slug: "microbiologia-alimentar", code: "AMA", icon: Droplets },
  { slug: "raiva", code: "AR", icon: ShieldAlert },
  { slug: "lavagem-esterilizacao", code: "AMC", icon: SprayCan },
  { slug: "sala-incubacao", code: null, icon: Thermometer },
];

export function findLaboratorioPublico(slug: string | undefined): LaboratorioPublico | undefined {
  return LABORATORIOS_PUBLICOS.find((l) => l.slug === slug);
}
