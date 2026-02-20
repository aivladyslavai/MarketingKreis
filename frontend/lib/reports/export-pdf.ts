import jsPDF from "jspdf"
import type { ReportDocumentV1, ReportTableRow } from "./report-types"

function fmtChf(v: number) {
  const n = Number(v || 0)
  try {
    return `CHF ${Math.round(n).toLocaleString("de-CH")}`
  } catch {
    return `CHF ${Math.round(n)}`
  }
}

function safeText(s: any) {
  return String(s ?? "").replace(/\s+/g, " ").trim()
}

function asLines(doc: jsPDF, text: string, maxWidth: number) {
  return doc.splitTextToSize(text, maxWidth) as string[]
}

function pickCols(rows: ReportTableRow[]) {
  const keys = new Set<string>()
  for (const r of rows || []) Object.keys(r || {}).forEach((k) => keys.add(k))
  return Array.from(keys)
}

export async function exportReportToPDF(report: ReportDocumentV1, filenameBase: string) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 14
  const maxW = pageW - margin * 2

  let y = 18

  const ensure = (need: number) => {
    if (y + need <= pageH - margin) return
    doc.addPage()
    y = 18
  }

  const h1 = (t: string) => {
    ensure(14)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(18)
    doc.text(t, margin, y)
    y += 9
  }
  const h2 = (t: string) => {
    ensure(12)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(13)
    doc.text(t, margin, y)
    y += 7
  }
  const p = (t: string) => {
    const lines = asLines(doc, t, maxW)
    ensure(lines.length * 5 + 2)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10.5)
    doc.text(lines, margin, y)
    y += lines.length * 5 + 2
  }
  const bullets = (items: string[]) => {
    for (const raw of items || []) {
      const t = safeText(raw)
      if (!t) continue
      const lines = asLines(doc, t, maxW - 6)
      ensure(lines.length * 5 + 2)
      doc.setFont("helvetica", "normal")
      doc.setFontSize(10.5)
      doc.text("•", margin, y)
      doc.text(lines, margin + 4, y)
      y += lines.length * 5 + 1.5
    }
    y += 2
  }

  const kpiRow = (label: string, value: string) => {
    ensure(8)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10.5)
    doc.text(label, margin, y)
    doc.setFont("helvetica", "bold")
    doc.text(value, pageW - margin, y, { align: "right" })
    y += 6
  }

  const table = (title: string, rows: ReportTableRow[], maxRows = 12) => {
    const r = (rows || []).slice(0, maxRows)
    if (r.length === 0) return
    const cols = pickCols(r).slice(0, 4)
    h2(title)
    ensure(8)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9.5)
    const colW = maxW / cols.length
    let x = margin
    for (const c of cols) {
      doc.text(safeText(c), x, y)
      x += colW
    }
    y += 5
    doc.setDrawColor(220)
    doc.line(margin, y, pageW - margin, y)
    y += 3
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9.5)
    for (const row of r) {
      const lineYStart = y
      let maxLines = 1
      const cellLines: string[][] = []
      for (const c of cols) {
        const txt = safeText((row as any)?.[c])
        const lines = asLines(doc, txt, colW - 2)
        cellLines.push(lines)
        maxLines = Math.max(maxLines, lines.length || 1)
      }
      ensure(maxLines * 4.5 + 4)
      x = margin
      for (let i = 0; i < cols.length; i++) {
        doc.text(cellLines[i], x, y)
        x += colW
      }
      y = lineYStart + maxLines * 4.5 + 2
      doc.setDrawColor(240)
      doc.line(margin, y, pageW - margin, y)
      y += 3
    }
    y += 3
  }

  // Cover
  h1(report.meta.title || "Executive Report")
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10.5)
  const company = safeText(report.meta.company)
  const period = `${safeText(report.meta.period?.from || "")} – ${safeText(report.meta.period?.to || "")}`.trim()
  p(`${company ? `${company} · ` : ""}${period}`)
  p(`${report.meta.language === "de" ? "Generiert am" : "Generated on"}: ${safeText(report.meta.generatedAtText)}`)

  if (report.meta.logoUrl && report.meta.logoUrl.startsWith("data:image/")) {
    try {
      // Place small logo top-right on first page
      doc.addImage(report.meta.logoUrl, "PNG", pageW - margin - 34, 12, 34, 12, undefined, "FAST")
    } catch {
      // ignore image errors
    }
  }

  ensure(8)
  doc.setDrawColor(230)
  doc.line(margin, y, pageW - margin, y)
  y += 6

  // KPIs
  h2(report.meta.language === "de" ? "KPIs" : "KPIs")
  kpiRow(report.meta.language === "de" ? "Pipeline" : "Pipeline", fmtChf(report.kpis.pipelineValue))
  kpiRow(report.meta.language === "de" ? "Won" : "Won", fmtChf(report.kpis.wonValue))
  kpiRow(report.meta.language === "de" ? "Deals" : "Deals", String(report.kpis.totalDeals))
  kpiRow(report.meta.language === "de" ? "Aktivitäten" : "Activities", String(report.kpis.activities))
  kpiRow(report.meta.language === "de" ? "Kalender Events" : "Calendar Events", String(report.kpis.events))
  kpiRow(report.meta.language === "de" ? "Uploads" : "Uploads", String(report.kpis.uploads))
  kpiRow(report.meta.language === "de" ? "Jobs" : "Jobs", String(report.kpis.jobs))
  y += 4

  // Narrative
  h2(report.meta.language === "de" ? "Zusammenfassung" : "Executive Summary")
  bullets(report.narrative.executiveSummary)

  if (report.sections?.changes !== false) {
    h2(report.meta.language === "de" ? "Was hat sich verändert" : "What changed")
    bullets(report.narrative.whatChanged)
  }

  if (report.sections?.insights !== false) {
    h2(report.meta.language === "de" ? "AI Insights" : "AI Insights")
    bullets(report.narrative.keyInsights)
    h2(report.meta.language === "de" ? "Ergebnisse" : "Results")
    bullets(report.narrative.results)
  }

  if (report.sections?.risks !== false) {
    h2(report.meta.language === "de" ? "Risiken" : "Risks")
    bullets(report.narrative.risks)
  }

  h2(report.meta.language === "de" ? "Empfehlungen" : "Recommendations")
  bullets(report.narrative.recommendations)

  if (report.sections?.conclusion !== false) {
    h2(report.meta.language === "de" ? "Fazit" : "Conclusion")
    p(report.narrative.conclusion)
  }

  // Tables
  if (report.sections?.pipeline !== false) table(report.meta.language === "de" ? "Top Deals" : "Top Deals", report.tables.topDeals, 10)
  if (report.sections?.activities !== false) table(report.meta.language === "de" ? "Aktivitäten (Auszug)" : "Activities (excerpt)", report.tables.recentActivities, 10)
  if (report.sections?.calendar !== false) table(report.meta.language === "de" ? "Kalender (Auszug)" : "Calendar (excerpt)", report.tables.keyEvents, 10)
  if (report.sections?.crm !== false) {
    table(report.meta.language === "de" ? "Unternehmen (neu/aktualisiert)" : "Companies (new/updated)", report.tables.recentCompanies, 8)
    table(report.meta.language === "de" ? "Kontakte (neu/aktualisiert)" : "Contacts (new/updated)", report.tables.recentContacts, 8)
  }
  if (report.sections?.uploads !== false) {
    table(report.meta.language === "de" ? "Uploads (Auszug)" : "Uploads (excerpt)", report.tables.uploads, 8)
    table(report.meta.language === "de" ? "Jobs (Auszug)" : "Jobs (excerpt)", report.tables.jobs, 8)
  }

  doc.save(`${filenameBase}.pdf`)
}

