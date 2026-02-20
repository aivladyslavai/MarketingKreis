import { NextRequest, NextResponse } from 'next/server'

type Lang = 'de' | 'en'
type Tone = 'executive' | 'neutral' | 'marketing'

function safeText(v: any) {
  return String(v ?? '').replace(/\s+/g, ' ').trim()
}

function toNumber(v: any) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function fmtChf(v: any, lang: Lang) {
  const n = toNumber(v)
  try {
    const s = Math.round(n).toLocaleString(lang === 'de' ? 'de-CH' : 'en-US')
    return `CHF ${s}`
  } catch {
    return `CHF ${Math.round(n)}`
  }
}

function dateLabel(d: any, lang: Lang) {
  try {
    const dt = new Date(d)
    if (!Number.isFinite(dt.getTime())) return safeText(d)
    if (lang === 'de') return dt.toLocaleDateString('de-CH')
    return dt.toISOString().slice(0, 10)
  } catch {
    return safeText(d)
  }
}

function pickTop<T>(arr: T[], n: number, score: (x: T) => number) {
  return (Array.isArray(arr) ? arr : [])
    .slice()
    .sort((a, b) => score(b) - score(a))
    .slice(0, n)
}

function inRangeFactory(fromDate: Date | null, toDate: Date | null) {
  return (d: any) => {
    const dt = d ? new Date(d) : null
    if (!dt || !Number.isFinite(dt.getTime())) return false
    if (fromDate && dt < fromDate) return false
    if (toDate && dt > toDate) return false
    return true
  }
}

function renderReportHtml(opts: {
  style: string
  meta: { title: string; company?: string; logoUrl?: string; periodText: string; generatedAtText: string; lang: Lang }
  kpis: { pipelineValue: number; wonValue: number; totalDeals: number; uploads: number; jobs: number; activities: number; events: number }
  deltas: { label: string; prev?: number | null; value: number; delta?: number | null }[]
  narrative: {
    executiveSummary: string[]
    whatChanged: string[]
    keyInsights: string[]
    results: string[]
    risks: string[]
    recommendations: string[]
    conclusion: string
  }
  sections: Record<string, boolean>
  tables: {
    topDeals: any[]
    recentActivities: any[]
    keyEvents: any[]
    recentCompanies: any[]
    recentContacts: any[]
    uploads: any[]
    jobs: any[]
  }
}) {
  const { style, meta, kpis, deltas, narrative, sections, tables } = opts

  const esc = (s: any) =>
    String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')

  const list = (items: string[]) => {
    const rows = (items || []).map((x) => `<li>${esc(x)}</li>`).join('')
    return rows ? `<ul>${rows}</ul>` : `<div class="muted">${meta.lang === 'de' ? '—' : '—'}</div>`
  }

  const deltaPill = (d?: number | null) => {
    if (d == null || !Number.isFinite(d)) return ''
    const cls = d > 0 ? 'badge' : d < 0 ? 'badge' : 'badge'
    const sign = d > 0 ? '+' : ''
    return `<span class="${cls}">${sign}${Math.round(d)}</span>`
  }

  const table = (title: string, rows: any[], cols: { key: string; label: string }[]) => {
    const r = Array.isArray(rows) ? rows : []
    const body =
      r.length === 0
        ? `<div class="muted">${meta.lang === 'de' ? 'Keine Daten' : 'No data'}</div>`
        : `<table><thead><tr>${cols.map((c) => `<th>${esc(c.label)}</th>`).join('')}</tr></thead><tbody>${r
            .slice(0, 10)
            .map((row) => `<tr>${cols.map((c) => `<td>${esc((row as any)?.[c.key] ?? '')}</td>`).join('')}</tr>`)
            .join('')}</tbody></table>`
    return `<div class="card"><div class="card-h">${esc(title)}</div><div class="card-b">${body}</div></div>`
  }

  const kpiCards = [
    { k: 'pipeline', label: meta.lang === 'de' ? 'Pipeline' : 'Pipeline', value: fmtChf(kpis.pipelineValue, meta.lang) },
    { k: 'won', label: meta.lang === 'de' ? 'Won' : 'Won', value: fmtChf(kpis.wonValue, meta.lang) },
    { k: 'deals', label: meta.lang === 'de' ? 'Deals' : 'Deals', value: String(kpis.totalDeals) },
    { k: 'activities', label: meta.lang === 'de' ? 'Aktivitäten' : 'Activities', value: String(kpis.activities) },
    { k: 'events', label: meta.lang === 'de' ? 'Events' : 'Events', value: String(kpis.events) },
  ]

  const include = (k: string) => (sections?.[k] ?? true) !== false

  const changesBlock =
    include('changes') && deltas?.length
      ? `<div class="card"><div class="card-h">${esc(meta.lang === 'de' ? 'Was hat sich verändert' : 'What changed')}</div><div class="card-b">
          <table>
            <thead><tr><th>${esc(meta.lang === 'de' ? 'Metrik' : 'Metric')}</th><th>${esc(meta.lang === 'de' ? 'Vorher' : 'Previous')}</th><th>${esc(meta.lang === 'de' ? 'Jetzt' : 'Now')}</th><th>${esc(meta.lang === 'de' ? 'Delta' : 'Delta')}</th></tr></thead>
            <tbody>
              ${deltas
                .map((d) => `<tr><td>${esc(d.label)}</td><td>${esc(d.prev ?? '')}</td><td>${esc(d.value)}</td><td>${deltaPill(d.delta)}</td></tr>`)
                .join('')}
            </tbody>
          </table>
        </div></div>`
      : ''

  const html = `
<style>${style}</style>
<main>
  <div class="cover">
    <div class="brandbar">
      <div>
        <div class="title">${esc(meta.title)}</div>
        <div class="meta muted">${esc(meta.company ? `${meta.company} · ${meta.periodText}` : meta.periodText)}</div>
        <div class="meta muted">${esc(meta.lang === 'de' ? 'Generiert am' : 'Generated on')}: ${esc(meta.generatedAtText)}</div>
      </div>
      ${meta.logoUrl ? `<img class="logo" alt="Logo" src="${esc(meta.logoUrl)}" />` : `<div></div>`}
    </div>
  </div>

  ${include('kpi') ? `<div class="kpi-grid">
    ${kpiCards.map((k) => `<div class="kpi"><div class="label">${esc(k.label)}</div><div class="value">${esc(k.value)}</div></div>`).join('')}
  </div>` : ''}

  ${changesBlock}

  <h2>${esc(meta.lang === 'de' ? 'Zusammenfassung' : 'Executive Summary')}</h2>
  ${list(narrative.executiveSummary)}

  ${include('insights') ? `<h2>${esc(meta.lang === 'de' ? 'AI Insights' : 'AI Insights')}</h2>${list(narrative.keyInsights)}` : ''}
  ${include('insights') ? `<h2>${esc(meta.lang === 'de' ? 'Ergebnisse' : 'Results')}</h2>${list(narrative.results)}` : ''}

  ${include('risks') ? `<h2>${esc(meta.lang === 'de' ? 'Risiken' : 'Risks')}</h2>${list(narrative.risks)}` : ''}

  <h2>${esc(meta.lang === 'de' ? 'Empfehlungen' : 'Recommendations')}</h2>
  ${list(narrative.recommendations)}

  ${include('conclusion') ? `<h2>${esc(meta.lang === 'de' ? 'Fazit' : 'Conclusion')}</h2><div class="card"><div class="card-b">${esc(narrative.conclusion)}</div></div>` : ''}

  ${include('pipeline') ? table(meta.lang === 'de' ? 'Top Deals' : 'Top Deals', tables.topDeals, [
    { key: 'ID', label: 'ID' },
    { key: meta.lang === 'de' ? 'Titel' : 'Title', label: meta.lang === 'de' ? 'Titel' : 'Title' },
    { key: meta.lang === 'de' ? 'Stufe' : 'Stage', label: meta.lang === 'de' ? 'Stufe' : 'Stage' },
    { key: meta.lang === 'de' ? 'Wert' : 'Value', label: meta.lang === 'de' ? 'Wert' : 'Value' },
  ]) : ''}

  ${include('activities') ? table(meta.lang === 'de' ? 'Aktivitäten (Auszug)' : 'Activities (excerpt)', tables.recentActivities, [
    { key: 'ID', label: 'ID' },
    { key: meta.lang === 'de' ? 'Titel' : 'Title', label: meta.lang === 'de' ? 'Titel' : 'Title' },
    { key: meta.lang === 'de' ? 'Status' : 'Status', label: meta.lang === 'de' ? 'Status' : 'Status' },
    { key: meta.lang === 'de' ? 'Datum' : 'Date', label: meta.lang === 'de' ? 'Datum' : 'Date' },
  ]) : ''}

  ${include('calendar') ? table(meta.lang === 'de' ? 'Kalender (Auszug)' : 'Calendar (excerpt)', tables.keyEvents, [
    { key: 'ID', label: 'ID' },
    { key: meta.lang === 'de' ? 'Titel' : 'Title', label: meta.lang === 'de' ? 'Titel' : 'Title' },
    { key: meta.lang === 'de' ? 'Datum' : 'Date', label: meta.lang === 'de' ? 'Datum' : 'Date' },
    { key: meta.lang === 'de' ? 'Kategorie' : 'Category', label: meta.lang === 'de' ? 'Kategorie' : 'Category' },
  ]) : ''}

  ${include('crm') ? table(meta.lang === 'de' ? 'Unternehmen (neu/aktualisiert)' : 'Companies (new/updated)', tables.recentCompanies, [
    { key: 'ID', label: 'ID' },
    { key: meta.lang === 'de' ? 'Name' : 'Name', label: meta.lang === 'de' ? 'Name' : 'Name' },
    { key: meta.lang === 'de' ? 'Update' : 'Updated', label: meta.lang === 'de' ? 'Update' : 'Updated' },
    { key: meta.lang === 'de' ? 'Notiz' : 'Note', label: meta.lang === 'de' ? 'Notiz' : 'Note' },
  ]) : ''}

  ${include('crm') ? table(meta.lang === 'de' ? 'Kontakte (neu/aktualisiert)' : 'Contacts (new/updated)', tables.recentContacts, [
    { key: 'ID', label: 'ID' },
    { key: meta.lang === 'de' ? 'Name' : 'Name', label: meta.lang === 'de' ? 'Name' : 'Name' },
    { key: meta.lang === 'de' ? 'E-Mail' : 'Email', label: meta.lang === 'de' ? 'E-Mail' : 'Email' },
    { key: meta.lang === 'de' ? 'Update' : 'Updated', label: meta.lang === 'de' ? 'Update' : 'Updated' },
  ]) : ''}

  ${include('uploads') ? table(meta.lang === 'de' ? 'Uploads (Auszug)' : 'Uploads (excerpt)', tables.uploads, [
    { key: 'ID', label: 'ID' },
    { key: meta.lang === 'de' ? 'Name' : 'Name', label: meta.lang === 'de' ? 'Name' : 'Name' },
    { key: meta.lang === 'de' ? 'Typ' : 'Type', label: meta.lang === 'de' ? 'Typ' : 'Type' },
    { key: meta.lang === 'de' ? 'Datum' : 'Date', label: meta.lang === 'de' ? 'Datum' : 'Date' },
  ]) : ''}

  ${include('uploads') ? table(meta.lang === 'de' ? 'Jobs (Auszug)' : 'Jobs (excerpt)', tables.jobs, [
    { key: 'ID', label: 'ID' },
    { key: meta.lang === 'de' ? 'Typ' : 'Type', label: meta.lang === 'de' ? 'Typ' : 'Type' },
    { key: meta.lang === 'de' ? 'Status' : 'Status', label: meta.lang === 'de' ? 'Status' : 'Status' },
    { key: meta.lang === 'de' ? 'Datum' : 'Date', label: meta.lang === 'de' ? 'Datum' : 'Date' },
  ]) : ''}

  ${include('appendix') ? `<h2>${esc(meta.lang === 'de' ? 'Datenbasis & Annahmen' : 'Data sources & assumptions')}</h2>
    <div class="card">
      <div class="card-h">${esc(meta.lang === 'de' ? 'Datenquellen' : 'Data sources')}</div>
      <div class="card-b">
        <table>
          <thead><tr><th>${esc(meta.lang === 'de' ? 'KPI' : 'KPI')}</th><th>${esc(meta.lang === 'de' ? 'Quelle' : 'Source')}</th><th>${esc(meta.lang === 'de' ? 'Berechnung' : 'How')}</th></tr></thead>
          <tbody>
            ${[
              { name: 'pipelineValue', endpoint: '/crm/stats', how: 'sum(value) stage != lost' },
              { name: 'wonValue', endpoint: '/crm/stats', how: 'sum(value) stage == won' },
              { name: 'totalDeals', endpoint: '/crm/stats', how: 'count(deals)' },
              { name: 'uploads', endpoint: '/uploads', how: 'count(created_at in period)' },
              { name: 'jobs', endpoint: '/jobs', how: 'count(created_at in period)' },
              { name: 'activities', endpoint: '/activities', how: 'count(start/end in period)' },
              { name: 'events', endpoint: '/calendar', how: 'count(start in period)' },
            ]
              .map((r) => `<tr><td>${esc(r.name)}</td><td>${esc(r.endpoint)}</td><td>${esc(r.how)}</td></tr>`)
              .join('')}
          </tbody>
        </table>
      </div>
    </div>` : ''}

</main>`

  return html
}

export async function POST(req: NextRequest) {
  try {
    const { from, to, options } = await req.json().catch(() => ({ from: null, to: null, options: {} }))

    const apiKey = process.env.OPENAI_API_KEY
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
    if (!apiKey) return NextResponse.json({ error: 'OPENAI_API_KEY is not configured' }, { status: 500 })

    const cookie = req.headers.get('cookie') || ''
    // Use request origin (works on Vercel/Preview too). Avoid relying on NEXT_PUBLIC_SITE_URL.
    const base = req.nextUrl?.origin || new URL(req.url).origin
    const mkUrl = (p: string) => `${base}/api${p.startsWith('/') ? p : '/' + p}`
    const headers = { 'Content-Type': 'application/json', ...(cookie ? { cookie } : {}) }
    const generatedAt = new Date().toISOString()

    async function getJSON(path: string, init: RequestInit = {}) {
      const r = await fetch(mkUrl(path), { ...init, headers, cache: 'no-store' })
      if (!r.ok) {
        const text = await r.text()
        let msg = text
        try {
          const j = JSON.parse(text)
          msg = (j as any)?.detail || (j as any)?.error || msg
        } catch {}
        throw new Error(`${path} failed (${r.status}): ${msg}`)
      }
      try { return await r.json() } catch { return null }
    }

    // Fetch data in parallel
    const [crmStats, activitiesRaw, calendarRaw, uploadsRaw, jobsRaw, companiesRaw, contactsRaw, dealsRaw] = await Promise.all([
      // crm/stats is required for meaningful KPIs; if it fails we should error (not silently generate an empty report).
      getJSON('/crm/stats'),
      getJSON('/activities').catch(()=>[]),
      getJSON('/calendar').catch(()=>[]),
      getJSON('/uploads').catch(()=>({ items: [] })),
      getJSON('/jobs').catch(()=>({ items: [] })),
      getJSON('/crm/companies').catch(()=>({ items: [] })),
      getJSON('/crm/contacts').catch(()=>({ items: [] })),
      getJSON('/crm/deals').catch(()=>({ items: [] })),
    ])

    const activities: any[] = Array.isArray(activitiesRaw) ? activitiesRaw : (activitiesRaw?.items ?? [])
    const events: any[] = Array.isArray(calendarRaw) ? calendarRaw : (calendarRaw?.items ?? [])
    const uploads: any[] = uploadsRaw?.items ?? []
    const jobs: any[] = jobsRaw?.items ?? []
    const companies: any[] = Array.isArray(companiesRaw?.items) ? companiesRaw.items : companiesRaw || []
    const contacts: any[] = Array.isArray(contactsRaw?.items) ? contactsRaw.items : contactsRaw || []
    const deals: any[] = Array.isArray(dealsRaw?.items) ? dealsRaw.items : dealsRaw || []

    const fromDate = from ? new Date(from) : null
    const toDate = to ? new Date(to) : null
    // Treat `to` as inclusive end-of-day for date-only inputs (type="date").
    if (toDate && Number.isFinite(toDate.getTime())) {
      toDate.setHours(23, 59, 59, 999)
    }
    const inRange = inRangeFactory(fromDate, toDate)

    const act = activities.filter(a => inRange(a.start) || inRange(a.end))
    const ev = events.filter(e => inRange(e.start))
    const up = uploads.filter(u => inRange(u.created_at))
    const jb = jobs.filter(j => inRange(j.created_at))

    const createdInRange = (obj: any) => inRange(obj?.created_at || obj?.createdAt)
    const updatedInRange = (obj: any) => inRange(obj?.updated_at || obj?.updatedAt)

    const companiesCreated = companies.filter(createdInRange)
    const companiesUpdated = companies.filter(updatedInRange)
    const contactsCreated = contacts.filter(createdInRange)
    const contactsUpdated = contacts.filter(updatedInRange)
    const dealsCreated = deals.filter(createdInRange)
    const dealsUpdated = deals.filter(updatedInRange)

    // Comparison (previous period or YoY)
    let compareBlock: any = null
    if (options?.compare && options.compare !== 'none' && fromDate && toDate) {
      const diffMs = toDate.getTime() - fromDate.getTime()
      let prevFrom = new Date(fromDate)
      let prevTo = new Date(toDate)
      if (options.compare === 'prev') {
        prevFrom = new Date(fromDate.getTime() - diffMs - 24*3600*1000)
        prevTo = new Date(toDate.getTime() - diffMs - 24*3600*1000)
      } else if (options.compare === 'yoy') {
        prevFrom = new Date(fromDate); prevFrom.setFullYear(prevFrom.getFullYear() - 1)
        prevTo = new Date(toDate); prevTo.setFullYear(prevTo.getFullYear() - 1)
      }
      if (prevTo && Number.isFinite(prevTo.getTime())) {
        prevTo.setHours(23, 59, 59, 999)
      }
      const inPrev = (d: any) => {
        const dt = d ? new Date(d) : null
        if (!dt) return false
        if (dt < prevFrom) return false
        if (dt > prevTo) return false
        return true
      }
      const actPrev = activities.filter(a => inPrev(a.start) || inPrev(a.end))
      const evPrev = events.filter(e => inPrev(e.start))
      const uploadsPrev = uploads.filter(u => inPrev(u.created_at))
      const jobsPrev = jobs.filter(j => inPrev(j.created_at))
      compareBlock = {
        period: { from: prevFrom.toISOString().slice(0,10), to: prevTo.toISOString().slice(0,10), type: options.compare },
        counts: {
          activities: act.length - actPrev.length,
          events: ev.length - evPrev.length,
          uploads: up.length - uploadsPrev.length,
          jobs: jb.length - jobsPrev.length,
        }
      }
    }

    // Labels based on language
    const lang = (options?.language || 'de') as Lang
    const tone = (options?.tone || 'executive') as Tone
    const generatedAtText = (() => {
      const d = new Date(generatedAt)
      if (!Number.isFinite(d.getTime())) return generatedAt
      const pad = (n: number) => String(n).padStart(2, '0')
      const dd = pad(d.getDate())
      const mm = pad(d.getMonth() + 1)
      const yyyy = d.getFullYear()
      return lang === 'de' ? `${dd}.${mm}.${yyyy}` : `${yyyy}-${mm}-${dd}`
    })()
    const labels = lang === 'de' ? {
      title: 'MarketingKreis – Executive Report',
      company: 'Firma',
      period: 'Zeitraum',
      generated: 'Generiert am',
      pipeline: 'Pipeline',
      won: 'Won',
      dealsLbl: 'Deals',
      uploadsLbl: 'Uploads',
      jobsLbl: 'Jobs',
      executiveSummary: 'Zusammenfassung',
      pipelineSection: 'Pipeline & Deals',
      activitiesSection: 'Aktivitäten',
      calendarSection: 'Kalender‑Highlights',
      crmSection: 'CRM – Unternehmen & Kontakte',
      uploadsSection: 'Uploads & Jobs',
      risksSection: 'Risiken & Empfehlungen',
    } : {
      title: 'MarketingKreis – Executive Report',
      company: 'Company',
      period: 'Period',
      generated: 'Generated on',
      pipeline: 'Pipeline',
      won: 'Won',
      dealsLbl: 'Deals',
      uploadsLbl: 'Uploads',
      jobsLbl: 'Jobs',
      executiveSummary: 'Executive Summary',
      pipelineSection: 'Pipeline & Deals',
      activitiesSection: 'Activities',
      calendarSection: 'Calendar Highlights',
      crmSection: 'CRM – Companies & Contacts',
      uploadsSection: 'Uploads & Jobs',
      risksSection: 'Risks & Recommendations',
    }

    // Base CSS (modern, consistent with platform)
    const baseStyle = `
    :root{
      --bg:#0b1220; --fg:#e5e7eb; --muted:#9aa4b2; --card:#0f172a; --border:rgba(255,255,255,.08);
      --primary:#7c3aed; --accent:#3b82f6; --success:#22c55e; --warning:#f59e0b;
    }
    @media print {
      @page{ margin:18mm; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page-break { page-break-before: always; }
    }
    /* Mobile preview (inside iframe) */
    @media (max-width: 640px) {
      main{ padding:22px 14px; }
      h1{ font-size:22px; }
      h2{ font-size:18px; margin-top:22px; }
      .cover .title{ font-size:22px; }
      .brandbar{ flex-direction:column; align-items:flex-start; gap:8px; }
      .brandbar .logo{ height:38px; max-width:200px; }
      .kpi-grid{ grid-template-columns: repeat(2, minmax(0,1fr)); gap:10px; }
      .kpi:nth-child(5){ grid-column: 1 / -1; }
      .kpi{ padding:12px 12px; border-radius:12px; }
      .kpi .value{ font-size:22px; }
      th,td{ padding:8px 10px; }
      table{ display:block; overflow-x:auto; -webkit-overflow-scrolling:touch; }
    }
    *{box-sizing:border-box}
    body{margin:0; background:var(--bg); color:var(--fg); font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif; line-height:1.6; }
    main{max-width:1120px; margin:0 auto; padding:40px 28px;}
    h1,h2,h3{margin:0 0 12px 0}
    h1{font-size:28px}
    h2{font-size:22px; margin-top:30px}
    .muted{color:var(--muted)}
    .cover{ text-align:center; margin-bottom:26px; position:relative }
    .brandbar{ display:flex; align-items:center; justify-content:space-between; margin-bottom:8px }
    .brandbar .logo{ height:46px; max-width:220px; object-fit:contain; border-radius:6px; }
    .cover .title{ font-size:26px; font-weight:700; color:#c4b5fd }
    .cover .meta{ margin-top:8px; color:var(--muted) }
    .kpi-grid{ display:grid; grid-template-columns: repeat(5,1fr); gap:14px; margin:22px 0 }
    .kpi{ background:linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.02)); border:1px solid var(--border); border-radius:14px; padding:14px 16px; text-align:center }
    .kpi .label{ font-size:12px; color:var(--muted); }
    .kpi .value{ font-size:28px; font-weight:700 }
    .card{ background:var(--card); border:1px solid var(--border); border-radius:14px; overflow:hidden; margin:12px 0 }
    .card .card-h{ padding:12px 16px; font-weight:600; background:rgba(255,255,255,.02); border-bottom:1px solid var(--border) }
    .card .card-b{ padding:12px 16px }
    ul{ padding-left:22px; margin:10px 0 }
    table{ width:100%; border-collapse:collapse; }
    th,td{ padding:10px 12px; border-bottom:1px solid var(--border); }
    thead th{ background:rgba(255,255,255,.03); text-align:left; font-weight:600; color:var(--muted) }
    tbody tr:nth-child(2n){ background:rgba(255,255,255,.02) }
    a{ color:#93c5fd; text-decoration:underline }
    .badge{ display:inline-block; padding:2px 8px; border-radius:999px; font-size:11px; border:1px solid var(--border); }
    `

    const system = `You are a senior executive reporting analyst for a marketing CRM platform.

TASK
- Create high-signal narrative content for an executive report: changes, AI insights, results, risks, recommendations, and conclusion.

OUTPUT FORMAT (STRICT)
- Return ONLY valid JSON (no markdown, no prose outside JSON).
- Language: ${lang}. Write everything strictly in this language. Do not mix languages.
- Tone: ${tone}. Keep it crisp, actionable, non-fluffy.

JSON SCHEMA
{
  "executive_summary": string[5..8],
  "what_changed": string[4..8],
  "key_insights": string[4..8],
  "results": string[3..7],
  "risks": string[3..7],
  "recommendations": string[4..8],
  "conclusion": string
}

RULES
- Be specific: cite numbers from the provided metrics and deltas.
- If compare is null, avoid “vs previous period” language; instead describe absolute performance & signals.
- Do not invent data. If something is unknown, acknowledge uncertainty and propose what to measure next.
- Recommendations must be concrete next actions (owner/when suggestions are ok).`

    // Note: we intentionally keep the AI input compact (high-signal summaries + top lists),
    // so we don't need to stream full arrays into the prompt.
    const originalLogo: string = options?.brand?.logoUrl || ''
    const largeInlineLogo = originalLogo.startsWith('data:') && originalLogo.length > 2000
    const logoToken = largeInlineLogo ? '__REPORT_LOGO__' : originalLogo

    const temperature = options?.deterministic ? 0.2 : 0.7
    const baseSections = options?.sections && typeof options.sections === 'object' ? options.sections : {}
    const sections = {
      kpi: true,
      changes: true,
      insights: true,
      pipeline: true,
      activities: true,
      calendar: true,
      crm: true,
      uploads: true,
      risks: true,
      conclusion: true,
      appendix: true,
      ...baseSections,
    } as Record<string, boolean>

    // Build “top tables” for both HTML and exports
    const topDeals = pickTop(deals, 10, (d: any) => toNumber(d?.value)).map((d: any) => ({
      ID: d?.id ?? '',
      [lang === 'de' ? 'Titel' : 'Title']: safeText(d?.title || ''),
      [lang === 'de' ? 'Stufe' : 'Stage']: safeText(d?.stage || ''),
      [lang === 'de' ? 'Wert' : 'Value']: fmtChf(d?.value || 0, lang),
    }))
    const recentActivities = pickTop(act, 10, (a: any) => {
      const t = a?.start ? new Date(a.start).getTime() : 0
      return Number.isFinite(t) ? t : 0
    }).map((a: any) => ({
      ID: a?.id ?? '',
      [lang === 'de' ? 'Titel' : 'Title']: safeText(a?.title || ''),
      [lang === 'de' ? 'Status' : 'Status']: safeText(a?.status || ''),
      [lang === 'de' ? 'Datum' : 'Date']: dateLabel(a?.start || a?.end || '', lang),
    }))
    const keyEvents = pickTop(ev, 10, (e: any) => {
      const t = e?.start ? new Date(e.start).getTime() : 0
      return Number.isFinite(t) ? t : 0
    }).map((e: any) => ({
      ID: e?.id ?? '',
      [lang === 'de' ? 'Titel' : 'Title']: safeText(e?.title || ''),
      [lang === 'de' ? 'Datum' : 'Date']: dateLabel(e?.start || '', lang),
      [lang === 'de' ? 'Kategorie' : 'Category']: safeText(e?.category || ''),
    }))
    const recentCompanies = pickTop(companies, 10, (c: any) => {
      const t = c?.updated_at ? new Date(c.updated_at).getTime() : (c?.created_at ? new Date(c.created_at).getTime() : 0)
      return Number.isFinite(t) ? t : 0
    }).map((c: any) => ({
      ID: c?.id ?? '',
      [lang === 'de' ? 'Name' : 'Name']: safeText(c?.name || ''),
      [lang === 'de' ? 'Update' : 'Updated']: dateLabel(c?.updated_at || c?.created_at || '', lang),
      [lang === 'de' ? 'Notiz' : 'Note']: safeText(c?.notes || '').slice(0, 90),
    }))
    const recentContacts = pickTop(contacts, 10, (c: any) => {
      const t = c?.updated_at ? new Date(c.updated_at).getTime() : (c?.created_at ? new Date(c.created_at).getTime() : 0)
      return Number.isFinite(t) ? t : 0
    }).map((c: any) => ({
      ID: c?.id ?? '',
      [lang === 'de' ? 'Name' : 'Name']: safeText(c?.name || ''),
      [lang === 'de' ? 'E-Mail' : 'Email']: safeText(c?.email || ''),
      [lang === 'de' ? 'Update' : 'Updated']: dateLabel(c?.updated_at || c?.created_at || '', lang),
    }))
    const uploadsTbl = pickTop(up, 10, (u: any) => {
      const t = u?.created_at ? new Date(u.created_at).getTime() : 0
      return Number.isFinite(t) ? t : 0
    }).map((u: any) => ({
      ID: u?.id ?? '',
      [lang === 'de' ? 'Name' : 'Name']: safeText(u?.original_name || u?.name || ''),
      [lang === 'de' ? 'Typ' : 'Type']: safeText(u?.file_type || ''),
      [lang === 'de' ? 'Datum' : 'Date']: dateLabel(u?.created_at || '', lang),
    }))
    const jobsTbl = pickTop(jb, 10, (j: any) => {
      const t = j?.created_at ? new Date(j.created_at).getTime() : 0
      return Number.isFinite(t) ? t : 0
    }).map((j: any) => ({
      ID: j?.id ?? '',
      [lang === 'de' ? 'Typ' : 'Type']: safeText(j?.type || ''),
      [lang === 'de' ? 'Status' : 'Status']: safeText(j?.status || ''),
      [lang === 'de' ? 'Datum' : 'Date']: dateLabel(j?.created_at || '', lang),
    }))

    const deltas = (() => {
      if (!compareBlock?.period) return []
      const periodTxt = `${compareBlock.period.from}–${compareBlock.period.to}`
      const items = [
        { label: lang === 'de' ? 'Aktivitäten' : 'Activities', value: act.length, prev: act.length - toNumber(compareBlock?.counts?.activities), delta: toNumber(compareBlock?.counts?.activities) },
        { label: lang === 'de' ? 'Events' : 'Events', value: ev.length, prev: ev.length - toNumber(compareBlock?.counts?.events), delta: toNumber(compareBlock?.counts?.events) },
        { label: lang === 'de' ? 'Uploads' : 'Uploads', value: up.length, prev: up.length - toNumber(compareBlock?.counts?.uploads), delta: toNumber(compareBlock?.counts?.uploads) },
        { label: lang === 'de' ? 'Jobs' : 'Jobs', value: jb.length, prev: jb.length - toNumber(compareBlock?.counts?.jobs), delta: toNumber(compareBlock?.counts?.jobs) },
      ]
      return items.map((x) => ({ ...x, periodTxt }))
    })()

    const payload = {
      model,
      temperature,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: JSON.stringify({
          period: { from, to },
          compare: compareBlock,
          deltas: deltas.map((d: any) => ({ label: d.label, prev: d.prev, value: d.value, delta: d.delta })),
          kpis: {
            pipelineValue: crmStats?.pipelineValue || 0,
            wonValue: crmStats?.wonValue || 0,
            totalDeals: crmStats?.totalDeals || 0,
            activities: act.length,
            events: ev.length,
            uploads: up.length,
            jobs: jb.length,
          },
          changes: {
            companies: { created: companiesCreated.length, updated: companiesUpdated.length },
            contacts: { created: contactsCreated.length, updated: contactsUpdated.length },
            deals: { created: dealsCreated.length, updated: dealsUpdated.length },
          },
          highlights: {
            topDeals,
            recentActivities,
            keyEvents,
            recentCompanies,
            recentContacts,
          },
          notes: [
            "CRM KPI stats (/crm/stats) are global (not period-filtered). Period comparisons are based on time-filtered entities (activities/events/uploads/jobs).",
            "Deals stage transitions are not tracked historically; avoid claiming exact 'moved to won' counts unless explicitly available.",
          ],
        }) },
      ],
    }

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    })
    if (!resp.ok) {
      const text = await resp.text()
      return NextResponse.json({ error: text }, { status: resp.status })
    }
    const j = await resp.json()
    const raw = j?.choices?.[0]?.message?.content || '{}'
    let ai: any = {}
    try { ai = JSON.parse(raw) } catch { ai = {} }

    const narrative = {
      executiveSummary: Array.isArray(ai?.executive_summary) ? ai.executive_summary : [],
      whatChanged: Array.isArray(ai?.what_changed) ? ai.what_changed : [],
      keyInsights: Array.isArray(ai?.key_insights) ? ai.key_insights : [],
      results: Array.isArray(ai?.results) ? ai.results : [],
      risks: Array.isArray(ai?.risks) ? ai.risks : [],
      recommendations: Array.isArray(ai?.recommendations) ? ai.recommendations : [],
      conclusion: safeText(ai?.conclusion || ''),
    }

    // Heuristic fallback if AI returns empty
    const fallback = (arr: string[], def: string[]) => (arr && arr.length ? arr : def)
    narrative.executiveSummary = fallback(narrative.executiveSummary, [
      lang === 'de' ? `Überblick für ${safeText(from)}–${safeText(to)}.` : `Overview for ${safeText(from)}–${safeText(to)}.`,
      lang === 'de' ? `Pipeline aktuell: ${fmtChf(crmStats?.pipelineValue || 0, lang)}.` : `Current pipeline: ${fmtChf(crmStats?.pipelineValue || 0, lang)}.`,
      lang === 'de' ? `Won aktuell: ${fmtChf(crmStats?.wonValue || 0, lang)}.` : `Current won: ${fmtChf(crmStats?.wonValue || 0, lang)}.`,
      lang === 'de' ? `Aktivitäten im Zeitraum: ${act.length}.` : `Activities in period: ${act.length}.`,
      lang === 'de' ? `Events im Zeitraum: ${ev.length}.` : `Events in period: ${ev.length}.`,
    ])
    narrative.whatChanged = fallback(narrative.whatChanged, compareBlock ? [
      lang === 'de' ? `Aktivitäten: ${act.length} (Δ ${toNumber(compareBlock?.counts?.activities)}).` : `Activities: ${act.length} (Δ ${toNumber(compareBlock?.counts?.activities)}).`,
      lang === 'de' ? `Events: ${ev.length} (Δ ${toNumber(compareBlock?.counts?.events)}).` : `Events: ${ev.length} (Δ ${toNumber(compareBlock?.counts?.events)}).`,
      lang === 'de' ? `Uploads: ${up.length} (Δ ${toNumber(compareBlock?.counts?.uploads)}).` : `Uploads: ${up.length} (Δ ${toNumber(compareBlock?.counts?.uploads)}).`,
      lang === 'de' ? `Jobs: ${jb.length} (Δ ${toNumber(compareBlock?.counts?.jobs)}).` : `Jobs: ${jb.length} (Δ ${toNumber(compareBlock?.counts?.jobs)}).`,
    ] : [])
    narrative.keyInsights = fallback(narrative.keyInsights, [
      lang === 'de' ? `Fokus: Conversion von Pipeline zu Won erhöhen (aktuell Won ${fmtChf(crmStats?.wonValue || 0, lang)}).` : `Focus: increase conversion from pipeline to won (won ${fmtChf(crmStats?.wonValue || 0, lang)}).`,
      lang === 'de' ? `Aktivitäten/Events als Hebel: plane Follow-ups zu Top-Deals.` : `Use activities/events as a lever: plan follow-ups for top deals.`,
    ])
    narrative.results = fallback(narrative.results, [
      lang === 'de' ? `Aktivitätstakt im Zeitraum: ${act.length}.` : `Activity cadence in period: ${act.length}.`,
      lang === 'de' ? `Operative Outputs: Uploads ${up.length}, Jobs ${jb.length}.` : `Operational outputs: uploads ${up.length}, jobs ${jb.length}.`,
    ])
    narrative.risks = fallback(narrative.risks, [
      lang === 'de' ? `Datenlücke: KPI-Stats sind nicht zeitgefiltert; Trends sollten mit periodischen Snapshots ergänzt werden.` : `Data gap: KPI stats are not period-filtered; add period snapshots for trends.`,
    ])
    narrative.recommendations = fallback(narrative.recommendations, [
      lang === 'de' ? `1–2 Top-Deals auswählen und nächste Schritte terminieren (Kalender + Aktivität).` : `Pick 1–2 top deals and schedule next steps (calendar + activity).`,
      lang === 'de' ? `Wöchentlichen Versand aktivieren, damit Management konsistent up-to-date bleibt.` : `Enable weekly email schedule for consistent management updates.`,
    ])
    if (!narrative.conclusion) {
      narrative.conclusion = lang === 'de'
        ? `In Summe zeigt der Zeitraum einen klaren Aktivitäts- und Output‑Überblick. Der nächste Schritt ist, Pipeline‑Arbeit stärker in “Won” zu konvertieren – mit konsequenten Follow‑ups zu den größten Opportunities.`
        : `Overall, this period provides a clear view of activity and outputs. Next, focus on converting pipeline work into “won” with consistent follow-ups on the biggest opportunities.`
    }

    const periodText = `${safeText(from || '')} – ${safeText(to || '')}`.trim()
    const companyName = safeText(options?.brand?.company || '')
    const logo = String(options?.brand?.logoUrl || '')
    const html = renderReportHtml({
      style: baseStyle,
      meta: {
        title: labels.title,
        company: companyName || undefined,
        logoUrl: logo ? (largeInlineLogo ? originalLogo : logoToken) : undefined,
        periodText: periodText,
        generatedAtText,
        lang,
      },
      kpis: {
        pipelineValue: toNumber(crmStats?.pipelineValue || 0),
        wonValue: toNumber(crmStats?.wonValue || 0),
        totalDeals: toNumber(crmStats?.totalDeals || 0),
        uploads: up.length,
        jobs: jb.length,
        activities: act.length,
        events: ev.length,
      },
      deltas: deltas.map((d: any) => ({ label: d.label, prev: d.prev, value: d.value, delta: d.delta })),
      narrative,
      sections,
      tables: {
        topDeals,
        recentActivities,
        keyEvents,
        recentCompanies,
        recentContacts,
        uploads: uploadsTbl,
        jobs: jobsTbl,
      },
    })

    const report = {
      version: 1,
      meta: {
        title: labels.title,
        company: companyName || undefined,
        period: { from: from || null, to: to || null },
        generatedAt,
        generatedAtText,
        language: lang,
        tone,
        logoUrl: logo ? (largeInlineLogo ? originalLogo : logoToken) : undefined,
      },
      sections,
      kpis: {
        pipelineValue: toNumber(crmStats?.pipelineValue || 0),
        wonValue: toNumber(crmStats?.wonValue || 0),
        totalDeals: toNumber(crmStats?.totalDeals || 0),
        uploads: up.length,
        jobs: jb.length,
        activities: act.length,
        events: ev.length,
      },
      deltas: compareBlock?.period
        ? {
            compareType: String(compareBlock?.period?.type || 'none') as any,
            period: { from: compareBlock.period.from, to: compareBlock.period.to },
            items: deltas.map((d: any) => ({ label: d.label, value: d.value, prev: d.prev, delta: d.delta })),
          }
        : undefined,
      narrative: {
        executiveSummary: narrative.executiveSummary,
        whatChanged: narrative.whatChanged,
        keyInsights: narrative.keyInsights,
        results: narrative.results,
        risks: narrative.risks,
        recommendations: narrative.recommendations,
        conclusion: narrative.conclusion,
      },
      tables: {
        topDeals,
        recentActivities,
        keyEvents,
        recentCompanies,
        recentContacts,
        uploads: uploadsTbl,
        jobs: jobsTbl,
      },
      dataSources: {
        kpis: [
          { name: 'pipelineValue', endpoint: '/crm/stats', how: 'sum(value) where stage != lost' },
          { name: 'wonValue', endpoint: '/crm/stats', how: 'sum(value) where stage == won' },
          { name: 'totalDeals', endpoint: '/crm/stats', how: 'count(deals)' },
          { name: 'activities', endpoint: '/activities', how: 'count(start/end within period)' },
          { name: 'events', endpoint: '/calendar', how: 'count(start within period)' },
          { name: 'uploads', endpoint: '/uploads', how: 'count(created_at within period)' },
          { name: 'jobs', endpoint: '/jobs', how: 'count(created_at within period)' },
        ],
        assumptions: [
          '`to` date is treated as inclusive end-of-day for date inputs',
          'CRM KPI stats are not period-filtered in /crm/stats (current snapshot)',
          'Period comparisons are computed from time-filtered entities (activities/events/uploads/jobs)',
        ],
      },
    }

    return NextResponse.json({ html, report })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}


