import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ensurePdfFonts, PDF_HEADING_FONT, PDF_BODY_FONT } from "@/lib/pdfFonts";

/**
 * Helper genérico para gerar PDFs institucionais do IIV, consolidando o padrão
 * (cabeçalho com título/subtítulo + linha divisória verde, tabelas via
 * autoTable, blocos de texto, assinaturas e rodapé) usado hoje de forma
 * duplicada em `missionGuidePdf.ts` e nas páginas admin.
 *
 * Não substitui os geradores existentes — é a base para futura migração.
 */

export type PdfSectionAccent = "green" | "gold";
export type PdfTableTheme = "grid" | "striped";

export interface PdfSection {
  type: "table" | "text" | "signatures" | "spacer";

  /** Título opcional da secção (ex: "Participantes", "Notas"). Usado em "table" e "text". */
  title?: string;

  // --- type: "table" ---
  head?: string[][];
  body?: (string | number)[][];
  /** Tema do autoTable. Default: "grid" para accent "green", "striped" para "gold". */
  theme?: PdfTableTheme;
  /** Cor do cabeçalho da tabela. "green" = institucional, "gold" = secundário. Default: "green". */
  accent?: PdfSectionAccent;

  // --- type: "text" ---
  text?: string;

  // --- type: "signatures" ---
  signatures?: { label: string }[];

  // --- type: "spacer" ---
  /** Altura do espaço a avançar, em mm. Default: 12. */
  height?: number;
}

export interface GenerateInstitutionalPdfOptions {
  /** Subtítulo do documento (ex: "Guia de Marcha — Missão de Serviço"). */
  title: string;
  /** Nome do ficheiro a descarregar. Espaços são convertidos em hífens; ".pdf" é acrescentado se faltar. */
  filename: string;
  sections: PdfSection[];
  /** Default: "Instituto de Investigação Veterinária". */
  orgName?: string;
}

const ACCENT_STYLES: Record<PdfSectionAccent, { fillColor: [number, number, number]; textColor: number; defaultTheme: PdfTableTheme }> = {
  green: { fillColor: [34, 87, 55], textColor: 255, defaultTheme: "grid" },
  gold: { fillColor: [212, 175, 55], textColor: 30, defaultTheme: "striped" },
};

const PAGE_BOTTOM_LIMIT = 270; // a partir daqui, secções de texto/assinaturas saltam de página
const CONTENT_WIDTH = 170; // largura útil para splitTextToSize (mesma do missionGuidePdf.ts)

function sanitizeFilename(filename: string): string {
  const trimmed = filename.trim().replace(/\s+/g, "-");
  return trimmed.toLowerCase().endsWith(".pdf") ? trimmed : `${trimmed}.pdf`;
}

function drawHeader(doc: jsPDF, orgName: string, title: string): number {
  doc.setFontSize(16);
  doc.setFont(PDF_HEADING_FONT, "bold");
  doc.text(orgName, 105, 18, { align: "center" });

  doc.setFontSize(11);
  doc.setFont(PDF_HEADING_FONT, "normal");
  doc.text(title, 105, 26, { align: "center" });

  doc.setDrawColor(34, 87, 55);
  doc.setLineWidth(0.6);
  doc.line(20, 31, 190, 31);

  // cursor inicial de conteúdo, logo abaixo da linha divisória
  return 39;
}

function drawFooterOnAllPages(doc: jsPDF): void {
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.setFont(PDF_BODY_FONT, "normal");
    doc.text("Documento gerado automaticamente pelo sistema do IIV.", 105, 285, { align: "center" });
  }
}

function ensureSpace(doc: jsPDF, cursorY: number, needed: number): number {
  if (cursorY + needed > PAGE_BOTTOM_LIMIT) {
    doc.addPage();
    return 20;
  }
  return cursorY;
}

function renderTableSection(doc: jsPDF, section: PdfSection, cursorY: number): number {
  const accentKey = section.accent ?? "green";
  const accent = ACCENT_STYLES[accentKey];
  const theme = section.theme ?? accent.defaultTheme;

  let tableStartY = cursorY;

  if (section.title) {
    cursorY = ensureSpace(doc, cursorY, 20);
    const titleY = cursorY + 12;
    doc.setFontSize(12);
    doc.setFont(PDF_HEADING_FONT, "bold");
    doc.text(section.title, 20, titleY);
    tableStartY = cursorY + 16;
  } else {
    tableStartY = cursorY + 6;
  }

  autoTable(doc, {
    startY: tableStartY,
    head: section.head ?? [],
    body: section.body ?? [],
    theme,
    headStyles: {
      fillColor: accent.fillColor,
      font: PDF_HEADING_FONT,
      fontStyle: "bold",
      textColor: accent.textColor,
    },
    styles: { fontSize: 10, font: PDF_BODY_FONT },
  });

  const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY;
  return finalY ?? tableStartY + 20;
}

function renderTextSection(doc: jsPDF, section: PdfSection, cursorY: number): number {
  let y = cursorY;

  if (section.title) {
    y = ensureSpace(doc, y, 24);
    y += 12;
    doc.setFontSize(11);
    doc.setFont(PDF_HEADING_FONT, "bold");
    doc.text(section.title, 20, y);
    y += 8;
  } else {
    y = ensureSpace(doc, y, 20);
    y += 12;
  }

  doc.setFontSize(10);
  doc.setFont(PDF_BODY_FONT, "normal");
  const lines: string[] = doc.splitTextToSize(section.text ?? "", CONTENT_WIDTH);
  doc.text(lines, 20, y);

  // altura aproximada do bloco de texto (fonte 10pt ~ 5mm por linha)
  return y + lines.length * 5;
}

function renderSignaturesSection(doc: jsPDF, section: PdfSection, cursorY: number): number {
  const signatures = section.signatures ?? [];
  if (signatures.length === 0) return cursorY;

  const y = ensureSpace(doc, cursorY, 40) + 24;
  const lineY = y;
  const labelY = y + 6;

  doc.setDrawColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont(PDF_BODY_FONT, "normal");

  const marginX = 25;
  const usableWidth = 190 - marginX; // até à margem direita (185)
  const slotWidth = usableWidth / signatures.length;
  const lineWidth = Math.min(65, slotWidth - 10);

  signatures.forEach((sig, i) => {
    const slotStart = marginX + i * slotWidth;
    const lineStart = slotStart + (slotWidth - lineWidth) / 2;
    const lineEnd = lineStart + lineWidth;
    doc.line(lineStart, lineY, lineEnd, lineY);
    doc.text(sig.label, slotStart + slotWidth / 2, labelY, { align: "center" });
  });

  return labelY + 6;
}

export async function generateInstitutionalPdf(options: GenerateInstitutionalPdfOptions): Promise<void> {
  const { title, filename, sections, orgName = "Instituto de Investigação Veterinária" } = options;

  const doc = new jsPDF();
  await ensurePdfFonts(doc);

  let cursorY = drawHeader(doc, orgName, title);

  for (const section of sections) {
    switch (section.type) {
      case "table":
        cursorY = renderTableSection(doc, section, cursorY);
        break;
      case "text":
        cursorY = renderTextSection(doc, section, cursorY);
        break;
      case "signatures":
        cursorY = renderSignaturesSection(doc, section, cursorY);
        break;
      case "spacer":
        cursorY += section.height ?? 12;
        break;
      default:
        break;
    }
  }

  drawFooterOnAllPages(doc);

  doc.save(sanitizeFilename(filename));
}
