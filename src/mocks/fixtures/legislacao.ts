import type { LegislacaoDto } from "@/types/dto/legislacao";

/**
 * Dados fictícios mas realistas do domínio jurídico-veterinário angolano.
 * Servem os handlers MSW enquanto o backend Laravel não existe. Os 5 tipos
 * ("Lei", "Decreto", "Regulamento", "Norma", "Portaria") são os que já
 * existiam em `src/pages/Legislacao.tsx`. Cerca de metade tem `pdfUrl`
 * preenchido (URL fictícia, o ficheiro não precisa de existir de verdade),
 * a outra metade `null`, para exercitar o estado "PDF ainda não disponível".
 *
 * NOTA: exportado como `let` para consistência com `noticiasFixtures` (mesmo
 * que este módulo, por agora, só tenha handlers de leitura).
 */
export let legislacaoFixtures: LegislacaoDto[] = [
  {
    id: "leg-0001",
    num: "5/15",
    slug: "lei-5-15-sanidade-animal",
    titulo: "Lei de Bases da Sanidade Animal",
    descricao:
      "Estabelece os princípios gerais de protecção e vigilância da saúde animal em Angola, incluindo notificação obrigatória de doenças.",
    tipo: "Lei",
    ano: "2015",
    pdfUrl: "/mock-pdfs/lei-5-15-sanidade-animal.pdf",
    published: true,
  },
  {
    id: "leg-0002",
    num: "112/16",
    slug: "decreto-presidencial-112-16-rede-laboratorios-veterinarios",
    titulo: "Decreto Presidencial que cria a Rede Nacional de Laboratórios Veterinários",
    descricao:
      "Define a organização e articulação dos laboratórios veterinários provinciais sob coordenação técnica do IIV.",
    tipo: "Decreto",
    ano: "2016",
    pdfUrl: "/mock-pdfs/decreto-112-16-rede-laboratorios.pdf",
    published: true,
  },
  {
    id: "leg-0003",
    num: "34/17",
    slug: "regulamento-34-17-inspeccao-sanitaria-matadouros",
    titulo: "Regulamento de Inspecção Sanitária de Matadouros",
    descricao:
      "Fixa os requisitos técnicos e sanitários aplicáveis à inspecção ante e post-mortem em matadouros e unidades de abate.",
    tipo: "Regulamento",
    ano: "2017",
    pdfUrl: null,
    published: true,
  },
  {
    id: "leg-0004",
    num: "8/18",
    slug: "norma-8-18-boas-praticas-laboratoriais",
    titulo: "Norma Técnica de Boas Práticas Laboratoriais em Diagnóstico Veterinário",
    descricao:
      "Estabelece requisitos de qualidade, biossegurança e rastreabilidade para laboratórios de diagnóstico animal.",
    tipo: "Norma",
    ano: "2018",
    pdfUrl: "/mock-pdfs/norma-8-18-boas-praticas-laboratoriais.pdf",
    published: true,
  },
  {
    id: "leg-0005",
    num: "221/18",
    slug: "portaria-221-18-transporte-produtos-biologicos",
    titulo: "Portaria sobre Transporte e Conservação de Produtos Biológicos Veterinários",
    descricao:
      "Regula as condições de cadeia de frio para vacinas, soros e reagentes durante o transporte inter-provincial.",
    tipo: "Portaria",
    ano: "2018",
    pdfUrl: null,
    published: true,
  },
  {
    id: "leg-0006",
    num: "19/19",
    slug: "lei-19-19-medicamentos-veterinarios",
    titulo: "Lei do Medicamento Veterinário",
    descricao:
      "Disciplina o fabrico, registo, comercialização e utilização de medicamentos e produtos biológicos de uso veterinário.",
    tipo: "Lei",
    ano: "2019",
    pdfUrl: "/mock-pdfs/lei-19-19-medicamentos-veterinarios.pdf",
    published: true,
  },
  {
    id: "leg-0007",
    num: "77/19",
    slug: "decreto-presidencial-77-19-vigilancia-epidemiologica",
    titulo: "Decreto Presidencial sobre o Sistema Nacional de Vigilância Epidemiológica Animal",
    descricao:
      "Cria e regula o sistema integrado de notificação e resposta a doenças animais de declaração obrigatória.",
    tipo: "Decreto",
    ano: "2019",
    pdfUrl: null,
    published: true,
  },
  {
    id: "leg-0008",
    num: "12/20",
    slug: "norma-12-20-controlo-resistencia-antimicrobiana",
    titulo: "Norma Técnica de Controlo da Resistência Antimicrobiana em Produção Animal",
    descricao:
      "Estabelece critérios para a utilização racional de antimicrobianos e monitorização de resistências em explorações pecuárias.",
    tipo: "Norma",
    ano: "2020",
    pdfUrl: "/mock-pdfs/norma-12-20-resistencia-antimicrobiana.pdf",
    published: true,
  },
  {
    id: "leg-0009",
    num: "56/21",
    slug: "regulamento-56-21-biosseguranca-exploracoes-suinicolas",
    titulo: "Regulamento de Biossegurança em Explorações Suinícolas",
    descricao:
      "Define medidas mínimas de biossegurança para prevenção e controlo da peste suína africana em explorações comerciais e familiares.",
    tipo: "Regulamento",
    ano: "2021",
    pdfUrl: null,
    published: true,
  },
  {
    id: "leg-0010",
    num: "340/22",
    slug: "portaria-340-22-taxas-servicos-diagnostico",
    titulo: "Portaria que Fixa as Taxas dos Serviços de Diagnóstico Laboratorial do IIV",
    descricao:
      "Actualiza a tabela de taxas cobradas pelos serviços de diagnóstico, análise e emissão de pareceres técnicos do Instituto.",
    tipo: "Portaria",
    ano: "2022",
    pdfUrl: "/mock-pdfs/portaria-340-22-taxas-servicos.pdf",
    published: true,
  },
  {
    id: "leg-0011",
    num: "3/23",
    slug: "lei-3-23-seguranca-alimentar-origem-animal",
    titulo: "Lei de Segurança Alimentar de Produtos de Origem Animal",
    descricao:
      "Estabelece o quadro legal de garantia da inocuidade de carne, leite, ovos e derivados destinados ao consumo humano.",
    tipo: "Lei",
    ano: "2023",
    pdfUrl: null,
    published: true,
  },
  {
    id: "leg-0012",
    num: "9/24",
    slug: "decreto-presidencial-9-24-producao-nacional-vacinas",
    titulo: "Decreto Presidencial de Fomento à Produção Nacional de Vacinas Veterinárias",
    descricao:
      "Cria incentivos e mecanismos de apoio à produção nacional de vacinas e imunobiológicos de uso veterinário.",
    tipo: "Decreto",
    ano: "2024",
    pdfUrl: "/mock-pdfs/decreto-9-24-producao-nacional-vacinas.pdf",
    // Ainda não publicado: exercita o filtro `published` nos handlers/testes.
    published: false,
  },
];

/** Substitui o conteúdo do array em memória (padrão de `setNoticiasFixtures`). */
export function setLegislacaoFixtures(next: LegislacaoDto[]) {
  legislacaoFixtures = next;
}
