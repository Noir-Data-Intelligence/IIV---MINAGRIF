/**
 * DTO de Notícia — contrato exacto do JSON REST para o recurso `noticias`.
 *
 * Espelha a interface `Noticia` usada hoje nas páginas (src/pages/admin/Noticias.tsx
 * e src/pages/Noticias.tsx), que por sua vez espelha a tabela Supabase `noticias`.
 * Mantemos os nomes de campo tal como a app já os consome (image_path,
 * published_at, created_at, ...) para que a migração Supabase -> Laravel seja
 * transparente para os componentes. Se o Laravel devolver snake_case, estes
 * nomes coincidem; se devolver camelCase, faz-se (de)serialização na camada de
 * serviço.
 */
export interface NoticiaDto {
  id: string;
  slug: string;
  titulo: string;
  resumo: string | null;
  conteudo: string | null;
  categoria: string;
  image_path: string | null;
  destaque: boolean;
  published: boolean;
  published_at: string | null;
  created_at: string;
}

/** Categorias reais do domínio (idênticas ao array `categorias` da página admin). */
export const NOTICIA_CATEGORIAS = [
  "Geral",
  "Vacinação",
  "Infraestrutura",
  "Parcerias",
  "Vigilância",
  "Formação",
  "Investigação",
  "Eventos",
] as const;

export type NoticiaCategoria = (typeof NOTICIA_CATEGORIAS)[number];

/** Parâmetros de listagem paginada/filtrada de notícias. */
export interface NoticiaListParams {
  page: number;
  perPage: number;
  search?: string;
  categoria?: string;
  published?: boolean;
}
