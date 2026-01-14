import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function escapeCsv(v: unknown) {
  const s = String(v ?? "")
  if (/[",\n\r;]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export async function GET() {
  const headers = ["title", "category", "status", "budgetCHF", "weight", "start", "end", "notes"]
  const sample = [
    {
      title: "LinkedIn Kampagne Q1",
      category: "VERKAUFSFOERDERUNG",
      status: "ACTIVE",
      budgetCHF: 1500,
      weight: 1,
      start: "2026-01-15",
      end: "2026-02-15",
      notes: "Zielgruppe: DACH · A/B Test Creatives",
    },
  ]

  const lines = [
    headers.join(";"),
    ...sample.map((row) => headers.map((h) => escapeCsv((row as any)[h])).join(";")),
  ]
  const csv = lines.join("\n") + "\n"

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="marketingkreis-import-template.csv"',
      "Cache-Control": "no-store",
    },
  })
}

