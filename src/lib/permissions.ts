import type { PermissionEntryDto } from "@/types/dto/rbac";

/**
 * Os 12 papéis institucionais especificados na REQ-005 §13 (matriz RBAC).
 * Substituem o modelo anterior de 5 papéis genéricos (admin/diretor/gestor/
 * tecnico/colaborador) — "gestor" foi desdobrado em 5 papéis especializados
 * (gestor-stock/patrimonio/financeiro/rh/estacao) e "tecnico"/"colaborador"
 * em papéis mais fiéis à operação real do laboratório (director-laboratorio,
 * responsavel-qualidade, recepcionista). "isv" é o papel externo de
 * interface (consulta/notificação), sem acesso de escrita ao admin interno.
 * Ver SIG-IIV-MEMORIA-PROJETO.md secção 9 para o mapeamento 5→12 e o
 * racional de cada papel.
 */
export type AppRole =
  | "admin"
  | "diretor"
  | "director-laboratorio"
  | "responsavel-qualidade"
  | "tecnico"
  | "recepcionista"
  | "gestor-stock"
  | "gestor-patrimonio"
  | "gestor-financeiro"
  | "gestor-rh"
  | "gestor-estacao"
  | "isv";

export type ModuleKey =
  | "painel"
  | "perfil"
  | "utilizadores"
  | "departamentos"
  | "laboratorios"
  | "analises"
  | "resultados"
  | "insumos"
  | "produtos"
  | "lotes"
  | "planeamento"
  | "distribuicao"
  | "estacoes"
  | "auditorias"
  | "nao-conformidades"
  | "logs"
  | "acessibilidade"
  | "legislacao"
  | "noticias"
  | "mensagens"
  | "slideshow"
  | "rbac"
  | "historico-alertas"
  | "documentos"
  | "processos"
  | "animais"
  | "inseminacao"
  | "stock"
  | "agricultura"
  | "pecuaria"
  | "financeiro"
  | "patrimonio"
  | "missoes"
  | "rh"
  | "formacoes"
  | "investigacao"
  | "avaliacoes"
  | "bi"
  | "observatorio";



interface Permission {
  view: ModuleKey[];
  write: ModuleKey[];
}

export const ALL_MODULES: ModuleKey[] = [
  "painel", "perfil", "utilizadores", "departamentos",
  "laboratorios", "analises", "resultados", "insumos",
  "produtos", "lotes", "planeamento", "distribuicao",
  "estacoes", "auditorias", "nao-conformidades", "logs",
  "acessibilidade", "legislacao", "noticias", "mensagens", "slideshow", "rbac",
  "historico-alertas", "documentos", "processos", "animais", "inseminacao",
  "stock", "agricultura", "pecuaria", "financeiro", "patrimonio",
  "missoes", "rh", "formacoes", "investigacao", "avaliacoes", "bi", "observatorio",
];


export const MODULE_LABEL: Record<ModuleKey, string> = {
  painel: "Painel",
  perfil: "Perfil",
  utilizadores: "Utilizadores",
  departamentos: "Departamentos",
  laboratorios: "Laboratórios",
  analises: "Análises",
  resultados: "Resultados",
  insumos: "Insumos",
  produtos: "Produtos",
  lotes: "Lotes",
  planeamento: "Planeamento",
  distribuicao: "Distribuição",
  estacoes: "Estações",
  auditorias: "Auditorias",
  "nao-conformidades": "Não-Conformidades",
  logs: "Logs de Actividade",
  acessibilidade: "Acessibilidade",
  legislacao: "Legislação",
  noticias: "Notícias",
  mensagens: "Mensagens",
  slideshow: "Slideshow",
  rbac: "RBAC (Permissões)",
  "historico-alertas": "Histórico de Alertas",
  documentos: "Documentos",
  processos: "Processos",
  animais: "Animais",
  inseminacao: "Inseminação Artificial",
  stock: "Stock Integrado",
  agricultura: "Agricultura",
  pecuaria: "Produção Pecuária",
  financeiro: "Financeiro",
  patrimonio: "Património",
  missoes: "Missões",
  rh: "Recursos Humanos",
  formacoes: "Formações",
  investigacao: "Investigação",
  avaliacoes: "Avaliações de Desempenho",
  bi: "BI Institucional",
  observatorio: "Observatório Veterinário",
};


const ALL = ALL_MODULES;

/**
 * Matriz de permissões por omissão dos 12 papéis. Deriva do modelo anterior de
 * 5 papéis (o antigo "gestor" desdobrado pelas 5 áreas de gestão especializada,
 * o antigo "tecnico" desdobrado em tecnico/director-laboratorio/responsavel-
 * qualidade, o antigo "colaborador" renomeado para "recepcionista").
 *
 * NOTA: esta distribuição é um ponto de partida razoável, não uma transcrição
 * literal da matriz V/C/E/Va/A da REQ-005 §13 (ainda por transcrever célula a
 * célula) — validar/afinar contra essa matriz durante a Onda 1 do backend
 * (ver SIG-IIV-MEMORIA-PROJETO.md secção 9 e 16). Editável em runtime via a
 * página /admin/rbac (overrides gravados em `role_permissions`).
 */
export const ROLE_PERMISSIONS: Record<AppRole, Permission> = {
  admin: {
    view: ALL,
    write: ALL,
  },
  diretor: {
    view: ALL,
    write: [],
  },
  "director-laboratorio": {
    view: [
      "painel", "perfil",
      "laboratorios", "analises", "resultados", "insumos",
      "animais", "inseminacao", "auditorias", "nao-conformidades", "logs", "acessibilidade",
      "historico-alertas", "documentos", "processos",
      "missoes", "formacoes", "investigacao", "avaliacoes", "bi", "observatorio",
    ],
    write: ["laboratorios", "analises", "resultados", "insumos", "auditorias", "nao-conformidades", "documentos", "processos"],
  },
  "responsavel-qualidade": {
    view: [
      "painel", "perfil",
      "laboratorios", "analises", "resultados",
      "auditorias", "nao-conformidades", "logs", "acessibilidade",
      "historico-alertas", "documentos", "processos",
    ],
    write: ["auditorias", "nao-conformidades", "logs", "acessibilidade", "documentos", "processos"],
  },
  tecnico: {
    view: [
      "painel", "perfil",
      "laboratorios", "analises", "resultados", "insumos",
      "animais", "inseminacao", "historico-alertas", "documentos", "processos",
      "stock", "agricultura", "pecuaria", "patrimonio",
      "missoes", "formacoes", "investigacao", "avaliacoes", "observatorio",
    ],
    write: ["analises", "resultados", "insumos", "animais", "inseminacao", "documentos", "processos",
      "stock", "agricultura", "pecuaria", "missoes", "formacoes", "investigacao"],
  },
  recepcionista: {
    view: ["painel", "perfil", "analises", "distribuicao", "historico-alertas", "documentos", "processos",
      "missoes", "formacoes", "investigacao", "avaliacoes"],
    write: ["processos"],
  },
  "gestor-stock": {
    view: ["painel", "perfil", "insumos", "stock", "agricultura", "pecuaria",
      "produtos", "lotes", "planeamento", "distribuicao", "historico-alertas", "documentos", "processos"],
    write: ["insumos", "stock", "agricultura", "pecuaria", "produtos", "lotes", "planeamento", "distribuicao", "documentos", "processos"],
  },
  "gestor-patrimonio": {
    view: ["painel", "perfil", "patrimonio", "estacoes", "historico-alertas", "documentos", "processos"],
    write: ["patrimonio", "documentos", "processos"],
  },
  "gestor-financeiro": {
    view: ["painel", "perfil", "financeiro", "bi", "historico-alertas", "documentos", "processos"],
    write: ["financeiro", "documentos", "processos"],
  },
  "gestor-rh": {
    view: ["painel", "perfil", "rh", "formacoes", "missoes", "historico-alertas", "documentos", "processos"],
    write: ["rh", "formacoes", "missoes", "documentos", "processos"],
  },
  "gestor-estacao": {
    view: ["painel", "perfil", "estacoes", "animais", "inseminacao", "agricultura", "pecuaria", "historico-alertas", "documentos", "processos", "observatorio"],
    write: ["estacoes", "animais", "inseminacao", "agricultura", "pecuaria", "documentos", "processos"],
  },
  isv: {
    view: ["painel", "processos", "historico-alertas", "observatorio"],
    write: [],
  },
};


/** Runtime override loaded from DB (role_permissions). */
type Matrix = Record<AppRole, { view: Set<ModuleKey>; write: Set<ModuleKey> }>;
let DYNAMIC_MATRIX: Matrix | null = null;

export function setDynamicPermissions(rows: PermissionEntryDto[]) {
  const next = {} as Matrix;
  for (const role of ALL_ROLES) {
    next[role] = { view: new Set(), write: new Set() };
  }
  for (const r of rows) {
    if (!next[r.role]) continue;
    if (r.canView) next[r.role].view.add(r.module);
    if (r.canWrite) next[r.role].write.add(r.module);
  }
  // Admin is always full access — safety net
  for (const m of ALL) {
    next.admin.view.add(m);
    next.admin.write.add(m);
  }
  DYNAMIC_MATRIX = next;
}

export function clearDynamicPermissions() {
  DYNAMIC_MATRIX = null;
}

export function canView(role: AppRole | null, module: ModuleKey): boolean {
  if (!role) return false;
  if (role === "admin") return true;
  if (DYNAMIC_MATRIX) return DYNAMIC_MATRIX[role].view.has(module);
  return ROLE_PERMISSIONS[role].view.includes(module);
}

export function canWrite(role: AppRole | null, module: ModuleKey): boolean {
  if (!role) return false;
  if (role === "admin") return true;
  if (DYNAMIC_MATRIX) return DYNAMIC_MATRIX[role].write.has(module);
  return ROLE_PERMISSIONS[role].write.includes(module);
}

export const ROLE_LABEL: Record<AppRole, string> = {
  admin: "Administrador",
  diretor: "Direcção",
  "director-laboratorio": "Director de Laboratório",
  "responsavel-qualidade": "Responsável de Qualidade",
  tecnico: "Técnico",
  recepcionista: "Recepcionista",
  "gestor-stock": "Gestor de Stock",
  "gestor-patrimonio": "Gestor de Património",
  "gestor-financeiro": "Gestor Financeiro",
  "gestor-rh": "Gestor de RH",
  "gestor-estacao": "Gestor de Estação",
  isv: "ISV (Externo)",
};

export const ALL_ROLES: AppRole[] = [
  "admin", "diretor", "director-laboratorio", "responsavel-qualidade", "tecnico",
  "recepcionista", "gestor-stock", "gestor-patrimonio", "gestor-financeiro",
  "gestor-rh", "gestor-estacao", "isv",
];

/** Papel principal de um utilizador com vários papéis: o primeiro por ordem alfabética. */
export function primaryRole(roles: AppRole[]): AppRole | null {
  if (roles.length === 0) return null;
  return [...roles].sort()[0];
}
