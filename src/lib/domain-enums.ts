/**
 * Registo central de enums de domínio — consolida os mapas estado/etiqueta hoje duplicados
 * por página (ex: Auditorias, Processos, NaoConformidades). Os valores abaixo foram extraídos
 * directamente dos `statusMap`/`sevMap`/`statusVariant`/`priorityVariant` já existentes em:
 * - src/pages/admin/Auditorias.tsx (PROCESS... na verdade AUDIT_STATUS)
 * - src/pages/admin/NaoConformidades.tsx (SEVERITY_LEVEL, NC_STATUS)
 * - src/pages/admin/Processos.tsx (PROCESS_STATUS, PROCESS_PRIORITY)
 *
 * Este ficheiro não substitui (ainda) os mapas locais — serve como ponto único onde os podem
 * vir a ser consolidados, sem obrigar já a alterar as páginas existentes.
 */

export interface EnumEntry {
  /** Rótulo em PT (a traduzir depois via i18n; mantido PT hardcoded por agora). */
  label: string;
  /** Variant do <Badge> shadcn a usar para este valor. */
  variant: "default" | "secondary" | "destructive" | "outline";
}

/** Estado de um processo administrativo (src/pages/admin/Processos.tsx). */
export const PROCESS_STATUS: Record<string, EnumEntry> = {
  aberto: { label: "Aberto", variant: "secondary" },
  em_curso: { label: "Em curso", variant: "default" },
  concluido: { label: "Concluído", variant: "outline" },
  cancelado: { label: "Cancelado", variant: "destructive" },
};

/** Prioridade de um processo administrativo (src/pages/admin/Processos.tsx). */
export const PROCESS_PRIORITY: Record<string, EnumEntry> = {
  baixa: { label: "Baixa", variant: "outline" },
  normal: { label: "Normal", variant: "secondary" },
  alta: { label: "Alta", variant: "default" },
  urgente: { label: "Urgente", variant: "destructive" },
};

/**
 * Estado de uma análise laboratorial (src/pages/admin/Analises.tsx).
 * Extraído do `statusMap` local dessa página, para reutilização pelas 4 páginas
 * do grupo Laboratório e futura tradução via i18n.
 */
export const ANALYSIS_STATUS: Record<string, EnumEntry> = {
  agendada: { label: "Agendada", variant: "secondary" },
  em_progresso: { label: "Em Progresso", variant: "outline" },
  concluida: { label: "Concluída", variant: "default" },
  cancelada: { label: "Cancelada", variant: "destructive" },
};

/** Estado de uma auditoria de qualidade (src/pages/admin/Auditorias.tsx). */
export const AUDIT_STATUS: Record<string, EnumEntry> = {
  planeada: { label: "Planeada", variant: "outline" },
  em_curso: { label: "Em Curso", variant: "secondary" },
  concluida: { label: "Concluída", variant: "default" },
  cancelada: { label: "Cancelada", variant: "destructive" },
};

/** Gravidade de uma não-conformidade (src/pages/admin/NaoConformidades.tsx). */
export const SEVERITY_LEVEL: Record<string, EnumEntry> = {
  menor: { label: "Menor", variant: "secondary" },
  maior: { label: "Maior", variant: "default" },
  critica: { label: "Crítica", variant: "destructive" },
};

/** Estado de uma não-conformidade (src/pages/admin/NaoConformidades.tsx). */
export const NC_STATUS: Record<string, EnumEntry> = {
  aberta: { label: "Aberta", variant: "destructive" },
  em_resolucao: { label: "Em Resolução", variant: "secondary" },
  resolvida: { label: "Resolvida", variant: "default" },
  encerrada: { label: "Encerrada", variant: "outline" },
};
