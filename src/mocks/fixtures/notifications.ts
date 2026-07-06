import type { NotificationDto } from "@/types/dto/notification";

/**
 * Notificações fictícias mas realistas do painel administrativo do IIV
 * (Instituto de Investigação Veterinária de Angola). Servem os handlers MSW
 * enquanto o backend Laravel não existe.
 *
 * Mistura de `type` (info/sucesso/aviso/erro), `read` true/false, `link`
 * alguns preenchidos (apontam para páginas admin reais) outros `null`, e
 * datas espalhadas pelas últimas semanas.
 *
 * NOTA: exportado como `let` para ser MUTÁVEL — os handlers de escrita
 * (marcar lida/eliminar/limpar) operam sobre este array em memória,
 * persistindo alterações durante a sessão do browser (perde-se no refresh,
 * que é o comportamento esperado de um mock).
 */
export let notificationsFixtures: NotificationDto[] = [
  {
    id: "notif-0001",
    title: "Novo processo BPM atribuído",
    message: "Foi-lhe atribuído o processo \"Renovação de licença laboratorial — Bié\" para análise.",
    type: "info",
    link: "/admin/processos",
    read: false,
    createdAt: "2026-07-06T08:15:00.000Z",
  },
  {
    id: "notif-0002",
    title: "Análise concluída — resultado disponível",
    message: "A análise serológica do lote LB-2026-0143 foi concluída e o resultado já está disponível para consulta.",
    type: "sucesso",
    link: "/admin/resultados",
    read: false,
    createdAt: "2026-07-05T16:42:00.000Z",
  },
  {
    id: "notif-0003",
    title: "Stock de reagente abaixo do mínimo",
    message: "O reagente \"Kit ELISA Peste Suína Africana\" está com stock de 4 unidades, abaixo do limiar mínimo definido (10).",
    type: "aviso",
    link: "/admin/stock",
    read: false,
    createdAt: "2026-07-05T11:05:00.000Z",
  },
  {
    id: "notif-0004",
    title: "Erro ao gerar relatório mensal",
    message: "Ocorreu um erro ao gerar o relatório de produção de Junho/2026. Tente novamente ou contacte o suporte técnico.",
    type: "erro",
    link: null,
    read: false,
    createdAt: "2026-07-04T19:30:00.000Z",
  },
  {
    id: "notif-0005",
    title: "Auditoria agendada para a próxima semana",
    message: "Foi agendada uma auditoria de qualidade à Estação Regional do Huambo para o dia 14 de Julho.",
    type: "info",
    link: "/admin/auditorias",
    read: true,
    createdAt: "2026-07-04T09:00:00.000Z",
  },
  {
    id: "notif-0006",
    title: "Não conformidade registada",
    message: "Foi registada uma não conformidade no processo de rotulagem do Lote LT-2026-0089.",
    type: "aviso",
    link: "/admin/nao-conformidades",
    read: true,
    createdAt: "2026-07-03T14:20:00.000Z",
  },
  {
    id: "notif-0007",
    title: "Novo colaborador adicionado ao sistema",
    message: "Foi criada a conta de utilizador para Joana Kiala, Técnica de Laboratório — Departamento de Virologia.",
    type: "sucesso",
    link: "/admin/utilizadores",
    read: true,
    createdAt: "2026-07-02T10:12:00.000Z",
  },
  {
    id: "notif-0008",
    title: "Falha na sincronização de dados",
    message: "A sincronização automática com a Estação Regional de Benguela falhou após 3 tentativas consecutivas.",
    type: "erro",
    link: "/admin/estacoes",
    read: false,
    createdAt: "2026-07-02T07:48:00.000Z",
  },
  {
    id: "notif-0009",
    title: "Manutenção preventiva agendada",
    message: "O centrifugador CF-102 tem manutenção preventiva agendada para amanhã às 09h00.",
    type: "info",
    link: "/admin/patrimonio",
    read: true,
    createdAt: "2026-07-01T15:55:00.000Z",
  },
  {
    id: "notif-0010",
    title: "Orçamento aprovado",
    message: "O orçamento para aquisição de reagentes do 3.º trimestre foi aprovado pela Direcção Financeira.",
    type: "sucesso",
    link: "/admin/financeiro",
    read: true,
    createdAt: "2026-06-30T13:10:00.000Z",
  },
  {
    id: "notif-0011",
    title: "Prazo de submissão de resultados a expirar",
    message: "O prazo para submissão dos resultados da campanha de vacinação de Malanje termina em 2 dias.",
    type: "aviso",
    link: "/admin/resultados",
    read: false,
    createdAt: "2026-06-29T09:25:00.000Z",
  },
  {
    id: "notif-0012",
    title: "Nova publicação científica registada",
    message: "Foi adicionada uma nova publicação à linha de pesquisa \"Epidemiologia de doenças transfronteiriças\".",
    type: "info",
    link: "/admin/investigacao",
    read: true,
    createdAt: "2026-06-27T12:00:00.000Z",
  },
  {
    id: "notif-0013",
    title: "Erro na importação de dados de campo",
    message: "A importação do ficheiro \"recolha_amostras_cunene_junho.csv\" falhou devido a formato inválido.",
    type: "erro",
    link: null,
    read: true,
    createdAt: "2026-06-25T17:40:00.000Z",
  },
  {
    id: "notif-0014",
    title: "Formação interna disponível",
    message: "Está disponível para inscrição a formação \"Boas práticas de biossegurança laboratorial\", dia 20 de Julho.",
    type: "info",
    link: "/admin/formacoes",
    read: true,
    createdAt: "2026-06-23T08:30:00.000Z",
  },
  {
    id: "notif-0015",
    title: "Processo concluído com sucesso",
    message: "O processo \"Certificação sanitária — exportação de reprodutores\" foi concluído e arquivado.",
    type: "sucesso",
    link: "/admin/processos",
    read: true,
    createdAt: "2026-06-20T11:18:00.000Z",
  },
];

/** Substitui o conteúdo do array em memória (usado pelos handlers de escrita). */
export function setNotificationsFixtures(next: NotificationDto[]) {
  notificationsFixtures = next;
}
