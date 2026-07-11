/**
 * DTO do sub-recurso `processAttachments` — anexos de um processo administrativo.
 *
 * Um anexo pode apontar para um documento da Gestão Documental (`documentId`,
 * com um resumo embebido em `document` para a UI listar sem N+1) OU representar
 * um ficheiro carregado directamente (`filePath` + metadados). Espelha a antiga
 * tabela Supabase `process_attachments`, já em camelCase.
 */
export interface ProcessAttachmentDto {
  id: string;
  processId: string;
  label: string;
  /** Caminho fictício do ficheiro carregado (upload simulado), ou null. */
  filePath: string | null;
  /** FK para um documento da Gestão Documental, ou null. */
  documentId: string | null;
  uploadedBy: string | null;
  createdAt: string;
  /** Resumo do documento ligado (quando `documentId` != null). */
  document: { id: string; title: string; currentVersionId: string | null } | null;
}

/**
 * Payload de criação de um anexo. Para anexar um documento existente envia-se
 * `documentId`; para um upload directo envia-se `filePath` + metadados do
 * ficheiro (nome/tamanho/tipo) — sem storage real, à semelhança do módulo
 * Documentos.
 */
export interface CreateProcessAttachmentInput {
  label: string;
  documentId?: string | null;
  filePath?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
  uploadedBy?: string | null;
}
