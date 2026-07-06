/**
 * DTO de Legislação — contrato exacto do JSON REST para o recurso `legislacao`.
 *
 * Espelha a interface `Item` usada hoje em src/pages/Legislacao.tsx e
 * src/pages/LegislacaoDetalhe.tsx, que por sua vez espelha a tabela Supabase
 * `legislation` + o bucket de Storage "legislation" para os PDFs. Ao contrário
 * do original (que guarda `pdf_path` e resolve o URL público via
 * `supabase.storage.from(...).getPublicUrl(...)`), este DTO expõe directamente
 * `pdfUrl` já resolvido — mais simples e mais próximo do que uma API REST
 * (Laravel, Fase 4) devolveria.
 */
export interface LegislacaoDto {
  id: string;
  num: string;
  slug: string;
  titulo: string;
  descricao: string | null;
  tipo: string;
  ano: string;
  pdfUrl: string | null;
  published: boolean;
}

/** Tipos reais do domínio (idênticos ao array `tipos` da página pública, sem "Todos"). */
export const LEGISLACAO_TIPOS = ["Lei", "Decreto", "Regulamento", "Norma", "Portaria"] as const;

export type LegislacaoTipo = (typeof LEGISLACAO_TIPOS)[number];

/** Parâmetros de listagem/filtragem de legislação (sem paginação server-side por agora). */
export interface LegislacaoListParams {
  tipo?: string;
  search?: string;
  published?: boolean;
}
