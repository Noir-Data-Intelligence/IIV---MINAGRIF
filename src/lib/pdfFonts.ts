import type jsPDF from "jspdf";

/**
 * Registra Space Grotesk (títulos) e DM Sans (corpo) num documento jsPDF.
 * As fontes são carregadas uma única vez e cacheadas em memória.
 *
 * Após chamar `ensurePdfFonts(doc)`:
 *  - `doc.setFont(PDF_HEADING_FONT)` aplica Space Grotesk
 *  - `doc.setFont(PDF_BODY_FONT)` aplica DM Sans
 *  - autoTable: `styles: { font: PDF_BODY_FONT }`, `headStyles: { font: PDF_HEADING_FONT }`
 */

export const PDF_HEADING_FONT = "SpaceGrotesk";
export const PDF_BODY_FONT = "DMSans";

const SPACE_GROTESK_URL =
  "https://raw.githubusercontent.com/google/fonts/main/ofl/spacegrotesk/SpaceGrotesk%5Bwght%5D.ttf";
const DM_SANS_URL =
  "https://raw.githubusercontent.com/google/fonts/main/ofl/dmsans/DMSans%5Bopsz,wght%5D.ttf";

let cache: Promise<{ heading: string; body: string }> | null = null;

async function fetchAsBase64(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Falha a obter fonte: ${url}`);
  const buf = await res.arrayBuffer();
  // Conversão eficiente para base64 sem rebentar a stack
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(
      null,
      bytes.subarray(i, i + chunk) as unknown as number[],
    );
  }
  return btoa(binary);
}

function loadFonts() {
  if (!cache) {
    cache = Promise.all([
      fetchAsBase64(SPACE_GROTESK_URL),
      fetchAsBase64(DM_SANS_URL),
    ])
      .then(([heading, body]) => ({ heading, body }))
      .catch((err) => {
        cache = null; // permite nova tentativa
        throw err;
      });
  }
  return cache;
}

export async function ensurePdfFonts(doc: jsPDF): Promise<void> {
  try {
    const { heading, body } = await loadFonts();

    doc.addFileToVFS("SpaceGrotesk.ttf", heading);
    doc.addFont("SpaceGrotesk.ttf", PDF_HEADING_FONT, "normal");
    doc.addFont("SpaceGrotesk.ttf", PDF_HEADING_FONT, "bold");

    doc.addFileToVFS("DMSans.ttf", body);
    doc.addFont("DMSans.ttf", PDF_BODY_FONT, "normal");
    doc.addFont("DMSans.ttf", PDF_BODY_FONT, "bold");
  } catch (err) {
    // Em caso de falha de rede, mantemos helvetica como fallback silencioso.
    console.warn("[pdfFonts] fallback para helvetica:", err);
  }
}
