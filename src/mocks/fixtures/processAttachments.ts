import type { ProcessAttachmentDto } from "@/types/dto/processAttachment";

/**
 * Anexos fictícios de processos. Array MUTÁVEL (let) — os handlers de escrita
 * (create/delete) operam sobre ele em memória, persistindo durante a sessão do
 * browser (reset no refresh). Segue o padrão de `fixtures/animais.ts`.
 *
 * O primeiro anexo aponta para um documento da Gestão Documental (o resumo
 * `document` é resolvido no handler a partir de `documentosFixtures`); o segundo
 * é um upload directo simulado (só metadados, sem storage real).
 */
export let processAttachmentsFixtures: ProcessAttachmentDto[] = [
  {
    id: "patt-0001",
    processId: "proc-0001",
    label: "Certificado sanitário de origem",
    filePath: null,
    documentId: "doc-0001",
    uploadedBy: "00000000-0000-0000-0000-000000000001",
    createdAt: "2026-07-01T09:00:00.000Z",
    document: null,
  },
  {
    id: "patt-0002",
    processId: "proc-0001",
    label: "Parecer técnico preliminar (rascunho)",
    filePath: "processes/proc-0001/1751360400000_parecer-preliminar.pdf",
    documentId: null,
    uploadedBy: "00000000-0000-0000-0000-000000000001",
    createdAt: "2026-07-02T16:10:00.000Z",
    document: null,
  },
];

export function setProcessAttachmentsFixtures(next: ProcessAttachmentDto[]) {
  processAttachmentsFixtures = next;
}
