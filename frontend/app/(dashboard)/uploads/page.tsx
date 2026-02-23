"use client"

import React from "react"
import {
  UploadCloud,
  RefreshCw,
  FileText,
  HardDrive,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Briefcase,
  Search,
  Eye,
  Download,
  Share2,
  Trash2,
  Image as ImageIcon,
  Video,
  File as FileIcon,
  Plus,
  Sparkles,
  BarChart3,
  Info,
  ArrowUpRight,
} from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useModal } from "@/components/ui/modal/ModalProvider"
import RadialCircle from "@/components/circle/radial-circle"
import { useJobsApi, useUploadsApi } from "@/hooks/use-uploads-api"
import { useUserCategories } from "@/hooks/use-user-categories"

function formatBytes(bytes: number) {
  if (!bytes || bytes < 0) return "0 B"
  const units = ["B", "KB", "MB", "GB", "TB"]
  let i = 0
  let v = bytes
  while (v >= 1024 && i < units.length - 1) {
    v = v / 1024
    i++
  }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

function formatRelativeTime(dateLike: string | Date | null | undefined) {
  if (!dateLike) return "—"
  const d = typeof dateLike === "string" ? new Date(dateLike) : dateLike
  const diff = Date.now() - d.getTime()
  const sec = Math.round(diff / 1000)
  const min = Math.round(sec / 60)
  const hr = Math.round(min / 60)
  const day = Math.round(hr / 24)
  if (Math.abs(sec) < 60) return "gerade eben"
  if (Math.abs(min) < 60) return `vor ${min} Min.`
  if (Math.abs(hr) < 24) return `vor ${hr} Std.`
  return `vor ${day} Tagen`
}

function isTabularFile(name: string) {
  const n = (name || "").toLowerCase()
  return n.endsWith(".csv") || n.endsWith(".xlsx") || n.endsWith(".xls")
}

function extOf(name: string) {
  const n = (name || "").toLowerCase()
  const idx = n.lastIndexOf(".")
  return idx >= 0 ? n.slice(idx + 1) : ""
}

function kindOf(name: string, fileType?: string) {
  const ext = extOf(name)
  const ft = (fileType || "").toLowerCase()
  if (ft.includes("pdf") || ext === "pdf") return "pdf"
  if (ft.startsWith("image/") || ["png", "jpg", "jpeg", "webp", "gif"].includes(ext)) return "image"
  if (ft.startsWith("video/") || ["mp4", "mov", "webm"].includes(ext)) return "video"
  if (["csv", "xlsx", "xls"].includes(ext)) return "table"
  return "file"
}

function iconFor(kind: string) {
  switch (kind) {
    case "pdf":
      return FileText
    case "image":
      return ImageIcon
    case "video":
      return Video
    case "table":
      return FileText
    default:
      return FileIcon
  }
}

function labelFor(kind: string, name: string) {
  if (kind === "table") return extOf(name).toUpperCase() || "TABLE"
  if (kind === "image") return "Image"
  if (kind === "video") return "Video"
  if (kind === "pdf") return "PDF"
  return extOf(name).toUpperCase() || "File"
}

function normalizeCategoryKey(value: any): string {
  return String(value ?? "").trim().toUpperCase()
}

function normalizeCategoryLoose(value: any): string {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
}

function parseDateLike(value: any): Date | undefined {
  if (value == null || value === "") return undefined
  if (value instanceof Date) return value
  const s = String(value).trim()
  if (!s) return undefined

  // YYYY-MM-DD
  const iso = new Date(s)
  if (!Number.isNaN(iso.getTime())) return iso

  // DD.MM.YYYY
  const m1 = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
  if (m1) {
    const dd = Number(m1[1])
    const mm = Number(m1[2])
    const yy = Number(m1[3])
    const d = new Date(yy, mm - 1, dd)
    if (!Number.isNaN(d.getTime())) return d
  }

  // ISO-like with time without timezone
  try {
    const d = new Date(s.replace("Z", "+00:00"))
    if (!Number.isNaN(d.getTime())) return d
  } catch {}

  return undefined
}

export default function UploadsPage() {
  const { openModal } = useModal()
  const fileRef = React.useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [previewLoading, setPreviewLoading] = React.useState(false)
  const [importKind, setImportKind] = React.useState<"activities" | "crm">("activities")
  const [preview, setPreview] = React.useState<{
    headers: string[]
    samples: any[]
    suggested_mapping: Record<string, string | null>
    category_values?: string[]
    import_kind?: string
  } | null>(null)
  const activityMappingDefaults = React.useMemo(
    () => ({
      title: null,
      category: null,
      status: null,
      budget: null,
      notes: null,
      start: null,
      end: null,
      weight: null,
    }),
    [],
  )
  const crmMappingDefaults = React.useMemo(
    () => ({
      company_name: null,
      company_website: null,
      company_industry: null,
      company_email: null,
      company_phone: null,
      company_notes: null,
      contact_name: null,
      contact_email: null,
      contact_phone: null,
      contact_position: null,
      deal_title: null,
      deal_value: null,
      deal_stage: null,
      deal_probability: null,
      deal_expected_close_date: null,
      deal_owner: null,
      deal_notes: null,
    }),
    [],
  )
  const [mapping, setMapping] = React.useState<Record<string, string | null>>(activityMappingDefaults)
  const [dragOver, setDragOver] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [categoryValueMap, setCategoryValueMap] = React.useState<Record<string, string>>({})
  const [bulkCategoryTarget, setBulkCategoryTarget] = React.useState<string>("")
  const [circleSize, setCircleSize] = React.useState<number>(520)
  const [isSmall, setIsSmall] = React.useState(false)
  const [showAllPreviewCols, setShowAllPreviewCols] = React.useState(false)

  const { uploads, isLoading, refresh, uploadFile, previewFile } = useUploadsApi()
  const { jobs, isLoading: jobsLoading, refresh: refreshJobs } = useJobsApi()
  const { categories: userCategories } = useUserCategories()

  // Responsive circle size (prevents overflow on mobile)
  React.useEffect(() => {
    const calc = () => {
      const w = typeof window !== "undefined" ? window.innerWidth : 1024
      const target = Math.min(520, w - 56) // approx: page padding + card padding
      setCircleSize(Math.max(280, Number.isFinite(target) ? target : 520))
    }
    calc()
    window.addEventListener("resize", calc)
    return () => window.removeEventListener("resize", calc)
  }, [])

  // Responsive UI helpers
  React.useEffect(() => {
    try {
      const mql = window.matchMedia("(max-width: 640px)")
      const apply = () => setIsSmall(mql.matches)
      apply()
      mql.addEventListener?.("change", apply)
      return () => mql.removeEventListener?.("change", apply)
    } catch {}
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.12 } },
  }
  const itemVariants = {
    hidden: { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  }

  const onPick = () => fileRef.current?.click()

  const loadPreview = React.useCallback(
    async (file: File) => {
      setShowAllPreviewCols(false)
      setPreview(null)
      setCategoryValueMap({})
      setBulkCategoryTarget("")
      setError(null)
      setPreviewLoading(true)
      try {
        const p = await previewFile(file, importKind)
        setPreview(p)
        // Reset mapping schema based on import kind, then apply suggestions
        setMapping(() => {
          const base = importKind === "crm" ? crmMappingDefaults : activityMappingDefaults
          return { ...base, ...(p?.suggested_mapping || {}) }
        })
      } catch (e: any) {
        setError(e?.message || "Vorschau konnte nicht geladen werden")
      } finally {
        setPreviewLoading(false)
      }
    },
    [previewFile, importKind, crmMappingDefaults, activityMappingDefaults],
  )

  const selectFile = React.useCallback(
    async (file: File) => {
      setSelectedFile(file)
      if (isTabularFile(file.name)) {
        await loadPreview(file)
      } else {
        setPreview(null)
      }
    },
    [loadPreview],
  )

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    await selectFile(file)
  }

  const selectedIsTabular = Boolean(selectedFile && isTabularFile(selectedFile.name))
  const previewCols = isSmall && !showAllPreviewCols ? 4 : 8

  // When switching import kind, re-run preview for current file (tabular only)
  React.useEffect(() => {
    if (!selectedFile) return
    if (!selectedIsTabular) return
    loadPreview(selectedFile)
  }, [importKind])

  const platformCategoryOptions = React.useMemo(() => {
    return (userCategories || [])
      .map((c: any) => ({
        name: String(c?.name || "").trim(),
        color: String(c?.color || "").trim(),
      }))
      .filter((c) => Boolean(c.name))
  }, [userCategories])

  const platformCatsByKey = React.useMemo(() => {
    const m = new Map<string, { name: string; color: string }>()
    for (const c of platformCategoryOptions) {
      const key = normalizeCategoryKey(c.name)
      if (!m.has(key)) m.set(key, c)
    }
    return m
  }, [platformCategoryOptions])

  const platformCatsByLoose = React.useMemo(() => {
    const m = new Map<string, string>()
    for (const c of platformCategoryOptions) {
      const key = normalizeCategoryLoose(c.name)
      if (key && !m.has(key)) m.set(key, c.name)
    }
    return m
  }, [platformCategoryOptions])

  const previewCategoryValues = React.useMemo(() => {
    if (!preview || !selectedIsTabular) return [] as Array<{ key: string; raw: string }>
    const header = mapping.category
    if (!header) return [] as Array<{ key: string; raw: string }>
    const seen = new Map<string, string>()

    // If backend provided category values for the *suggested* category column,
    // prefer them (covers all rows, not only the sample preview).
    const suggestedHeader = (preview as any)?.suggested_mapping?.category
    const canUseBackendList =
      Boolean(suggestedHeader) &&
      header === suggestedHeader &&
      Array.isArray((preview as any)?.category_values) &&
      ((preview as any)?.category_values as any[]).length > 0

    if (canUseBackendList) {
      for (const raw of ((preview as any).category_values as any[]) || []) {
        const s = String(raw ?? "").trim()
        if (!s) continue
        const key = normalizeCategoryKey(s)
        if (!seen.has(key)) seen.set(key, s)
      }
    } else {
      for (const row of preview.samples || []) {
        const raw = row?.[header]
        const s = String(raw ?? "").trim()
        if (!s) continue
        const key = normalizeCategoryKey(s)
        if (!seen.has(key)) seen.set(key, s)
      }
    }
    return Array.from(seen.entries()).map(([key, raw]) => ({ key, raw }))
  }, [preview, selectedIsTabular, mapping.category])

  // Best-effort auto-match for common cases like "DIGITAL_MARKETING" vs "Digital Marketing"
  React.useEffect(() => {
    if (!selectedIsTabular || !preview || !mapping.category) return
    if (platformCategoryOptions.length === 0) return
    if (previewCategoryValues.length === 0) return

    setCategoryValueMap((prev) => {
      const next = { ...prev }
      for (const { key, raw } of previewCategoryValues) {
        if (platformCatsByKey.has(key)) continue
        if (next[key]) continue
        const sugg = platformCatsByLoose.get(normalizeCategoryLoose(raw))
        if (sugg) next[key] = sugg
      }
      return next
    })
  }, [
    mapping.category,
    platformCategoryOptions.length,
    platformCatsByKey,
    platformCatsByLoose,
    preview,
    previewCategoryValues,
    selectedIsTabular,
    setCategoryValueMap,
  ])

  const categoryMappingRequired =
    importKind === "activities" &&
    selectedIsTabular &&
    Boolean((mapping as any).category) &&
    platformCategoryOptions.length > 0 &&
    previewCategoryValues.length > 0

  const unresolvedCategoryKeys = React.useMemo(() => {
    if (!categoryMappingRequired) return [] as string[]
    return previewCategoryValues
      .filter(({ key }) => !platformCatsByKey.has(key) && !categoryValueMap[key])
      .map(({ key }) => key)
  }, [categoryMappingRequired, previewCategoryValues, platformCatsByKey, categoryValueMap])

  const categoryMappingOk = unresolvedCategoryKeys.length === 0

  const canProceed =
    Boolean(selectedFile) &&
    (selectedIsTabular
      ? importKind === "crm"
        ? Boolean((mapping as any).company_name) // at least a company key
        : Boolean((mapping as any).title) && (!categoryMappingRequired || categoryMappingOk)
      : true)

  const categoryMappingRows = React.useMemo(() => {
    if (!categoryMappingRequired) return [] as Array<{ key: string; raw: string; state: "matched" | "mapped" | "unmapped"; effective: string }>
    return previewCategoryValues.map(({ key, raw }) => {
      const direct = platformCatsByKey.get(key)
      const mapped = categoryValueMap[key]
      const state: "matched" | "mapped" | "unmapped" = mapped ? "mapped" : direct ? "matched" : "unmapped"
      const effective = mapped || direct?.name || raw
      return { key, raw, state, effective }
    })
  }, [categoryMappingRequired, previewCategoryValues, platformCatsByKey, categoryValueMap])

  const circlePreview = React.useMemo(() => {
    if (importKind !== "activities") {
      return { year: new Date().getFullYear(), activities: [] as any[] }
    }
    if (!preview || !selectedIsTabular) {
      return { year: new Date().getFullYear(), activities: [] as any[] }
    }

    const getCell = (row: any, field: keyof typeof mapping): any => {
      const header = mapping[field]
      if (header) return row?.[header]
      // Fallback: try common variants when mapping isn't set
      const f = String(field)
      return row?.[f] ?? row?.[f.toLowerCase()] ?? row?.[f.toUpperCase()]
    }

    const allowed = new Set(["PLANNED", "ACTIVE", "PAUSED", "DONE", "CANCELLED"])

    const acts = (preview.samples || []).map((row: any, idx: number) => {
      const title = String(getCell(row, "title") ?? "").trim() || `Row ${idx + 1}`

      const catRaw = String(getCell(row, "category") ?? "").trim() || "VERKAUFSFOERDERUNG"
      const catKey = normalizeCategoryKey(catRaw)
      const category = categoryValueMap[catKey] || platformCatsByKey.get(catKey)?.name || catRaw

      const statusRaw = String(getCell(row, "status") ?? "ACTIVE").trim().toUpperCase()
      const statusNorm = statusRaw === "COMPLETED" ? "DONE" : statusRaw
      const status = (allowed.has(statusNorm) ? statusNorm : "ACTIVE") as any

      const budgetRaw = getCell(row, "budget")
      const budgetNum = Number(budgetRaw)
      const budgetCHF = Number.isFinite(budgetNum) ? budgetNum : 0

      const weightRaw = getCell(row, "weight")
      const weightNum = Number(weightRaw)
      const weight = Number.isFinite(weightNum) ? weightNum : 1

      const start = parseDateLike(getCell(row, "start"))
      const end = parseDateLike(getCell(row, "end"))

      const notes = String(getCell(row, "notes") ?? "").trim() || undefined

      return { id: `preview-${idx}`, title, category, status, weight, budgetCHF, start, end, notes }
    })

    const year = (acts.find((a: any) => a?.start instanceof Date)?.start as Date | undefined)?.getFullYear() || new Date().getFullYear()
    return { year, activities: acts }
  }, [preview, selectedIsTabular, mapping, platformCatsByKey, categoryValueMap])

  const doImport = async () => {
    if (!selectedFile) return
    const isTab = selectedIsTabular
    setError(null)
    setUploading(true)
    try {
      let mappingClean: Record<string, string | null> | undefined = undefined
      if (isTab) {
        mappingClean = {}
        Object.entries(mapping).forEach(([k, v]) => {
          ;(mappingClean as any)[k] = v ? String(v) : null
        })
        // Optional: category value remap (file category -> existing platform category)
        if (importKind === "activities" && Object.keys(categoryValueMap || {}).length > 0) {
          ;(mappingClean as any).category_value_map = categoryValueMap
        }
      }
      await uploadFile(selectedFile, undefined, mappingClean, importKind)
      setSelectedFile(null)
      setPreview(null)
      setMapping(importKind === "crm" ? crmMappingDefaults : activityMappingDefaults)
      setCategoryValueMap({})
      setBulkCategoryTarget("")
      if (isTab) await Promise.all([refresh(), refreshJobs()])
      else await refresh()
    } catch (e: any) {
      setError(e?.message || (isTab ? "Import fehlgeschlagen" : "Upload fehlgeschlagen"))
    } finally {
      setUploading(false)
    }
  }

  const totalSize = React.useMemo(
    () => uploads.reduce((s, u: any) => s + (Number(u?.file_size) || 0), 0),
    [uploads],
  )

  const lastUploadAt = React.useMemo(() => {
    const u0 = uploads?.[0] as any
    return u0?.created_at || null
  }, [uploads])

  const kinds = React.useMemo(() => {
    const acc = { table: 0, pdf: 0, image: 0, video: 0, file: 0, other: 0 }
    for (const u of uploads as any[]) {
      const name = String(u?.original_name || "")
      const kind = kindOf(name, String(u?.file_type || ""))
      if ((acc as any)[kind] != null) (acc as any)[kind] += 1
      else acc.other += 1
    }
    return acc
  }, [uploads])

  const jobsByStatus = React.useMemo(() => {
    const acc: Record<string, number> = { queued: 0, processing: 0, completed: 0, failed: 0, other: 0 }
    for (const j of jobs as any[]) {
      const s = String(j?.status || "").toLowerCase()
      if (s in acc) acc[s] += 1
      else acc.other += 1
    }
    return acc
  }, [jobs])

  const last7Days = React.useMemo(() => {
    const now = new Date()
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now)
      d.setHours(0, 0, 0, 0)
      d.setDate(d.getDate() - (6 - i))
      return d
    })
    const counts = days.map((day) => {
      const y = day.getFullYear()
      const m = day.getMonth()
      const dd = day.getDate()
      return uploads.filter((u: any) => {
        if (!u?.created_at) return false
        const t = new Date(u.created_at)
        return t.getFullYear() === y && t.getMonth() === m && t.getDate() === dd
      }).length
    })
    const max = Math.max(1, ...counts)
    return { days, counts, max }
  }, [uploads])

  const uploadedToday = React.useMemo(() => {
    const today = new Date()
    const y = today.getFullYear()
    const m = today.getMonth()
    const d = today.getDate()
    return uploads.filter((u: any) => {
      if (!u?.created_at) return false
      const t = new Date(u.created_at)
      return t.getFullYear() === y && t.getMonth() === m && t.getDate() === d
    }).length
  }, [uploads])

  const filteredUploads = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return uploads
    return uploads.filter((u: any) => {
      const name = String(u?.original_name || "").toLowerCase()
      const ft = String(u?.file_type || "").toLowerCase()
      return name.includes(q) || ft.includes(q) || String(u?.id || "").includes(q)
    })
  }, [uploads, query])

  const notAvailable = (title: string) =>
    openModal({
      type: "info",
      title,
      description: "Diese Funktion ist in der aktuellen Version noch nicht verfügbar.",
      icon: "info",
    })

  return (
    <motion.div
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-7 sm:space-y-9"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants} className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-950/70 via-slate-950/50 to-slate-950/70 p-6 sm:p-8">
        <div className="pointer-events-none absolute -top-24 -right-24 h-44 w-44 rounded-full bg-gradient-to-tr from-rose-500/25 to-orange-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-24 h-44 w-44 rounded-full bg-gradient-to-tr from-blue-500/20 to-cyan-500/10 blur-3xl" />

        <div className="relative flex flex-col gap-4 sm:gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-gradient-to-br from-rose-500/20 to-orange-500/10 border border-white/10 flex items-center justify-center backdrop-blur-sm">
              <UploadCloud className="h-6 w-6 sm:h-7 sm:w-7 text-rose-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-3xl font-light tracking-tight text-slate-100">Uploads</h1>
                <Badge className="glass-card text-[10px] sm:text-xs px-2 py-1">Import Center</Badge>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                CSV/XLSX importieren, Dateien verwalten und den Status im Blick behalten.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              onChange={onFileChange}
              accept=".csv,.xlsx,.xls,.pdf,.png,.jpg,.jpeg,.webp"
            />
            <Button
              variant="outline"
              className="glass-card"
              onClick={async () => {
                setError(null)
                try {
                  await Promise.all([refresh(), refreshJobs()])
                } catch (e: any) {
                  setError(e?.message || "Aktualisieren fehlgeschlagen")
                }
              }}
              disabled={uploading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${uploading ? "animate-spin" : ""}`} />
              Aktualisieren
            </Button>
            <Button onClick={onPick} disabled={uploading} className="bg-kaboom-red hover:bg-red-600">
              <UploadCloud className="h-4 w-4 mr-2" />
              Datei hochladen
            </Button>
          </div>
        </div>

        <div className="relative mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 flex items-center justify-between">
            <div className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Letzter Upload: <span className="font-semibold text-slate-100">{formatRelativeTime(lastUploadAt)}</span>
            </div>
            <ArrowUpRight className="h-4 w-4 text-slate-400" />
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 flex items-center justify-between">
            <div className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Speicher genutzt: <span className="font-semibold text-slate-100">{formatBytes(totalSize)}</span>
            </div>
            <HardDrive className="h-4 w-4 text-slate-400" />
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 flex items-center justify-between">
            <div className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Import Jobs:{" "}
              <span className="font-semibold text-slate-100">
                {jobsByStatus.completed} ok · {jobsByStatus.failed} failed
              </span>
            </div>
            <Briefcase className="h-4 w-4 text-slate-400" />
          </div>
        </div>
      </motion.div>

      {error && (
        <motion.div
          variants={itemVariants}
          className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200"
        >
          {error}
        </motion.div>
      )}

      {/* KPIs */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <Card className="glass-card">
          <CardContent className="p-5 sm:p-6 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-600 dark:text-slate-400">Dateien</div>
              <div className="text-xl font-semibold text-slate-900 dark:text-slate-100">{uploads.length}</div>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <FileText className="h-6 w-6 text-slate-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-5 sm:p-6 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-600 dark:text-slate-400">Speicher</div>
              <div className="text-xl font-semibold text-slate-900 dark:text-slate-100">{formatBytes(totalSize)}</div>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <HardDrive className="h-6 w-6 text-slate-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-5 sm:p-6 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-600 dark:text-slate-400">Heute hochgeladen</div>
              <div className="text-xl font-semibold text-slate-900 dark:text-slate-100">{uploadedToday}</div>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Plus className="h-6 w-6 text-slate-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-5 sm:p-6 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-600 dark:text-slate-400">Import Jobs</div>
              <div className="text-xl font-semibold text-slate-900 dark:text-slate-100">{jobs.length}</div>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Briefcase className="h-6 w-6 text-slate-400" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Insights */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="glass-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-slate-300" />
              Upload Verlauf (7 Tage)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-3 h-28">
              {last7Days.counts.map((c, i) => {
                const h = Math.round((c / last7Days.max) * 64) + 6
                const d = last7Days.days[i]
                const label = d.toLocaleDateString("de-DE", { weekday: "short" })
                return (
                  <div key={i} className="flex flex-col items-center gap-2 flex-1">
                    <div className="w-full rounded-lg bg-white/5 border border-white/10 overflow-hidden">
                      <div
                        className="w-full bg-gradient-to-t from-rose-500/70 to-orange-400/60"
                        style={{ height: `${h}px` }}
                        title={`${c} Uploads`}
                      />
                    </div>
                    <div className="text-[10px] text-slate-500">{label}</div>
                  </div>
                )
              })}
            </div>
            <div className="mt-3 text-xs text-slate-400 flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              Tipp: Nutze CSV/XLSX Templates für saubere Imports.
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                className="glass-card"
                onClick={() => window.open("/api/uploads/template/csv", "_blank")}
              >
                Template CSV
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="glass-card"
                onClick={() => window.open("/api/uploads/template/xlsx", "_blank")}
              >
                Template XLSX
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-300" />
              Dateitypen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-slate-400">CSV/XLSX</div>
                <div className="text-slate-100 font-semibold">{kinds.table}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-slate-400">Bilder</div>
                <div className="text-slate-100 font-semibold">{kinds.image}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-slate-400">PDF</div>
                <div className="text-slate-100 font-semibold">{kinds.pdf}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-slate-400">Andere</div>
                <div className="text-slate-100 font-semibold">{kinds.file + kinds.video + kinds.other}</div>
              </div>
            </div>
            <div className="text-xs text-slate-400 flex items-start gap-2">
              <Info className="h-4 w-4 text-slate-400 mt-0.5" />
              <div>
                <div className="text-slate-200 font-medium">Import Hinweis</div>
                CSV/XLSX wird importiert. Andere Dateitypen werden gespeichert (ohne Import).
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-slate-300" />
              Import Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-emerald-500/15 text-emerald-200 border border-emerald-500/30">
                completed: {jobsByStatus.completed}
              </Badge>
              <Badge className="bg-amber-500/15 text-amber-200 border border-amber-500/30">
                processing: {jobsByStatus.processing}
              </Badge>
              <Badge className="bg-slate-500/15 text-slate-200 border border-slate-500/30">
                queued: {jobsByStatus.queued}
              </Badge>
              <Badge className="bg-red-500/15 text-red-200 border border-red-500/30">failed: {jobsByStatus.failed}</Badge>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-slate-300">
              <div className="font-semibold text-slate-100">Production Ready</div>
              <div className="mt-1 text-slate-400">
                Uploads werden in der Datenbank gespeichert (free‑tier freundlich). So gehen Dateien bei Deploys nicht verloren.
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Dropzone + Preview */}
      <Card
        className={`glass-card border-2 ${dragOver ? "border-kaboom-red/60" : "border-white/10"} border-dashed`}
        data-tour="uploads-dropzone"
      >
        <CardContent
          className="p-6 sm:p-8"
          onDragEnter={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setDragOver(true)
          }}
          onDragOver={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setDragOver(true)
          }}
          onDragLeave={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setDragOver(false)
          }}
          onDrop={async (e) => {
            e.preventDefault()
            e.stopPropagation()
            setDragOver(false)
            const file = e.dataTransfer.files?.[0]
            if (file) await selectFile(file)
          }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 sm:gap-6">
            <div className="flex items-start gap-4">
              <div className="h-11 w-11 rounded-2xl bg-kaboom-red/15 flex items-center justify-center">
                <UploadCloud className="h-6 w-6 text-kaboom-red" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Datei auswählen</div>
                <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  CSV/XLSX kann als Aktivitäten oder CRM importiert werden. PDF/Bilder werden gespeichert (ohne Import).
                </div>
                {selectedFile && (
                  <div className="mt-2 text-xs text-slate-700 dark:text-slate-300">
                    Ausgewählt: <span className="font-semibold">{selectedFile.name}</span>{" "}
                    <span className="text-slate-500">({formatBytes(selectedFile.size)})</span>
                  </div>
                )}
                {selectedIsTabular && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <div className="text-xs text-slate-600 dark:text-slate-400">Importieren als:</div>
                    <select
                      className="h-9 rounded-lg border border-slate-300/40 dark:border-slate-700 bg-white/70 dark:bg-slate-900/60 px-3 text-xs text-slate-900 dark:text-slate-100"
                      value={importKind}
                      onChange={(e) => setImportKind((e.target.value as any) || "activities")}
                    >
                      <option value="activities">Aktivitäten (Marketing Circle)</option>
                      <option value="crm">CRM (Companies/Contacts/Deals)</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                className="glass-card w-full sm:w-auto"
                onClick={onPick}
                disabled={uploading || previewLoading}
              >
                Datei wählen
              </Button>
              <Button
                className="bg-kaboom-red hover:bg-red-600 w-full sm:w-auto"
                onClick={doImport}
                disabled={uploading || previewLoading || !canProceed}
                title={
                  !canProceed
                    ? selectedIsTabular
                      ? "Für CSV/XLSX ist mindestens das Feld 'title' erforderlich"
                      : "Bitte zuerst eine Datei auswählen"
                    : undefined
                }
              >
                {canProceed ? <CheckCircle2 className="h-4 w-4 mr-2" /> : <AlertTriangle className="h-4 w-4 mr-2" />}
                {selectedIsTabular ? "Import starten" : "Upload speichern"}
              </Button>
            </div>
          </div>

          {previewLoading && (
            <div className="mt-4 text-sm text-slate-500 dark:text-slate-400">Lade Vorschau…</div>
          )}

          {preview && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between gap-2" data-tour="uploads-mapping">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Mapping</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  Pflicht:{" "}
                  <span className="font-semibold">{importKind === "crm" ? "company_name" : "title"}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.keys(mapping).map((k) => (
                  <label key={k} className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{k}</span>
                      {(k === (importKind === "crm" ? "company_name" : "title")) && <Badge className="text-[10px]">required</Badge>}
                    </div>
                    <select
                      className="w-full rounded-lg border border-slate-300/40 dark:border-slate-700 bg-white/70 dark:bg-slate-900/60 px-3 py-2.5 text-xs"
                      value={mapping[k] || ""}
                      onChange={(e) =>
                        setMapping((prev) => ({
                          ...prev,
                          [k]: e.target.value ? e.target.value : null,
                        }))
                      }
                    >
                      <option value="">—</option>
                      {preview.headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Vorschau</div>
                {isSmall && preview.headers.length > 4 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="glass-card"
                    onClick={() => setShowAllPreviewCols((v) => !v)}
                  >
                    {showAllPreviewCols ? "Weniger Spalten" : "Mehr Spalten"}
                  </Button>
                )}
              </div>
              {/* Mobile: cards (no horizontal table scroll). Desktop: table. */}
              {isSmall ? (
                <div className="space-y-2">
                  {preview.samples.map((row, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                          Zeile {idx + 1}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {Math.min(previewCols, preview.headers.length)} Felder
                        </div>
                      </div>
                      <div className="mt-2 space-y-2">
                        {preview.headers.slice(0, previewCols).map((h) => {
                          const raw = row?.[h]
                          const v = raw != null ? String(raw).slice(0, 220) : ""
                          return (
                            <div key={h} className="flex items-start justify-between gap-3">
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 w-[44%] shrink-0 truncate">
                                {h}
                              </div>
                              <div className="text-[11px] text-slate-800 dark:text-slate-200 flex-1 text-right break-words">
                                {v || "—"}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="overflow-auto mk-no-scrollbar rounded-lg border border-slate-200/60 dark:border-slate-800">
                  <table className="min-w-full text-xs">
                    <thead className="bg-slate-50/70 dark:bg-slate-900/60">
                      <tr>
                        {preview.headers.slice(0, previewCols).map((h) => (
                          <th key={h} className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800">
                      {preview.samples.map((row, idx) => (
                        <tr key={idx}>
                          {preview.headers.slice(0, previewCols).map((h) => (
                            <td key={h} className="px-4 py-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                              {row?.[h] != null ? String(row[h]).slice(0, 120) : ""}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Circle preview */}
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {importKind === "crm" ? "CRM Vorschau" : "Kreis Vorschau"}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      basiert auf {preview.samples.length} Zeilen
                    </div>
                  </div>
                  <div className="mt-4">
                    {importKind === "activities" && circlePreview.activities.length > 0 ? (
                      <RadialCircle
                        activities={circlePreview.activities as any}
                        categories={platformCategoryOptions}
                        size={circleSize}
                        year={circlePreview.year}
                      />
                    ) : importKind === "crm" ? (
                      <div className="rounded-lg border border-dashed border-white/15 bg-white/5 p-5 text-xs text-slate-700 dark:text-slate-300 space-y-2">
                        <div className="font-semibold">Was wird importiert?</div>
                        <div>
                          - Company wird über <b>company_name</b> erkannt (weitere Felder optional).
                        </div>
                        <div>
                          - Contact wird über <b>contact_email</b> oder <b>contact_name</b> erkannt (optional).
                        </div>
                        <div>
                          - Deal wird über <b>deal_title</b> erkannt (optional).
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Nach dem Import findest du die Daten unter <b>CRM</b> (Unternehmen, Kontakte, Deals).
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed border-white/15 bg-white/5 p-5 text-center text-xs text-slate-600 dark:text-slate-400">
                        Keine Aktivitäten für die Vorschau gefunden (prüfe bitte das Mapping für <b>title</b> / <b>start</b> / <b>end</b>).
                      </div>
                    )}
                  </div>
                </div>

                {/* Category reconciliation */}
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Kategorie-Abgleich</div>
                    {categoryMappingRequired && (
                      <Badge
                        variant="outline"
                        className={
                          unresolvedCategoryKeys.length > 0
                            ? "border-rose-500/30 text-rose-300 bg-rose-500/10"
                            : "border-emerald-500/30 text-emerald-300 bg-emerald-500/10"
                        }
                      >
                        {unresolvedCategoryKeys.length > 0
                          ? `${unresolvedCategoryKeys.length} offen`
                          : "alles zugeordnet"}
                      </Badge>
                    )}
                  </div>

                  {importKind !== "activities" ? (
                    <div className="mt-3 text-xs text-slate-600 dark:text-slate-400">
                      Für CRM-Import gibt es keinen Kategorie-Abgleich.
                    </div>
                  ) : !(mapping as any).category ? (
                    <div className="mt-3 text-xs text-slate-600 dark:text-slate-400">
                      Wähle zuerst im Mapping die Spalte für <b>category</b>. Danach kannst du nicht passende Kategorien
                      auf deine bestehenden Kategorien am Kreis mappen.
                    </div>
                  ) : platformCategoryOptions.length === 0 ? (
                    <div className="mt-3 text-xs text-slate-600 dark:text-slate-400">
                      Keine bestehenden Kategorien gefunden. Lege zuerst Kategorien an (z.B. unter <b>Performance</b>),
                      dann kannst du hier sauber mappen.
                    </div>
                  ) : previewCategoryValues.length === 0 ? (
                    <div className="mt-3 text-xs text-slate-600 dark:text-slate-400">
                      In der Vorschau wurden keine Kategorien gefunden (prüfe bitte die ausgewählte Kategorie-Spalte).
                    </div>
                  ) : (
                    <>
                      <div className="mt-3 text-xs text-slate-600 dark:text-slate-400">
                        Wenn Kategorien aus der Datei nicht zu deinen Kategorien am Kreis passen, kannst du sie hier
                        ersetzen. Beim Import wird die ersetzte Kategorie in der DB gespeichert.
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <select
                          value={bulkCategoryTarget}
                          onChange={(e) => setBulkCategoryTarget(e.target.value)}
                          className="min-w-[220px] rounded-lg border border-slate-200/60 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                        >
                          <option value="">— alle offenen zuordnen —</option>
                          {platformCategoryOptions.map((opt) => (
                            <option key={opt.name} value={opt.name}>
                              {opt.name}
                            </option>
                          ))}
                        </select>
                        <Button
                          size="sm"
                          variant="outline"
                          className="glass-card"
                          disabled={!bulkCategoryTarget || unresolvedCategoryKeys.length === 0}
                          onClick={() => {
                            if (!bulkCategoryTarget) return
                            setCategoryValueMap((prev) => {
                              const next = { ...prev }
                              for (const k of unresolvedCategoryKeys) next[k] = bulkCategoryTarget
                              return next
                            })
                          }}
                        >
                          Für alle offenen übernehmen
                        </Button>
                        {Object.keys(categoryValueMap).length > 0 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-slate-600 dark:text-slate-300"
                            onClick={() => {
                              setCategoryValueMap({})
                              setBulkCategoryTarget("")
                            }}
                          >
                            Reset
                          </Button>
                        )}
                      </div>

                      <div className="mt-4 space-y-3 max-h-[360px] overflow-auto pr-1">
                        {categoryMappingRows.map((c) => {
                          const selected =
                            categoryValueMap[c.key] || platformCatsByKey.get(c.key)?.name || ""
                          const isMissing = c.state === "unmapped"
                          return (
                            <div
                              key={c.key}
                              className={
                                "flex items-center justify-between gap-3 rounded-lg border px-3 py-2 " +
                                (isMissing
                                  ? "border-rose-500/25 bg-rose-500/5"
                                  : "border-white/10 bg-white/5")
                              }
                            >
                              <div className="min-w-0">
                                <div className="text-xs text-slate-500 dark:text-slate-400">aus Datei</div>
                                <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                                  {c.raw}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <div className="text-xs text-slate-500 dark:text-slate-400">→</div>
                                <select
                                  value={selected}
                                  onChange={(e) => {
                                    const v = e.target.value
                                    setCategoryValueMap((prev) => {
                                      const next = { ...prev }
                                      if (!v) delete next[c.key]
                                      else next[c.key] = v
                                      return next
                                    })
                                  }}
                                  className="min-w-[180px] rounded-lg border border-slate-200/60 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                                >
                                  <option value="">— auswählen —</option>
                                  {platformCategoryOptions.map((opt) => (
                                    <option key={opt.name} value={opt.name}>
                                      {opt.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload list */}
        <Card className="glass-card" data-tour="uploads-list">
          <CardHeader className="pb-3 space-y-3">
            <CardTitle className="text-base">Letzte Uploads</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Suche nach Dateinamen, Typ oder ID…"
                className="pl-9 bg-white/60 dark:bg-slate-900/60"
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 rounded-xl bg-white/5" />
                ))}
              </div>
            ) : filteredUploads.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/15 bg-white/5 p-7 text-center">
                <div className="mx-auto h-12 w-12 rounded-2xl bg-gradient-to-br from-rose-500/20 to-orange-500/10 border border-white/10 flex items-center justify-center">
                  <UploadCloud className="h-6 w-6 text-rose-400" />
                </div>
                <div className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Noch keine Uploads</div>
                <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  Lade eine Datei hoch oder starte direkt mit einem Template.
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  <Button size="sm" className="bg-kaboom-red hover:bg-red-600" onClick={onPick}>
                    Datei auswählen
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="glass-card"
                    onClick={() => window.open("/api/uploads/template/csv", "_blank")}
                  >
                    Template CSV
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="glass-card"
                    onClick={() => window.open("/api/uploads/template/xlsx", "_blank")}
                  >
                    Template XLSX
                  </Button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-200/60 dark:divide-slate-800">
                {filteredUploads.slice(0, 12).map((u: any) => {
                  const name = String(u.original_name || "")
                  const kind = kindOf(name, String(u.file_type || ""))
                  const Icon = iconFor(kind)
                  return (
                    <div key={u.id} className="py-4 flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon className="h-4 w-4 text-slate-500 flex-shrink-0" />
                        <div className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                          {name}
                        </div>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
                        <Badge variant="outline" className="text-[10px]">
                          {labelFor(kind, name)}
                        </Badge>
                        {u?.stored_in_db && (
                          <Badge className="text-[10px] bg-emerald-500/15 text-emerald-200 border border-emerald-500/30">
                            DB
                          </Badge>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <HardDrive className="h-3.5 w-3.5" />
                          {formatBytes(Number(u.file_size || 0))}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {u.created_at ? new Date(u.created_at).toLocaleString("de-DE") : "—"}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-slate-400" />
                          {u.file_type || "file"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="glass-card"
                        onClick={() =>
                          openModal({
                            type: "info",
                            title: "Datei",
                            description: `${name}\n\nTyp: ${u.file_type || "-"}\nGröße: ${formatBytes(
                              Number(u.file_size || 0),
                            )}\nIn DB gespeichert: ${u?.stored_in_db ? "Ja" : "Nein"}\nSHA256: ${
                              u?.sha256 ? String(u.sha256).slice(0, 16) + "…" : "—"
                            }\nID: ${u.id}`,
                            icon: "info",
                          })
                        }
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="glass-card" onClick={() => notAvailable("Download")}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="glass-card" onClick={() => notAvailable("Teilen")}>
                        <Share2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                        onClick={() => notAvailable("Löschen")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Jobs list */}
        <Card className="glass-card" data-tour="jobs-list">
          <CardHeader className="pb-3 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base">Import Jobs</CardTitle>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Badge className="bg-emerald-500/15 text-emerald-200 border border-emerald-500/30 text-[10px]">
                  completed {jobsByStatus.completed}
                </Badge>
                <Badge className="bg-amber-500/15 text-amber-200 border border-amber-500/30 text-[10px]">
                  processing {jobsByStatus.processing}
                </Badge>
                <Badge className="bg-red-500/15 text-red-200 border border-red-500/30 text-[10px]">
                  failed {jobsByStatus.failed}
                </Badge>
              </div>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400">
              Imports laufen im Hintergrund. Hier siehst du den Status der letzten Jobs.
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {jobsLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 rounded-xl bg-white/5" />
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/15 bg-white/5 p-7">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <Briefcase className="h-5 w-5 text-slate-300" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Noch keine Jobs</div>
                    <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                      Starte einen CSV/XLSX Import – danach erscheinen hier die Job-Details.
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-200/60 dark:divide-slate-800">
                {jobs.slice(0, 12).map((j: any) => {
                  const status = String(j.status || "")
                  const s = status.toLowerCase()
                  const dot =
                    s === "completed"
                      ? "bg-emerald-400"
                      : s === "failed"
                        ? "bg-red-400"
                        : s === "processing"
                          ? "bg-amber-400"
                          : "bg-slate-400"
                  return (
                  <div key={j.id} className="py-4 flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge className="text-[10px]">{j.type || "job"}</Badge>
                        <span className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                          <span className={`h-2 w-2 rounded-full ${dot}`} />
                          {status}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-slate-700 dark:text-slate-300">
                        {j.created_at ? new Date(j.created_at).toLocaleString("de-DE") : "—"}
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">#{j.id}</div>
                  </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}

