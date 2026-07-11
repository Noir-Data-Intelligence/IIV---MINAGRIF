import type { DocCategoryDto, DocumentoDto, DocVersionDto } from "@/types/dto/documento";

/**
 * Dados fictícios mas realistas da gestão documental do IIV (Instituto de
 * Investigação Veterinária). Servem os handlers MSW enquanto o backend Laravel
 * não existe. Os `ownerId`/`uploadedBy` usam ids reais de
 * `mocks/fixtures/users.ts` e os `categoryId` os das categorias abaixo.
 *
 * NOTA: exportados como `let` para serem MUTÁVEIS — os handlers create/update/
 * delete operam sobre estes arrays em memória, persistindo alterações durante a
 * sessão do browser (reset no refresh, comportamento esperado de um mock).
 */

export let docCategoriesFixtures: DocCategoryDto[] = [
  { id: "dcat-01", name: "Procedimentos e Normas", icon: "FileText", sortOrder: 1 },
  { id: "dcat-02", name: "Relatórios Técnicos", icon: "ClipboardList", sortOrder: 2 },
  { id: "dcat-03", name: "Legislação e Regulamentos", icon: "Scale", sortOrder: 3 },
  { id: "dcat-04", name: "Certificados e Acreditações", icon: "Award", sortOrder: 4 },
  { id: "dcat-05", name: "Formulários", icon: "FileSpreadsheet", sortOrder: 5 },
  { id: "dcat-06", name: "Atas e Deliberações", icon: "Users", sortOrder: 6 },
];

export let documentosFixtures: DocumentoDto[] = [
  {
    id: "doc-0001",
    title: "Procedimento Operacional Normalizado — Colheita de Amostras",
    description:
      "PON que descreve os passos de colheita, acondicionamento e transporte de amostras biológicas para o laboratório de referência.",
    categoryId: "dcat-01",
    ownerId: "usr-0002",
    status: "aprovado",
    visibility: "publico",
    expiryDate: "2027-03-31",
    tags: ["pon", "qualidade", "amostras"],
    currentVersionId: "docv-0001-2",
    createdAt: "2025-11-04T09:12:00.000Z",
    updatedAt: "2026-02-18T14:20:00.000Z",
  },
  {
    id: "doc-0002",
    title: "Relatório Anual de Vigilância Epidemiológica 2025",
    description:
      "Síntese dos casos notificados de doenças de declaração obrigatória e resultados dos programas de vigilância activa.",
    categoryId: "dcat-02",
    ownerId: "usr-0003",
    status: "submetido",
    visibility: "departamento",
    expiryDate: null,
    tags: ["epidemiologia", "vigilância", "2025"],
    currentVersionId: "docv-0002-1",
    createdAt: "2026-01-20T10:45:00.000Z",
    updatedAt: "2026-06-28T08:05:00.000Z",
  },
  {
    id: "doc-0003",
    title: "Certificado de Acreditação ISO/IEC 17025 — Laboratório de Bacteriologia",
    description:
      "Certificado de acreditação do laboratório de bacteriologia segundo a norma ISO/IEC 17025 para ensaios microbiológicos.",
    categoryId: "dcat-04",
    ownerId: "usr-0009",
    status: "aprovado",
    visibility: "publico",
    expiryDate: "2026-07-25",
    tags: ["iso 17025", "acreditação", "bacteriologia"],
    currentVersionId: "docv-0003-1",
    createdAt: "2024-07-25T11:30:00.000Z",
    updatedAt: "2025-09-10T09:00:00.000Z",
  },
  {
    id: "doc-0004",
    title: "Regulamento Interno de Biossegurança",
    description:
      "Regras de biossegurança e biocustódia aplicáveis a todas as instalações laboratoriais do instituto.",
    categoryId: "dcat-03",
    ownerId: "usr-0001",
    status: "aprovado",
    visibility: "publico",
    expiryDate: null,
    tags: ["biossegurança", "regulamento"],
    currentVersionId: "docv-0004-1",
    createdAt: "2025-05-14T13:00:00.000Z",
    updatedAt: "2025-05-14T13:00:00.000Z",
  },
  {
    id: "doc-0005",
    title: "Formulário de Requisição de Análises Laboratoriais",
    description:
      "Modelo oficial para submissão de pedidos de análise, com campos de identificação da amostra e do requisitante.",
    categoryId: "dcat-05",
    ownerId: "usr-0004",
    status: "rascunho",
    visibility: "privado",
    expiryDate: null,
    tags: ["formulário", "análises"],
    currentVersionId: "docv-0005-1",
    createdAt: "2026-06-30T15:20:00.000Z",
    updatedAt: "2026-07-02T09:40:00.000Z",
  },
  {
    id: "doc-0006",
    title: "Ata da Reunião do Conselho Técnico-Científico — 1.º Trimestre 2026",
    description:
      "Deliberações do CTC relativas às linhas de investigação e aprovação do plano de actividades trimestral.",
    categoryId: "dcat-06",
    ownerId: "usr-0005",
    status: "rejeitado",
    visibility: "departamento",
    expiryDate: null,
    tags: ["ata", "ctc", "deliberações"],
    currentVersionId: "docv-0006-1",
    createdAt: "2026-04-08T16:10:00.000Z",
    updatedAt: "2026-05-02T11:15:00.000Z",
  },
  {
    id: "doc-0007",
    title: "Manual de Boas Práticas Laboratoriais (BPL)",
    description:
      "Compêndio das boas práticas de laboratório adoptadas, alinhado com os princípios OCDE de BPL.",
    categoryId: "dcat-01",
    ownerId: "usr-0002",
    status: "aprovado",
    visibility: "publico",
    expiryDate: "2028-01-31",
    tags: ["bpl", "qualidade", "manual"],
    currentVersionId: "docv-0007-1",
    createdAt: "2025-02-11T08:30:00.000Z",
    updatedAt: "2025-12-01T10:00:00.000Z",
  },
  {
    id: "doc-0008",
    title: "Plano de Contingência para Peste Suína Africana",
    description:
      "Procedimentos de resposta rápida em caso de suspeita ou confirmação de foco de peste suína africana.",
    categoryId: "dcat-02",
    ownerId: "usr-0011",
    status: "arquivado",
    visibility: "departamento",
    expiryDate: "2025-12-31",
    tags: ["psa", "contingência", "suínos"],
    currentVersionId: "docv-0008-1",
    createdAt: "2024-03-02T09:00:00.000Z",
    updatedAt: "2025-01-15T14:30:00.000Z",
  },
];

export let docVersionsFixtures: DocVersionDto[] = [
  {
    id: "docv-0001-1",
    documentId: "doc-0001",
    versionNumber: 1,
    filePath: "documents/doc-0001/v1/pon-colheita-amostras.pdf",
    fileName: "pon-colheita-amostras.pdf",
    fileSize: 384512,
    mimeType: "application/pdf",
    changeNotes: "Versão inicial",
    uploadedBy: "usr-0002",
    createdAt: "2025-11-04T09:12:00.000Z",
  },
  {
    id: "docv-0001-2",
    documentId: "doc-0001",
    versionNumber: 2,
    filePath: "documents/doc-0001/v2/pon-colheita-amostras-rev2.pdf",
    fileName: "pon-colheita-amostras-rev2.pdf",
    fileSize: 401203,
    mimeType: "application/pdf",
    changeNotes: "Revisão dos requisitos de cadeia de frio no transporte.",
    uploadedBy: "usr-0002",
    createdAt: "2026-02-18T14:20:00.000Z",
  },
  {
    id: "docv-0002-1",
    documentId: "doc-0002",
    versionNumber: 1,
    filePath: "documents/doc-0002/v1/relatorio-vigilancia-2025.pdf",
    fileName: "relatorio-vigilancia-2025.pdf",
    fileSize: 1258291,
    mimeType: "application/pdf",
    changeNotes: "Versão submetida para aprovação.",
    uploadedBy: "usr-0003",
    createdAt: "2026-06-28T08:05:00.000Z",
  },
  {
    id: "docv-0003-1",
    documentId: "doc-0003",
    versionNumber: 1,
    filePath: "documents/doc-0003/v1/certificado-iso17025-bacteriologia.pdf",
    fileName: "certificado-iso17025-bacteriologia.pdf",
    fileSize: 210044,
    mimeType: "application/pdf",
    changeNotes: "Versão inicial",
    uploadedBy: "usr-0009",
    createdAt: "2025-09-10T09:00:00.000Z",
  },
  {
    id: "docv-0004-1",
    documentId: "doc-0004",
    versionNumber: 1,
    filePath: "documents/doc-0004/v1/regulamento-biosseguranca.pdf",
    fileName: "regulamento-biosseguranca.pdf",
    fileSize: 524288,
    mimeType: "application/pdf",
    changeNotes: "Versão inicial",
    uploadedBy: "usr-0001",
    createdAt: "2025-05-14T13:00:00.000Z",
  },
  {
    id: "docv-0005-1",
    documentId: "doc-0005",
    versionNumber: 1,
    filePath: "documents/doc-0005/v1/formulario-requisicao-analises.docx",
    fileName: "formulario-requisicao-analises.docx",
    fileSize: 45678,
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    changeNotes: "Rascunho inicial do formulário.",
    uploadedBy: "usr-0004",
    createdAt: "2026-07-02T09:40:00.000Z",
  },
  {
    id: "docv-0006-1",
    documentId: "doc-0006",
    versionNumber: 1,
    filePath: "documents/doc-0006/v1/ata-ctc-1t2026.pdf",
    fileName: "ata-ctc-1t2026.pdf",
    fileSize: 156234,
    mimeType: "application/pdf",
    changeNotes: "Versão inicial",
    uploadedBy: "usr-0005",
    createdAt: "2026-05-02T11:15:00.000Z",
  },
  {
    id: "docv-0007-1",
    documentId: "doc-0007",
    versionNumber: 1,
    filePath: "documents/doc-0007/v1/manual-bpl.pdf",
    fileName: "manual-bpl.pdf",
    fileSize: 2097152,
    mimeType: "application/pdf",
    changeNotes: "Versão inicial",
    uploadedBy: "usr-0002",
    createdAt: "2025-12-01T10:00:00.000Z",
  },
  {
    id: "docv-0008-1",
    documentId: "doc-0008",
    versionNumber: 1,
    filePath: "documents/doc-0008/v1/plano-contingencia-psa.pdf",
    fileName: "plano-contingencia-psa.pdf",
    fileSize: 731136,
    mimeType: "application/pdf",
    changeNotes: "Versão inicial",
    uploadedBy: "usr-0011",
    createdAt: "2025-01-15T14:30:00.000Z",
  },
];

/** Substitui o conteúdo dos arrays em memória (usado pelos handlers de escrita). */
export function setDocCategoriesFixtures(next: DocCategoryDto[]) {
  docCategoriesFixtures = next;
}
export function setDocumentosFixtures(next: DocumentoDto[]) {
  documentosFixtures = next;
}
export function setDocVersionsFixtures(next: DocVersionDto[]) {
  docVersionsFixtures = next;
}
