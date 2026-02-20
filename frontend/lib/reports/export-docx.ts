import { saveAs } from "file-saver"
import type { ReportDocumentV1, ReportTableRow } from "./report-types"

function safeText(s: any) {
  return String(s ?? "").replace(/\s+/g, " ").trim()
}

function fmtChf(v: number, lang: "de" | "en") {
  const n = Number(v || 0)
  try {
    return `CHF ${Math.round(n).toLocaleString(lang === "de" ? "de-CH" : "en-US")}`
  } catch {
    return `CHF ${Math.round(n)}`
  }
}

function tableFromRows(rows: ReportTableRow[], maxRows = 12) {
  const r = (rows || []).slice(0, maxRows)
  if (r.length === 0) return null
  const cols = Array.from(
    r.reduce((acc, row) => {
      Object.keys(row || {}).forEach((k) => acc.add(k))
      return acc
    }, new Set<string>()),
  ).slice(0, 5)

  const header = `<tr>${cols.map((c) => `<th>${escapeHtml(c)}</th>`).join("")}</tr>`
  const body = r
    .map((row) => `<tr>${cols.map((c) => `<td>${escapeHtml(String((row as any)?.[c] ?? ""))}</td>`).join("")}</tr>`)
    .join("")
  return `<table>${header}${body}</table>`
}

function escapeHtml(s: string) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

function ul(items: string[]) {
  const li = (items || [])
    .map((x) => safeText(x))
    .filter(Boolean)
    .map((x) => `<li>${escapeHtml(x)}</li>`)
    .join("")
  return li ? `<ul>${li}</ul>` : `<div style="color:#6b7280">—</div>`
}

function section(title: string, inner: string) {
  return `<h2>${escapeHtml(title)}</h2>${inner}`
}

export async function exportReportToDOCX(report: ReportDocumentV1, filenameBase: string) {
  const langIsDe = report.meta.language === "de"
  const company = safeText(report.meta.company)
  const period = `${safeText(report.meta.period?.from || "")} – ${safeText(report.meta.period?.to || "")}`.trim()
  const lang = report.meta.language

  const css = `
  body{ font-family: Arial, Helvetica, sans-serif; color:#0f172a; line-height:1.5; }
  h1{ font-size:22pt; margin:0 0 10pt 0; }
  h2{ font-size:14pt; margin:18pt 0 8pt 0; }
  .meta{ color:#475569; font-size:10pt; margin-bottom:6pt; }
  .kpi{ border:1px solid #e2e8f0; border-radius:10pt; padding:10pt; margin:8pt 0; }
  table{ width:100%; border-collapse:collapse; font-size:9.5pt; }
  th,td{ border:1px solid #e2e8f0; padding:6pt; vertical-align:top; }
  th{ background:#f8fafc; }
  ul{ margin:6pt 0 10pt 18pt; }
  `

  const kpiBlock = `
    <div class="kpi"><b>${langIsDe ? "Pipeline" : "Pipeline"}:</b> ${escapeHtml(fmtChf(report.kpis.pipelineValue, lang))}</div>
    <div class="kpi"><b>${langIsDe ? "Won" : "Won"}:</b> ${escapeHtml(fmtChf(report.kpis.wonValue, lang))}</div>
    <div class="kpi"><b>${langIsDe ? "Deals" : "Deals"}:</b> ${escapeHtml(String(report.kpis.totalDeals))}</div>
    <div class="kpi"><b>${langIsDe ? "Aktivitäten" : "Activities"}:</b> ${escapeHtml(String(report.kpis.activities))}</div>
    <div class="kpi"><b>${langIsDe ? "Events" : "Events"}:</b> ${escapeHtml(String(report.kpis.events))}</div>
    <div class="kpi"><b>${langIsDe ? "Uploads" : "Uploads"}:</b> ${escapeHtml(String(report.kpis.uploads))}</div>
    <div class="kpi"><b>${langIsDe ? "Jobs" : "Jobs"}:</b> ${escapeHtml(String(report.kpis.jobs))}</div>
  `

  const maybeTable = (title: string, rows: ReportTableRow[], maxRows: number) => {
    const t = tableFromRows(rows, maxRows)
    if (!t) return ""
    return section(title, t)
  }

  const html = `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <style>${css}</style>
    </head>
    <body>
      <h1>${escapeHtml(report.meta.title || "Executive Report")}</h1>
      ${company ? `<div class="meta"><b>${escapeHtml(langIsDe ? "Firma" : "Company")}:</b> ${escapeHtml(company)}</div>` : ""}
      <div class="meta"><b>${escapeHtml(langIsDe ? "Zeitraum" : "Period")}:</b> ${escapeHtml(period)}</div>
      <div class="meta"><b>${escapeHtml(langIsDe ? "Generiert am" : "Generated on")}:</b> ${escapeHtml(safeText(report.meta.generatedAtText))}</div>
      ${report.meta.logoUrl ? `<div style="margin:10pt 0"><img src="${escapeHtml(report.meta.logoUrl)}" style="max-height:60pt;max-width:220pt;object-fit:contain" /></div>` : ""}

      ${section(langIsDe ? "KPIs" : "KPIs", kpiBlock)}
      ${section(langIsDe ? "Zusammenfassung" : "Executive Summary", ul(report.narrative.executiveSummary))}
      ${report.sections?.changes !== false ? section(langIsDe ? "Was hat sich verändert" : "What changed", ul(report.narrative.whatChanged)) : ""}
      ${report.sections?.insights !== false ? section("AI Insights", ul(report.narrative.keyInsights)) : ""}
      ${report.sections?.insights !== false ? section(langIsDe ? "Ergebnisse" : "Results", ul(report.narrative.results)) : ""}
      ${report.sections?.risks !== false ? section(langIsDe ? "Risiken" : "Risks", ul(report.narrative.risks)) : ""}
      ${section(langIsDe ? "Empfehlungen" : "Recommendations", ul(report.narrative.recommendations))}
      ${report.sections?.conclusion !== false ? section(langIsDe ? "Fazit" : "Conclusion", `<div>${escapeHtml(report.narrative.conclusion)}</div>`) : ""}

      ${report.sections?.pipeline !== false ? maybeTable(langIsDe ? "Top Deals" : "Top Deals", report.tables.topDeals, 12) : ""}
      ${report.sections?.activities !== false ? maybeTable(langIsDe ? "Aktivitäten (Auszug)" : "Activities (excerpt)", report.tables.recentActivities, 12) : ""}
      ${report.sections?.calendar !== false ? maybeTable(langIsDe ? "Kalender (Auszug)" : "Calendar (excerpt)", report.tables.keyEvents, 12) : ""}
      ${report.sections?.crm !== false ? maybeTable(langIsDe ? "Unternehmen (neu/aktualisiert)" : "Companies (new/updated)", report.tables.recentCompanies, 10) : ""}
      ${report.sections?.crm !== false ? maybeTable(langIsDe ? "Kontakte (neu/aktualisiert)" : "Contacts (new/updated)", report.tables.recentContacts, 10) : ""}
      ${report.sections?.uploads !== false ? maybeTable(langIsDe ? "Uploads (Auszug)" : "Uploads (excerpt)", report.tables.uploads, 10) : ""}
      ${report.sections?.uploads !== false ? maybeTable(langIsDe ? "Jobs (Auszug)" : "Jobs (excerpt)", report.tables.jobs, 10) : ""}
    </body>
  </html>`

  const blob = new Blob(["\ufeff", html], { type: "application/msword;charset=utf-8" })
  saveAs(blob, `${filenameBase}.doc`)
}

