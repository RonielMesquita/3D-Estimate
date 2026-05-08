import jsPDF from "jspdf"
import { Phase } from "@/types/project"

export function generateProposalPDF(activePhases: Phase[], total: number, days: number) {
  const doc = new jsPDF()
  const today = new Date().toLocaleDateString("pt-BR")
  const weeks = Math.ceil(days / 5)

  // ── Header bar ─────────────────────────────────────────────────
  doc.setFillColor(10, 12, 28)
  doc.rect(0, 0, 210, 38, "F")

  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(20)
  doc.text("BeachLife", 18, 20)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.setTextColor(140, 180, 220)
  doc.text("3D Construction Estimator", 18, 29)

  doc.setTextColor(180, 180, 180)
  doc.setFontSize(9)
  doc.text(today, 192, 20, { align: "right" })

  // ── Title ──────────────────────────────────────────────────────
  doc.setTextColor(30, 30, 30)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(15)
  doc.text("Proposta de Construção", 18, 52)

  // ── Summary box ────────────────────────────────────────────────
  doc.setFillColor(237, 247, 255)
  doc.roundedRect(18, 57, 174, 24, 3, 3, "F")

  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(80, 80, 80)
  doc.text("Investimento Total", 24, 65)
  doc.text("Duração", 120, 65)
  doc.text("Prazo", 160, 65)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(14)
  doc.setTextColor(10, 12, 28)
  doc.text(`$${total.toLocaleString()}`, 24, 75)

  doc.setFontSize(11)
  doc.text(`${days} dias`, 120, 75)
  doc.text(`${weeks} semanas`, 160, 75)

  // ── Phases table ───────────────────────────────────────────────
  let y = 92

  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.setTextColor(30, 30, 30)
  doc.text("Fases Selecionadas", 18, y)
  y += 6

  // Table header
  doc.setFillColor(30, 58, 95)
  doc.rect(18, y, 174, 8, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(8)
  doc.setFont("helvetica", "bold")
  doc.text("Fase", 22, y + 5.5)
  doc.text("Categoria", 105, y + 5.5)
  doc.text("Dias", 148, y + 5.5)
  doc.text("Valor", 172, y + 5.5)
  y += 8

  // Rows
  doc.setFont("helvetica", "normal")
  activePhases.forEach((phase, idx) => {
    const rowColor = idx % 2 === 0 ? [248, 250, 252] : [255, 255, 255]
    doc.setFillColor(rowColor[0], rowColor[1], rowColor[2])
    doc.rect(18, y, 174, 7, "F")

    doc.setTextColor(30, 30, 30)
    doc.setFontSize(8)
    // Truncate long names
    const name = phase.name.length > 42 ? phase.name.substring(0, 40) + "…" : phase.name
    doc.text(name, 22, y + 4.8)
    doc.text(phase.category, 105, y + 4.8)
    doc.text(phase.duration, 150, y + 4.8)
    doc.text(`$${phase.price.toLocaleString()}`, 192, y + 4.8, { align: "right" })
    y += 7
  })

  // Total row
  y += 2
  doc.setDrawColor(30, 58, 95)
  doc.setLineWidth(0.4)
  doc.line(18, y, 192, y)
  y += 6
  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.setTextColor(10, 12, 28)
  doc.text("Total", 148, y)
  doc.text(`$${total.toLocaleString()}`, 192, y, { align: "right" })

  // ── Footer ────────────────────────────────────────────────────
  doc.setFont("helvetica", "normal")
  doc.setFontSize(7.5)
  doc.setTextColor(160, 160, 160)
  doc.text("Valores são estimativas indicativas. BeachLife Construction.", 18, 286)

  doc.save("beachlife-proposta.pdf")
}
