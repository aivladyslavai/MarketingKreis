import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { from, to, options } = await req.json().catch(() => ({ from: null, to: null, options: {} }))

    const apiKey = process.env.OPENAI_API_KEY
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
    if (!apiKey) return NextResponse.json({ error: 'OPENAI_API_KEY is not configured' }, { status: 500 })

    const cookie = req.headers.get('cookie') || ''
    const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const mkUrl = (p: string) => `${base}/api${p.startsWith('/') ? p : '/' + p}`
    const headers = { 'Content-Type': 'application/json', ...(cookie ? { cookie } : {}) }

    async function getJSON(path: string, init: RequestInit = {}) {
      const r = await fetch(mkUrl(path), { ...init, headers, cache: 'no-store' })
      if (!r.ok) throw new Error(await r.text())
      try { return await r.json() } catch { return null }
    }

    // Fetch data in parallel
    const [crmStats, activitiesRaw, calendarRaw, uploadsRaw, jobsRaw, companiesRaw, contactsRaw, dealsRaw] = await Promise.all([
      getJSON('/crm/stats').catch(()=>({})),
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
    const inRange = (d: any) => {
      const dt = d ? new Date(d) : null
      if (!dt) return true
      if (fromDate && dt < fromDate) return false
      if (toDate && dt > toDate) return false
      return true
    }

    const act = activities.filter(a => inRange(a.start) || inRange(a.end))
    const ev = events.filter(e => inRange(e.start))
    const up = uploads.filter(u => inRange(u.created_at))
    const jb = jobs.filter(j => inRange(j.created_at))

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
    const lang = (options?.language || 'de') as 'de' | 'en'
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
    *{box-sizing:border-box}
    body{background:var(--bg); color:var(--fg); font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif; line-height:1.6; }
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

    const system = `You are a senior executive reporting assistant for a marketing CRM platform. Produce a PROFESSIONAL, PRINT‑READY report as pure HTML. Dark theme, typographic hierarchy, generous spacing.

REQUIREMENTS
- Layout for A4 portrait, with print CSS (page-breaks between major sections, margins 18mm, page numbers in footer).
- Top cover: title "MarketingKreis – Executive Report", company placeholder, period (from–to) and generation timestamp.
- KPI grid: Pipeline Value, Won Value, Deals, Uploads, Jobs (big numbers, small trend captions – text only).
- Sections (use clear anchors and <h2>):
  1) Executive Summary (5–8 bullets)
  2) Pipeline & Deals (table of top deals if present)
  3) Activities (group by status/category with counts and a compact table)
  4) Calendar Highlights (upcoming and past key events for the period)
  5) CRM – Companies & Contacts (top items by recent changes)
  6) Uploads & Jobs (counts + latest items)
  7) Risks & Recommendations (bullets)

STYLE
- Use CSS variables, fonts: system-ui; colors tuned for dark background; subtle dividers; cards with rounded corners. Provide :root variables and print @media.
- Table style: zebra rows, condensed on print.
- Include a small legend of statuses.

OUTPUT
- Return a single HTML fragment: FIRST include EXACTLY the provided <style> content (from user payload "style") inside a <style> block, THEN include one <main> element with the markup. No outer <html> wrapper is needed.
- Do NOT wrap the response in code fences.
- No <script> tags.
- Language: ${lang}. Write ALL headings, labels and sentences strictly in this language. Translate where necessary. Do NOT mix languages.
- Use labels provided in "labels" for headings and KPI captions.
- Sections visibility: ${JSON.stringify(options?.sections || {})}.
- Branding: company="${options?.brand?.company || ''}", logo="${options?.brand?.logoUrl ? (options?.brand?.logoUrl.length>2000 ? '__REPORT_LOGO__' : options?.brand?.logoUrl) : ''}".
- If branding.logo is provided, render on cover a row <div class="brandbar"> with the company name on the left and <img class="logo" src="..."> aligned right (height ~46px, auto width).
- Drill-down links: If you list an item with id, wrap its title with an <a> using base templates:
   deals -> ${options?.linkBase?.deal || '/crm?focus=deal:'}<ID>
   activities -> ${options?.linkBase?.activity || '/activities?id='}<ID>
   events -> ${options?.linkBase?.event || '/calendar?event='}<ID>
- If arrays 'sparklines' are provided, render inline SVG sparkline with a polyline; size 100x30, stroke color var(--muted).`

    // Reduce payload size: limit long arrays
    const limit = (arr: any[], n: number) => Array.isArray(arr) ? arr.slice(0, n) : []
    const max = { activities: 250, events: 250, deals: 120, companies: 120, contacts: 120, uploads: 120, jobs: 120 }
    const originalLogo: string = options?.brand?.logoUrl || ''
    const largeInlineLogo = originalLogo.startsWith('data:') && originalLogo.length > 2000
    const logoToken = largeInlineLogo ? '__REPORT_LOGO__' : originalLogo

    const temperature = options?.deterministic ? 0.2 : 0.7
    const payload = {
      model,
      temperature,
      messages: [
        { role: 'system', content: options?.deterministic ? (system + "\\n\\nSTYLE VARIATION\\n- Use deterministic, concise wording. Avoid randomness and verbose language.") : system },
        { role: 'user', content: JSON.stringify({
          period: { from, to },
          kpis: {
            pipelineValue: crmStats?.pipelineValue || 0,
            wonValue: crmStats?.wonValue || 0,
            totalDeals: crmStats?.totalDeals || 0,
            uploads: up.length,
            jobs: jb.length,
          },
          compare: compareBlock,
          totals: {
            activities: act.length, events: ev.length, uploads: up.length, jobs: jb.length,
            companies: companies.length, contacts: contacts.length, deals: deals.length,
          },
          activities: limit(act, max.activities),
          calendar: limit(ev, max.events),
          uploads: limit(up, max.uploads),
          jobs: limit(jb, max.jobs),
          companies: limit(companies, max.companies),
          contacts: limit(contacts, max.contacts),
          deals: limit(deals, max.deals),
          labels,
          style: baseStyle,
          logoToken: logoToken || '',
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
    let html = j?.choices?.[0]?.message?.content || '<p>Empty report</p>'
    if (largeInlineLogo) {
      html = html.replace(/__REPORT_LOGO__/g, originalLogo)
    }

    return NextResponse.json({ html })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}


