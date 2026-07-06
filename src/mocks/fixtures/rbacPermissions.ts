import type { PermissionEntryDto } from "@/types/dto/rbac";

/**
 * Fixture mutável das permissões RBAC (overrides ao default de `ROLE_PERMISSIONS`).
 *
 * Contém apenas um pequeno conjunto de entradas que DIVERGEM do default estático,
 * para que a matriz não apareça 100% igual às predefinições e seja visível a
 * diferença. O handler PUT substitui este array pelo enviado (persiste durante a
 * sessão do browser; reset no refresh), replicando o upsert Supabase original.
 */
export const rbacPermissionsFixtures: PermissionEntryDto[] = [
  // Colaborador passa a poder ver Notícias (default não inclui).
  { role: "colaborador", module: "noticias", canView: true, canWrite: false },
  // Técnico ganha acesso de escrita a Estações (default não inclui).
  { role: "tecnico", module: "estacoes", canView: true, canWrite: true },
  // Gestor passa a ver Logs de Actividade (default não inclui).
  { role: "gestor", module: "logs", canView: true, canWrite: false },
  // Director ganha escrita em Documentos (default é só leitura).
  { role: "diretor", module: "documentos", canView: true, canWrite: true },
  // Colaborador passa a ver+escrever Mensagens (default não inclui).
  { role: "colaborador", module: "mensagens", canView: true, canWrite: true },
];

export default rbacPermissionsFixtures;
