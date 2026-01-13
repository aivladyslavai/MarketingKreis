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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useModal } from "@/components/ui/modal/ModalProvider"
import { useJobsApi, useUploadsApi } from "@/hooks/use-uploads-api"

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

export default function UploadsPage() {
  const { openModal } = useModal()
  const fileRef = React.useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [previewLoading, setPreviewLoading] = React.useState(false)
  const [preview, setPreview] = React.useState<{
    headers: string[]
    samples: any[]
    suggested_mapping: Record<string, string | null>
  } | null>(null)
  const [mapping, setMapping] = React.useState<Record<string, string | null>>({
    title: null,
    category: null,
    status: null,
    budget: null,
    notes: null,
    start: null,
    end: null,
    weight: null,
  })
  const [dragOver, setDragOver] = React.useState(false)
  const [query, setQuery] = React.useState("")

  const { uploads, isLoading, refresh, uploadFile, previewFile } = useUploadsApi()
  const { jobs, isLoading: jobsLoading, refresh: refreshJobs } = useJobsApi()

  const onPick = () => fileRef.current?.click()

  const loadPreview = React.useCallback(
    async (file: File) => {
      setPreview(null)
      setError(null)
      setPreviewLoading(true)
      try {
        const p = await previewFile(file)
        setPreview(p)
        setMapping((prev) => ({ ...prev, ...(p?.suggested_mapping || {}) }))
      } catch (e: any) {
        setError(e?.message || "Vorschau konnte nicht geladen werden")
      } finally {
        setPreviewLoading(false)
      }
    },
    [previewFile],
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

  const canImport = Boolean(selectedFile && isTabularFile(selectedFile.name) && mapping.title)

  const doImport = async () => {
    if (!selectedFile) return
    setError(null)
    setUploading(true)
    try {
      const mappingClean: Record<string, string | null> = {}
      Object.entries(mapping).forEach(([k, v]) => {
        mappingClean[k] = v ? String(v) : null
      })
      await uploadFile(selectedFile, undefined, mappingClean)
      setSelectedFile(null)
      setPreview(null)
      setMapping({
        title: null,
        category: null,
        status: null,
        budget: null,
        notes: null,
        start: null,
        end: null,
        weight: null,
      })
      await Promise.all([refresh(), refreshJobs()])
    } catch (e: any) {
      setError(e?.message || "Import fehlgeschlagen")
    } finally {
      setUploading(false)
    }
  }

  const totalSize = React.useMemo(
    () => uploads.reduce((s, u: any) => s + (Number(u?.file_size) || 0), 0),
    [uploads],
  )

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-100">Uploads</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Dateien hochladen und importieren (CSV, XLSX, PDF …)
          </p>
        </div>
        <div className="flex items-center gap-2">
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

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-600 dark:text-slate-400">Dateien</div>
              <div className="text-xl font-semibold text-slate-900 dark:text-slate-100">{uploads.length}</div>
            </div>
            <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-slate-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-600 dark:text-slate-400">Speicher</div>
              <div className="text-xl font-semibold text-slate-900 dark:text-slate-100">{formatBytes(totalSize)}</div>
            </div>
            <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <HardDrive className="h-5 w-5 text-slate-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-600 dark:text-slate-400">Heute hochgeladen</div>
              <div className="text-xl font-semibold text-slate-900 dark:text-slate-100">{uploadedToday}</div>
            </div>
            <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Plus className="h-5 w-5 text-slate-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-600 dark:text-slate-400">Import Jobs</div>
              <div className="text-xl font-semibold text-slate-900 dark:text-slate-100">{jobs.length}</div>
            </div>
            <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Briefcase className="h-5 w-5 text-slate-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dropzone + Preview */}
      <Card className={`glass-card border-2 ${dragOver ? "border-kaboom-red/60" : "border-white/10"} border-dashed`}>
        <CardContent
          className="p-5"
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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="h-11 w-11 rounded-2xl bg-kaboom-red/15 flex items-center justify-center">
                <UploadCloud className="h-6 w-6 text-kaboom-red" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Datei auswählen</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  Ziehe eine CSV/XLSX hierher oder wähle eine Datei aus. CSV/XLSX wird als Aktivitäten importiert.
                </div>
                {selectedFile && (
                  <div className="mt-2 text-xs text-slate-700 dark:text-slate-300">
                    Ausgewählt: <span className="font-semibold">{selectedFile.name}</span>{" "}
                    <span className="text-slate-500">({formatBytes(selectedFile.size)})</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="glass-card" onClick={onPick} disabled={uploading || previewLoading}>
                Datei wählen
              </Button>
              <Button
                className="bg-kaboom-red hover:bg-red-600"
                onClick={doImport}
                disabled={uploading || previewLoading || !canImport}
                title={!canImport ? "Für CSV/XLSX ist mindestens das Feld 'title' erforderlich" : undefined}
              >
                {canImport ? <CheckCircle2 className="h-4 w-4 mr-2" /> : <AlertTriangle className="h-4 w-4 mr-2" />}
                Import starten
              </Button>
            </div>
          </div>

          {previewLoading && (
            <div className="mt-4 text-sm text-slate-500 dark:text-slate-400">Lade Vorschau…</div>
          )}

          {preview && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Mapping</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  Pflicht: <span className="font-semibold">title</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {Object.keys(mapping).map((k) => (
                  <label key={k} className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{k}</span>
                      {k === "title" && <Badge className="text-[10px]">required</Badge>}
                    </div>
                    <select
                      className="w-full rounded-md border border-slate-300/40 dark:border-slate-700 bg-white/70 dark:bg-slate-900/60 px-2 py-2 text-xs"
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

              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Vorschau</div>
              <div className="overflow-auto rounded-lg border border-slate-200/60 dark:border-slate-800">
                <table className="min-w-full text-xs">
                  <thead className="bg-slate-50/70 dark:bg-slate-900/60">
                    <tr>
                      {preview.headers.slice(0, 8).map((h) => (
                        <th key={h} className="px-3 py-2 text-left font-semibold text-slate-700 dark:text-slate-200">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800">
                    {preview.samples.map((row, idx) => (
                      <tr key={idx}>
                        {preview.headers.slice(0, 8).map((h) => (
                          <td key={h} className="px-3 py-2 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            {row?.[h] != null ? String(row[h]).slice(0, 120) : ""}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Upload list */}
        <Card className="glass-card">
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
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="text-sm text-slate-500 dark:text-slate-400">Lade Uploads…</div>
            ) : filteredUploads.length === 0 ? (
              <div className="text-sm text-slate-500 dark:text-slate-400">Noch keine Uploads.</div>
            ) : (
              <div className="divide-y divide-slate-200/60 dark:divide-slate-800">
                {filteredUploads.slice(0, 12).map((u: any) => {
                  const name = String(u.original_name || "")
                  const kind = kindOf(name, String(u.file_type || ""))
                  const Icon = iconFor(kind)
                  return (
                    <div key={u.id} className="py-3 flex items-start justify-between gap-3">
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
                            )}\nID: ${u.id}`,
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
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Import Jobs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {jobsLoading ? (
              <div className="text-sm text-slate-500 dark:text-slate-400">Lade Jobs…</div>
            ) : jobs.length === 0 ? (
              <div className="text-sm text-slate-500 dark:text-slate-400">Noch keine Jobs.</div>
            ) : (
              <div className="divide-y divide-slate-200/60 dark:divide-slate-800">
                {jobs.slice(0, 12).map((j: any) => (
                  <div key={j.id} className="py-3 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge className="text-[10px]">{j.type || "job"}</Badge>
                        <span className="text-xs text-slate-600 dark:text-slate-400">{j.status}</span>
                      </div>
                      <div className="mt-1 text-xs text-slate-700 dark:text-slate-300">
                        {j.created_at ? new Date(j.created_at).toLocaleString("de-DE") : "—"}
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">#{j.id}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

