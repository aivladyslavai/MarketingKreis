export type ReportLanguage = "de" | "en"
export type ReportTone = "executive" | "neutral" | "marketing"

export type ReportSections = Partial<{
  kpi: boolean
  changes: boolean
  insights: boolean
  pipeline: boolean
  activities: boolean
  calendar: boolean
  crm: boolean
  uploads: boolean
  risks: boolean
  conclusion: boolean
  appendix: boolean
}>

export type ReportMeta = {
  title: string
  company?: string
  period: { from?: string | null; to?: string | null }
  generatedAt: string
  generatedAtText: string
  language: ReportLanguage
  tone: ReportTone
  logoUrl?: string
}

export type ReportKpis = {
  pipelineValue: number
  wonValue: number
  totalDeals: number
  uploads: number
  jobs: number
  activities: number
  events: number
}

export type ReportDelta = {
  label: string
  value: number
  prev?: number | null
  delta?: number | null
}

export type ReportTableRow = Record<string, string | number | null | undefined>

export type ReportDocumentV1 = {
  version: 1
  meta: ReportMeta
  sections: ReportSections
  kpis: ReportKpis
  deltas?: {
    compareType?: "none" | "prev" | "yoy"
    period?: { from: string; to: string } | null
    items: ReportDelta[]
  }
  narrative: {
    executiveSummary: string[]
    whatChanged: string[]
    keyInsights: string[]
    results: string[]
    risks: string[]
    recommendations: string[]
    conclusion: string
  }
  tables: {
    topDeals: ReportTableRow[]
    recentActivities: ReportTableRow[]
    keyEvents: ReportTableRow[]
    recentCompanies: ReportTableRow[]
    recentContacts: ReportTableRow[]
    uploads: ReportTableRow[]
    jobs: ReportTableRow[]
  }
  dataSources: {
    kpis: { name: string; endpoint: string; how: string }[]
    assumptions: string[]
  }
}

