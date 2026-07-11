import type { TrainingDto } from "@/types/dto/formacoes";

/**
 * Dados fictícios mas plausíveis do módulo Formações do IIV (Instituto de
 * Investigação Veterinária de Angola). Servem os handlers MSW enquanto o backend
 * Laravel não existe.
 *
 * Cobre um catálogo típico de capacitações de um instituto de investigação
 * veterinária: técnicas laboratoriais, biossegurança, diagnóstico, gestão da
 * qualidade e formação administrativa. Algumas formações estão propositadamente
 * "em_curso" (datas a envolver a data corrente) e outras "concluida"/"planeada"
 * para alimentar os KPIs.
 *
 * NOTA: exportado como `let` para ser MUTÁVEL — os handlers create/update/delete
 * operam sobre este array em memória, persistindo alterações durante a sessão do
 * browser (perde-se no refresh, comportamento esperado de um mock).
 */

export let trainingsFixtures: TrainingDto[] = [
  {
    id: "for-0001",
    title: "Biossegurança em Laboratório de Nível 2 (BSL-2)",
    description:
      "Boas práticas de biossegurança, uso de EPI, manipulação de agentes patogénicos e gestão de resíduos biológicos.",
    trainer: "Dra. Esperança Domingos",
    location: "Laboratório Central, Luanda",
    startDate: "2026-07-06",
    endDate: "2026-07-17",
    hours: 40,
    status: "em_curso",
    notes: "Formação obrigatória para técnicos de laboratório.",
    createdAt: "2026-05-20T08:00:00.000Z",
  },
  {
    id: "for-0002",
    title: "Diagnóstico Molecular por PCR em Tempo Real",
    description:
      "Fundamentos de PCR, extracção de ácidos nucleicos, desenho de ensaios e interpretação de resultados em virologia veterinária.",
    trainer: "Prof. Doutor Manuel da Silva",
    location: "Unidade de Virologia, IIV",
    startDate: "2026-08-03",
    endDate: "2026-08-14",
    hours: 60,
    status: "planeada",
    notes: null,
    createdAt: "2026-06-01T08:00:00.000Z",
  },
  {
    id: "for-0003",
    title: "Sistema de Gestão da Qualidade ISO/IEC 17025",
    description:
      "Requisitos da norma para laboratórios de ensaio e calibração, gestão documental, rastreabilidade metrológica e auditorias internas.",
    trainer: "Eng.ª Luísa Sebastião",
    location: "Sala de Formação, Sede do IIV",
    startDate: "2026-03-10",
    endDate: "2026-03-14",
    hours: 32,
    status: "concluida",
    notes: "Concluída com 18 formandos certificados.",
    createdAt: "2026-01-15T08:00:00.000Z",
  },
  {
    id: "for-0004",
    title: "Colheita e Conservação de Amostras Biológicas no Campo",
    description:
      "Procedimentos de colheita, acondicionamento, cadeia de frio e transporte de amostras de ruminantes e aves.",
    trainer: "Dr. João Ferreira",
    location: "Estação Zootécnica da Humpata, Huíla",
    startDate: "2026-04-21",
    endDate: "2026-04-25",
    hours: 30,
    status: "concluida",
    notes: null,
    createdAt: "2026-02-28T08:00:00.000Z",
  },
  {
    id: "for-0005",
    title: "Inseminação Artificial Bovina — Técnicas Avançadas",
    description:
      "Manuseio de sémen congelado, sincronização de cios, técnica de deposição e registo reprodutivo.",
    trainer: "Dr. Adão Cassinda",
    location: "Centro de Reprodução Animal, Kwanza-Sul",
    startDate: "2026-07-08",
    endDate: "2026-07-22",
    hours: 50,
    status: "em_curso",
    notes: "Formação prática com estágio em explorações parceiras.",
    createdAt: "2026-05-30T08:00:00.000Z",
  },
  {
    id: "for-0006",
    title: "Vigilância Epidemiológica de Doenças Transfronteiriças",
    description:
      "Notificação, resposta rápida e planos de contingência para peste suína africana, febre aftosa e gripe aviária.",
    trainer: "Dra. Beatriz Lussati",
    location: "Auditório do MINAGRIF, Luanda",
    startDate: "2026-09-14",
    endDate: "2026-09-18",
    hours: 36,
    status: "planeada",
    notes: null,
    createdAt: "2026-06-25T08:00:00.000Z",
  },
  {
    id: "for-0007",
    title: "Análise Bromatológica de Alimentos para Animais",
    description:
      "Determinação de matéria seca, proteína bruta, fibra e cinzas; controlo de qualidade de rações.",
    trainer: "Téc. Teresa Mbala",
    location: "Laboratório de Nutrição Animal, IIV",
    startDate: "2026-05-05",
    endDate: "2026-05-09",
    hours: 30,
    status: "concluida",
    notes: null,
    createdAt: "2026-03-18T08:00:00.000Z",
  },
  {
    id: "for-0008",
    title: "Introdução à Administração Pública e Gestão Documental",
    description:
      "Procedimentos administrativos, arquivo, tramitação de expediente e ética no serviço público.",
    trainer: "Carlos Neto",
    location: "Sala de Formação, Sede do IIV",
    startDate: "2026-02-17",
    endDate: "2026-02-19",
    hours: 18,
    status: "cancelada",
    notes: "Cancelada por indisponibilidade de sala; a reagendar.",
    createdAt: "2026-01-10T08:00:00.000Z",
  },
  {
    id: "for-0009",
    title: "Bem-estar Animal e Ética Experimental",
    description:
      "Princípios dos 3R, manuseio humanitário e requisitos éticos em ensaios com animais.",
    trainer: "Prof. Doutor Manuel da Silva",
    location: "Unidade de Experimentação Animal, IIV",
    startDate: "2026-10-06",
    endDate: "2026-10-08",
    hours: 21,
    status: "planeada",
    notes: null,
    createdAt: "2026-06-28T08:00:00.000Z",
  },
  {
    id: "for-0010",
    title: "Metrologia e Calibração de Equipamento Laboratorial",
    description:
      "Calibração de micropipetas, balanças e termómetros; incerteza de medição e registos metrológicos.",
    trainer: "Eng.ª Luísa Sebastião",
    location: "Laboratório de Metrologia, IIV",
    startDate: "2026-06-16",
    endDate: "2026-06-20",
    hours: 30,
    status: "concluida",
    notes: null,
    createdAt: "2026-04-30T08:00:00.000Z",
  },
];
