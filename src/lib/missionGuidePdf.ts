import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ensurePdfFonts, PDF_HEADING_FONT, PDF_BODY_FONT } from "@/lib/pdfFonts";

export interface MissionGuideData {
  mission: {
    title: string;
    destination: string;
    purpose: string | null;
    start_date: string;
    end_date: string;
    budget: number;
    currency: string;
  };
  guide: {
    guide_number: string;
    issue_date: string;
    per_diem: number;
    transport: string | null;
    notes: string | null;
  };
  participants: { full_name: string; role: string; per_diem: number }[];
}

const fmt = (d: string) => new Date(d).toLocaleDateString("pt-AO");
const money = (n: number, c: string) => `${Number(n || 0).toLocaleString("pt-PT")} ${c}`;

export async function generateMissionGuidePdf(data: MissionGuideData) {
  const doc = new jsPDF();
  await ensurePdfFonts(doc);

  // Cabeçalho
  doc.setFontSize(16); doc.setFont(PDF_HEADING_FONT, "bold");
  doc.text("Instituto de Investigação Veterinária", 105, 18, { align: "center" });
  doc.setFontSize(11); doc.setFont(PDF_HEADING_FONT, "normal");
  doc.text("Guia de Marcha — Missão de Serviço", 105, 26, { align: "center" });
  doc.setDrawColor(34, 87, 55); doc.setLineWidth(0.6); doc.line(20, 31, 190, 31);

  // Bloco da guia
  doc.setFontSize(10); doc.setFont(PDF_BODY_FONT, "normal");
  doc.text(`Nº da Guia: ${data.guide.guide_number}`, 20, 39);
  doc.text(`Data de Emissão: ${fmt(data.guide.issue_date)}`, 130, 39);

  // Dados da missão
  autoTable(doc, {
    startY: 45,
    head: [["Campo", "Valor"]],
    body: [
      ["Título", data.mission.title],
      ["Destino", data.mission.destination],
      ["Objectivo", data.mission.purpose || "—"],
      ["Início", fmt(data.mission.start_date)],
      ["Fim", fmt(data.mission.end_date)],
      ["Transporte", data.guide.transport || "—"],
      ["Per Diem base", money(data.guide.per_diem, data.mission.currency)],
      ["Orçamento total", money(data.mission.budget, data.mission.currency)],
    ],
    theme: "grid",
    headStyles: { fillColor: [34, 87, 55], font: PDF_HEADING_FONT, fontStyle: "bold", textColor: 255 },
    styles: { fontSize: 10, font: PDF_BODY_FONT },
  });

  // Participantes
  const finalY = (doc as any).lastAutoTable?.finalY ?? 100;
  doc.setFontSize(12); doc.setFont(PDF_HEADING_FONT, "bold");
  doc.text("Participantes", 20, finalY + 12);

  autoTable(doc, {
    startY: finalY + 16,
    head: [["Nome", "Função", "Per Diem"]],
    body: data.participants.length
      ? data.participants.map((p) => [p.full_name, p.role || "—", money(p.per_diem, data.mission.currency)])
      : [["—", "—", "—"]],
    theme: "striped",
    headStyles: { fillColor: [212, 175, 55], font: PDF_HEADING_FONT, fontStyle: "bold", textColor: 30 },
    styles: { fontSize: 10, font: PDF_BODY_FONT },
  });

  // Notas
  if (data.guide.notes) {
    const y2 = (doc as any).lastAutoTable?.finalY ?? 160;
    doc.setFontSize(11); doc.setFont(PDF_HEADING_FONT, "bold"); doc.text("Notas", 20, y2 + 12);
    doc.setFont(PDF_BODY_FONT, "normal"); doc.setFontSize(10);
    doc.text(doc.splitTextToSize(data.guide.notes, 170), 20, y2 + 20);
  }

  // Assinaturas
  doc.setFontSize(10); doc.setFont(PDF_BODY_FONT, "normal");
  doc.line(25, 255, 90, 255); doc.text("Director-Geral", 40, 261);
  doc.line(120, 255, 185, 255); doc.text("Responsável da Missão", 130, 261);

  doc.setFontSize(8); doc.setTextColor(128);
  doc.text("Documento gerado automaticamente pelo sistema do IIV.", 105, 285, { align: "center" });

  doc.save(`guia-marcha-${data.guide.guide_number.replace(/\s+/g, "-")}.pdf`);
}
