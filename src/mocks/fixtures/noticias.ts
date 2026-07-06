import type { NoticiaDto } from "@/types/dto/noticia";

/**
 * Dados fictícios mas realistas do domínio IIV (Instituto de Investigação
 * Veterinária de Angola). Servem os handlers MSW enquanto o backend Laravel não
 * existe. Datas espalhadas por ~2 anos, mistura de published true/false, alguns
 * destaques, categorias reais variadas.
 *
 * NOTA: exportado como `let` para ser MUTÁVEL — os handlers create/update/delete
 * operam sobre este array em memória, persistindo alterações durante a sessão
 * do browser (perde-se no refresh, que é o comportamento esperado de um mock).
 */
export let noticiasFixtures: NoticiaDto[] = [
  {
    id: "n-0001",
    slug: "campanha-vacinacao-antirrabica-huila-2025",
    titulo: "Arranca campanha de vacinação antirrábica na Huíla",
    resumo:
      "O IIV, em parceria com as direcções provinciais, inicia a imunização de mais de 120 mil cães e gatos em 14 municípios da Huíla.",
    conteudo:
      "O Instituto de Investigação Veterinária deu início esta semana à campanha anual de vacinação antirrábica na província da Huíla, com a meta de imunizar mais de 120 mil animais de companhia até ao final do trimestre.\n\nAs brigadas móveis percorrerão os 14 municípios da província, com especial atenção às zonas rurais onde a cobertura vacinal tem sido historicamente baixa. A raiva continua a representar um risco de saúde pública em Angola, sendo a vacinação canina a medida mais eficaz de prevenção.\n\n\"A articulação entre o IIV e as autoridades locais é decisiva para chegarmos às comunidades mais afastadas\", afirmou o coordenador da campanha.",
    categoria: "Vacinação",
    image_path: "campanha-vacinacao-huila-2025.jpg",
    destaque: true,
    published: true,
    published_at: "2025-05-12T09:00:00.000Z",
    created_at: "2025-05-10T14:22:00.000Z",
  },
  {
    id: "n-0002",
    slug: "novo-laboratorio-diagnostico-molecular-huambo",
    titulo: "Novo laboratório de diagnóstico molecular inaugurado no Huambo",
    resumo:
      "A nova unidade permite detecção rápida de agentes patogénicos por PCR, reduzindo para 48 horas o tempo de resposta a surtos.",
    conteudo:
      "Foi inaugurado no Huambo o novo laboratório de diagnóstico molecular do IIV, equipado com plataformas de PCR em tempo real que permitem a detecção de agentes patogénicos animais em menos de 48 horas.\n\nA infra-estrutura reforça a capacidade nacional de resposta a doenças transfronteiriças, como a peste suína africana e a febre aftosa, e servirá de referência para as províncias do planalto central.\n\nO investimento inclui ainda formação especializada de técnicos e a integração do laboratório na rede nacional de vigilância epidemiológica.",
    categoria: "Infraestrutura",
    image_path: "laboratorio-molecular-huambo.jpg",
    destaque: true,
    published: true,
    published_at: "2025-03-28T10:30:00.000Z",
    created_at: "2025-03-25T08:15:00.000Z",
  },
  {
    id: "n-0003",
    slug: "vigilancia-peste-suina-africana-norte",
    titulo: "IIV reforça vigilância da peste suína africana no norte do país",
    resumo:
      "Programa de vigilância activa recolhe amostras em explorações do Uíge e Zaire após notificação de casos na região.",
    conteudo:
      "Na sequência da notificação de focos de peste suína africana (PSA) em países vizinhos, o IIV activou um programa reforçado de vigilância nas províncias do Uíge e do Zaire.\n\nAs equipas de campo estão a recolher amostras em explorações comerciais e de subsistência, com análise laboratorial imediata. Foram igualmente promovidas acções de sensibilização junto dos criadores sobre medidas de biossegurança.\n\nA PSA não afecta a saúde humana, mas provoca elevada mortalidade em suínos, com forte impacto económico nas comunidades rurais.",
    categoria: "Vigilância",
    image_path: null,
    destaque: false,
    published: true,
    published_at: "2025-02-14T11:00:00.000Z",
    created_at: "2025-02-12T16:40:00.000Z",
  },
  {
    id: "n-0004",
    slug: "formacao-tecnicos-inspeccao-sanitaria-2025",
    titulo: "Cinquenta técnicos concluem formação em inspecção sanitária",
    resumo:
      "Curso intensivo capacitou técnicos de sete províncias em inspecção de carnes e higiene de matadouros.",
    conteudo:
      "Cinquenta técnicos de sete províncias concluíram com aproveitamento o curso intensivo de inspecção sanitária promovido pelo IIV, em colaboração com a Direcção Nacional de Pecuária.\n\nO programa abordou inspecção ante e post-mortem, higiene de matadouros, rastreabilidade e gestão de resíduos. A formação insere-se no esforço de padronização dos procedimentos de segurança alimentar de origem animal em Angola.",
    categoria: "Formação",
    image_path: "formacao-inspeccao-2025.jpg",
    destaque: false,
    published: true,
    published_at: "2025-01-30T09:45:00.000Z",
    created_at: "2025-01-28T13:10:00.000Z",
  },
  {
    id: "n-0005",
    slug: "parceria-fao-vigilancia-epidemiologica",
    titulo: "IIV e FAO assinam protocolo para vigilância epidemiológica",
    resumo:
      "Acordo prevê apoio técnico, partilha de dados e reforço da rede de laboratórios veterinários nacionais.",
    conteudo:
      "O Instituto de Investigação Veterinária e a Organização das Nações Unidas para a Alimentação e a Agricultura (FAO) assinaram um protocolo de cooperação para o reforço da vigilância epidemiológica animal em Angola.\n\nO acordo contempla apoio técnico, formação de quadros, partilha de dados epidemiológicos e modernização da rede de laboratórios veterinários. A parceria enquadra-se na abordagem \"Uma Só Saúde\", que integra saúde animal, humana e ambiental.",
    categoria: "Parcerias",
    image_path: "parceria-fao.jpg",
    destaque: false,
    published: true,
    published_at: "2024-11-19T10:00:00.000Z",
    created_at: "2024-11-15T09:30:00.000Z",
  },
  {
    id: "n-0006",
    slug: "estudo-resistencia-antimicrobiana-aves",
    titulo: "Estudo do IIV avalia resistência antimicrobiana em aves de capoeira",
    resumo:
      "Investigação nacional analisa a presença de bactérias resistentes em explorações avícolas de cinco províncias.",
    conteudo:
      "Investigadores do IIV apresentaram os primeiros resultados de um estudo sobre resistência antimicrobiana em aves de capoeira, conduzido em explorações de cinco províncias.\n\nO trabalho, que analisa a presença de bactérias resistentes a antibióticos de uso comum, visa fundamentar políticas de utilização racional de antimicrobianos na produção animal. A resistência antimicrobiana é reconhecida pela OMS como uma das maiores ameaças à saúde global.",
    categoria: "Investigação",
    image_path: null,
    destaque: false,
    published: true,
    published_at: "2024-10-08T14:00:00.000Z",
    created_at: "2024-10-05T11:20:00.000Z",
  },
  {
    id: "n-0007",
    slug: "dia-mundial-veterinario-2025",
    titulo: "IIV assinala Dia Mundial do Veterinário com jornadas científicas",
    resumo:
      "Programa de dois dias reúne especialistas nacionais e internacionais em torno da sanidade animal.",
    conteudo:
      "O IIV assinalou o Dia Mundial do Veterinário com a realização de jornadas científicas em Luanda, reunindo especialistas nacionais e internacionais.\n\nO programa incluiu conferências sobre sanidade animal, apresentação de trabalhos de investigação e uma sessão dedicada ao papel do médico veterinário na segurança alimentar. O evento contou com a participação de estudantes das faculdades de veterinária do país.",
    categoria: "Eventos",
    image_path: "dia-mundial-veterinario.jpg",
    destaque: false,
    published: true,
    published_at: "2025-04-26T08:00:00.000Z",
    created_at: "2025-04-20T10:05:00.000Z",
  },
  {
    id: "n-0008",
    slug: "producao-nacional-vacina-newcastle",
    titulo: "IIV avança na produção nacional de vacina contra a doença de Newcastle",
    resumo:
      "Projecto pretende reduzir a dependência de importações e garantir vacina termoestável para o meio rural.",
    conteudo:
      "O Instituto de Investigação Veterinária anunciou progressos no projecto de produção nacional de vacina contra a doença de Newcastle, uma das principais causas de mortalidade em aves de capoeira em Angola.\n\nO objectivo é obter uma formulação termoestável, adequada às condições do meio rural, reduzindo a dependência de importações. A doença de Newcastle provoca perdas significativas na avicultura familiar, base de subsistência de muitas famílias.",
    categoria: "Vacinação",
    image_path: null,
    destaque: false,
    published: true,
    published_at: "2024-09-17T09:20:00.000Z",
    created_at: "2024-09-14T15:00:00.000Z",
  },
  {
    id: "n-0009",
    slug: "reabilitacao-posto-veterinario-malanje",
    titulo: "Concluída reabilitação do posto veterinário de Malanje",
    resumo:
      "Unidade reabilitada passa a dispor de sala de análises, câmara fria para vacinas e área de atendimento.",
    conteudo:
      "Foram concluídas as obras de reabilitação do posto veterinário de Malanje, que passa a dispor de sala de análises, câmara fria para conservação de vacinas e uma área de atendimento aos criadores.\n\nA intervenção integra o programa de modernização da rede de postos veterinários do interior, aproximando os serviços de sanidade animal das comunidades produtoras.",
    categoria: "Infraestrutura",
    image_path: "posto-malanje.jpg",
    destaque: false,
    published: true,
    published_at: "2024-08-02T10:15:00.000Z",
    created_at: "2024-07-30T12:00:00.000Z",
  },
  {
    id: "n-0010",
    slug: "inquerito-brucelose-bovina-sul",
    titulo: "Inquérito de seroprevalência da brucelose bovina no sul de Angola",
    resumo:
      "IIV inicia recolha de amostras em efectivos bovinos do Cunene, Huíla e Namibe para mapear a doença.",
    conteudo:
      "O IIV deu início a um inquérito de seroprevalência da brucelose bovina nas províncias do Cunene, Huíla e Namibe, com recolha sistemática de amostras em efectivos seleccionados.\n\nOs resultados permitirão mapear a distribuição da doença e orientar futuras estratégias de controlo. A brucelose é uma zoonose, transmissível ao ser humano, com impacto tanto na saúde pública como na produtividade pecuária.",
    categoria: "Vigilância",
    image_path: null,
    destaque: false,
    published: false,
    published_at: null,
    created_at: "2025-06-18T09:00:00.000Z",
  },
  {
    id: "n-0011",
    slug: "protocolo-universidade-agostinho-neto",
    titulo: "IIV e Universidade Agostinho Neto reforçam cooperação científica",
    resumo:
      "Protocolo prevê estágios, co-orientação de teses e projectos conjuntos de investigação veterinária.",
    conteudo:
      "O Instituto de Investigação Veterinária e a Universidade Agostinho Neto assinaram um protocolo de cooperação científica que prevê a realização de estágios, a co-orientação de teses de mestrado e doutoramento e o desenvolvimento de projectos conjuntos de investigação.\n\nA parceria visa aproximar a investigação aplicada do ensino superior e fortalecer a formação de novos quadros na área das ciências veterinárias.",
    categoria: "Parcerias",
    image_path: "protocolo-uan.jpg",
    destaque: false,
    published: true,
    published_at: "2024-12-11T11:30:00.000Z",
    created_at: "2024-12-08T14:45:00.000Z",
  },
  {
    id: "n-0012",
    slug: "workshop-biosseguranca-exploracoes-suinas",
    titulo: "Workshop de biossegurança para exploração suína reúne criadores",
    resumo:
      "Sessões práticas ensinam medidas de prevenção de doenças em explorações de suínos do Bengo e Cuanza Norte.",
    conteudo:
      "O IIV promoveu um workshop de biossegurança dirigido a criadores de suínos do Bengo e do Cuanza Norte, com sessões práticas sobre medidas de prevenção e controlo de doenças.\n\nForam abordados temas como controlo de acessos, quarentena de animais, higienização de instalações e maneio de resíduos. A iniciativa reforça a resiliência do sector face a ameaças como a peste suína africana.",
    categoria: "Formação",
    image_path: null,
    destaque: false,
    published: true,
    published_at: "2025-06-05T08:30:00.000Z",
    created_at: "2025-06-01T10:00:00.000Z",
  },
  {
    id: "n-0013",
    slug: "boletim-epidemiologico-trimestral",
    titulo: "IIV publica boletim epidemiológico do primeiro trimestre",
    resumo:
      "Documento reúne dados de notificação de doenças animais e tendências de vigilância a nível nacional.",
    conteudo:
      "O Instituto de Investigação Veterinária publicou o boletim epidemiológico referente ao primeiro trimestre, reunindo dados de notificação de doenças animais recolhidos pela rede nacional de vigilância.\n\nO documento apresenta a evolução das principais enfermidades sob vigilância, indicadores de cobertura vacinal e recomendações técnicas para os serviços provinciais.",
    categoria: "Geral",
    image_path: null,
    destaque: false,
    published: true,
    published_at: "2025-04-10T09:00:00.000Z",
    created_at: "2025-04-08T16:20:00.000Z",
  },
  {
    id: "n-0014",
    slug: "projecto-genotipagem-febre-aftosa",
    titulo: "Projecto de genotipagem do vírus da febre aftosa em curso",
    resumo:
      "Investigadores caracterizam estirpes circulantes para apoiar a selecção de vacinas mais eficazes.",
    conteudo:
      "Está em curso no IIV um projecto de genotipagem do vírus da febre aftosa, com o objectivo de caracterizar as estirpes circulantes em Angola.\n\nO conhecimento da diversidade viral é essencial para a selecção de vacinas adequadas e para o desenho de estratégias de controlo regionais. A febre aftosa é uma das doenças de maior impacto no comércio de animais e produtos de origem animal.",
    categoria: "Investigação",
    image_path: null,
    destaque: false,
    published: false,
    published_at: null,
    created_at: "2025-06-25T11:00:00.000Z",
  },
  {
    id: "n-0015",
    slug: "feira-pecuaria-lubango-participacao-iiv",
    titulo: "IIV marca presença na Feira Agropecuária do Lubango",
    resumo:
      "Instituto apresenta serviços de diagnóstico e aconselhamento sanitário a produtores e visitantes.",
    conteudo:
      "O Instituto de Investigação Veterinária participou na Feira Agropecuária do Lubango, onde apresentou os seus serviços de diagnóstico laboratorial e prestou aconselhamento sanitário a produtores e visitantes.\n\nO stand do IIV recebeu criadores de toda a região sul, interessados em esclarecer dúvidas sobre vacinação, controlo de parasitas e boas práticas de maneio animal.",
    categoria: "Eventos",
    image_path: "feira-lubango.jpg",
    destaque: false,
    published: true,
    published_at: "2024-07-14T09:00:00.000Z",
    created_at: "2024-07-10T13:30:00.000Z",
  },
];

/** Substitui o conteúdo do array em memória (usado pelos handlers de escrita). */
export function setNoticiasFixtures(next: NoticiaDto[]) {
  noticiasFixtures = next;
}
