import { NextResponse } from "next/server"
import * as XLSX from "xlsx"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const rows = [
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

  const ws = XLSX.utils.json_to_sheet(rows, {
    header: ["title", "category", "status", "budgetCHF", "weight", "start", "end", "notes"],
  })
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Import")

  // Write workbook to buffer (Node)
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer

  // Ensure pure ArrayBuffer (avoid SharedArrayBuffer typing)
  const body = new ArrayBuffer(buf.byteLength)
  new Uint8Array(body).set(buf)

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="marketingkreis-import-template.xlsx"',
      "Cache-Control": "no-store",
    },
  })
}

