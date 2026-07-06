import type { ContactMessageDto } from "@/types/dto/contactMessage";

/**
 * Dados fictícios mas realistas de mensagens recebidas via formulário público
 * de Contactos. Servem os handlers MSW enquanto o backend Laravel não existe.
 * Mistura de estados (`lida`/`respondida`) e assuntos plausíveis no domínio do
 * IIV (Instituto de Investigação Veterinária de Angola): pedidos de
 * informação, denúncias de maus-tratos a animais, propostas de parceria e
 * dúvidas sobre serviços laboratoriais.
 *
 * NOTA: exportado como `let` para ser MUTÁVEL — os handlers de escrita (POST
 * público, PATCH, DELETE) operam sobre este array em memória, persistindo
 * alterações durante a sessão do browser (perde-se no refresh, que é o
 * comportamento esperado de um mock).
 */
export let contactMessagesFixtures: ContactMessageDto[] = [
  {
    id: "msg-0001",
    nome: "Fernanda Quiteque",
    email: "fernanda.quiteque@gmail.com",
    assunto: "Pedido de informação sobre análises laboratoriais",
    mensagem:
      "Bom dia, gostaria de saber se o instituto realiza análises de diagnóstico de brucelose em bovinos para produtores privados e qual o procedimento para submeter amostras.",
    lida: true,
    respondida: true,
    createdAt: "2026-06-02T09:15:00.000Z",
  },
  {
    id: "msg-0002",
    nome: "João Kapinala",
    email: "joao.kapinala@outlook.com",
    assunto: "Denúncia de maus-tratos a animais na Huíla",
    mensagem:
      "Venho por este meio denunciar uma situação de maus-tratos a gado bovino numa fazenda próxima do Lubango. Os animais aparentam desnutrição severa e falta de água. Solicito intervenção urgente das autoridades competentes.",
    lida: true,
    respondida: false,
    createdAt: "2026-06-10T14:32:00.000Z",
  },
  {
    id: "msg-0003",
    nome: "Cristina Manuel",
    email: "cristina.manuel@uan.ao",
    assunto: "Proposta de parceria de investigação",
    mensagem:
      "Somos um grupo de investigadores da Faculdade de Medicina Veterinária da UAN e gostaríamos de propor uma parceria conjunta na área de vigilância epidemiológica de doenças transfronteiriças.",
    lida: false,
    respondida: false,
    createdAt: "2026-06-18T11:05:00.000Z",
  },
  {
    id: "msg-0004",
    nome: "Manuel Sachipengo",
    email: "m.sachipengo@hotmail.com",
    assunto: "Dúvida sobre inseminação artificial",
    mensagem:
      "Bom dia, sou pequeno produtor no Huambo e gostaria de saber se o IIV presta serviços de inseminação artificial a produtores independentes e quais os custos envolvidos.",
    lida: true,
    respondida: true,
    createdAt: "2026-06-20T08:47:00.000Z",
  },
  {
    id: "msg-0005",
    nome: "Isabel Chindondo",
    email: "isabel.chindondo@gmail.com",
    assunto: "Solicitação de visita técnica",
    mensagem:
      "Estamos a organizar uma visita de estudo de alunos do ensino técnico-profissional e gostaríamos de saber se é possível agendar uma visita guiada aos laboratórios do instituto.",
    lida: false,
    respondida: false,
    createdAt: "2026-06-25T16:20:00.000Z",
  },
  {
    id: "msg-0006",
    nome: "Domingos Chitofo",
    email: "d.chitofo@agripecuaria.co.ao",
    assunto: "Denúncia — abate clandestino de animais",
    mensagem:
      "Tenho conhecimento de um local de abate clandestino sem qualquer fiscalização sanitária na periferia do Kuito, com risco de propagação de doenças. Peço que encaminhem a informação às entidades responsáveis.",
    lida: true,
    respondida: false,
    createdAt: "2026-06-28T10:10:00.000Z",
  },
  {
    id: "msg-0007",
    nome: "Teresa Bumba",
    email: "teresa.bumba@yahoo.com",
    assunto: "Dúvidas sobre certificação de produtos de origem animal",
    mensagem:
      "Gostaria de saber quais os requisitos e documentação necessária para obter certificação sanitária de exportação de produtos de origem animal processados na nossa unidade.",
    lida: false,
    respondida: false,
    createdAt: "2026-07-01T13:55:00.000Z",
  },
  {
    id: "msg-0008",
    nome: "Adão Muhongo",
    email: "adao.muhongo@gmail.com",
    assunto: "Elogio ao trabalho do laboratório de parasitologia",
    mensagem:
      "Quero agradecer e elogiar o excelente atendimento e rapidez na entrega dos resultados de diagnóstico parasitológico do nosso efectivo caprino. Parabéns à equipa técnica.",
    lida: true,
    respondida: true,
    createdAt: "2026-07-03T09:40:00.000Z",
  },
];

/** Substitui o conteúdo do array em memória (usado pelos handlers de escrita). */
export function setContactMessagesFixtures(next: ContactMessageDto[]) {
  contactMessagesFixtures = next;
}
