export type AppRole = "admin" | "tecnico" | "gestor" | "diretor" | "colaborador";

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
  | "bi";



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
  "missoes", "rh", "formacoes", "investigacao", "avaliacoes", "bi",
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
};


const ALL = ALL_MODULES;

export const ROLE_PERMISSIONS: Record<AppRole, Permission> = {
  admin: {
    view: ALL,
    write: ALL,
  },
  diretor: {
    view: ALL,
    write: [],
  },
  gestor: {
    view: [
      "painel", "perfil", "departamentos",
      "laboratorios", "analises", "resultados", "insumos",
      "produtos", "lotes", "planeamento", "distribuicao",
      "estacoes", "animais", "inseminacao", "auditorias", "nao-conformidades",
      "historico-alertas", "documentos", "processos",
      "stock", "agricultura", "pecuaria", "financeiro", "patrimonio",
      "missoes", "rh", "formacoes", "investigacao", "avaliacoes", "bi",
    ],
    write: [
      "produtos", "lotes", "planeamento", "distribuicao",
      "estacoes", "animais", "inseminacao", "auditorias", "nao-conformidades",
      "documentos", "processos",
      "stock", "agricultura", "pecuaria", "financeiro", "patrimonio",
      "missoes", "rh", "formacoes", "investigacao", "avaliacoes",
    ],
  },
  tecnico: {
    view: [
      "painel", "perfil",
      "laboratorios", "analises", "resultados", "insumos",
      "animais", "inseminacao", "historico-alertas", "documentos", "processos",
      "stock", "agricultura", "pecuaria", "patrimonio",
      "missoes", "formacoes", "investigacao", "avaliacoes",
    ],
    write: ["analises", "resultados", "insumos", "animais", "inseminacao", "documentos", "processos",
      "stock", "agricultura", "pecuaria", "missoes", "formacoes", "investigacao"],
  },
  colaborador: {
    view: ["painel", "perfil", "analises", "distribuicao", "historico-alertas", "documentos", "processos",
      "missoes", "formacoes", "investigacao", "avaliacoes"],
    write: ["processos"],
  },
};


/** Runtime override loaded from DB (role_permissions). */
type Matrix = Record<AppRole, { view: Set<ModuleKey>; write: Set<ModuleKey> }>;
let DYNAMIC_MATRIX: Matrix | null = null;

export function setDynamicPermissions(rows: Array<{ role: AppRole; module: string; can_view: boolean; can_write: boolean }>) {
  const next: Matrix = {
    admin: { view: new Set(), write: new Set() },
    diretor: { view: new Set(), write: new Set() },
    gestor: { view: new Set(), write: new Set() },
    tecnico: { view: new Set(), write: new Set() },
    colaborador: { view: new Set(), write: new Set() },
  };
  for (const r of rows) {
    const m = r.module as ModuleKey;
    if (!next[r.role]) continue;
    if (r.can_view) next[r.role].view.add(m);
    if (r.can_write) next[r.role].write.add(m);
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
  diretor: "Director",
  gestor: "Gestor",
  tecnico: "Técnico",
  colaborador: "Colaborador",
};

export const ALL_ROLES: AppRole[] = ["admin", "diretor", "gestor", "tecnico", "colaborador"];
