import { NextRequest, NextResponse } from "next/server"

function toCsvValue(v: any) {
  if (v === undefined || v === null) return ""
  const s = String(v)
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"'
  return s
}

function toCsv(rows: any[]): string {
  if (!rows.length) return ""
  const headers = Object.keys(rows[0])
  const lines = [headers.join(",")] as string[]
  for (const r of rows) {
    lines.push(headers.map((h) => toCsvValue((r as any)[h])).join(","))
  }
  return lines.join("\n")
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const format = (searchParams.get('format') || 'csv').toLowerCase()
    const cookie = req.headers.get('cookie') || ''

    const api = async (path: string) => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api${path}`, {
        headers: { 'Content-Type': 'application/json', cookie },
        cache: 'no-store',
      })
      if (!res.ok) return null
      try { return await res.json() } catch { return null }
    }

    const [stats, activities, calendar, uploads, jobs] = await Promise.all([
      api('/crm/stats'),
      api('/activities'),
      api('/calendar'),
      api('/uploads'),
      api('/jobs'),
    ])

    const activitiesArr = Array.isArray(activities) ? activities : (activities?.items ?? [])
    const eventsArr = Array.isArray(calendar) ? calendar : (calendar?.items ?? [])
    const uploadsArr = Array.isArray(uploads) ? uploads : (uploads?.items ?? [])
    const jobsArr = Array.isArray(jobs) ? jobs : (jobs?.items ?? [])

    const generatedAt = new Date().toISOString()

    if (format === 'json') {
      return NextResponse.json({ generatedAt, stats: stats || {}, activities: activitiesArr, events: eventsArr, uploads: uploadsArr, jobs: jobsArr })
    }

    // CSV (unified rows)
    const rows: any[] = []
    if (stats) {
      rows.push({ type: 'kpi', metric: 'pipeline', value: stats.pipelineValue ?? 0 })
      rows.push({ type: 'kpi', metric: 'won', value: stats.wonValue ?? 0 })
      rows.push({ type: 'kpi', metric: 'deals', value: stats.totalDeals ?? 0 })
    }
    for (const a of activitiesArr) {
      rows.push({ type: 'activity', title: a.title, start: a.start, end: a.end || '', status: a.status || '', category: a.category || '', owner: a.owner?.name || '', notes: a.notes || '' })
    }
    for (const e of eventsArr) {
      rows.push({ type: 'event', title: e.title, start: e.start, end: e.end || '', description: e.description || '', location: e.location || '', category: e.category || '' })
    }
    for (const u of uploadsArr) {
      rows.push({ type: 'upload', name: u.original_name, size: u.file_size, file_type: u.file_type, created_at: u.created_at })
    }
    for (const j of jobsArr) {
      rows.push({ type: 'job', job_type: j.type, status: j.status, progress: j.progress ?? '', created_at: j.created_at })
    }

    const csv = toCsv(rows)
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="report_${generatedAt.slice(0,19).replace(/[:T]/g,'-')}.csv"`,
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to generate report' }, { status: 500 })
  }
}


