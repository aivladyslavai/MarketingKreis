"use client"

import React from "react"
import { UploadCloud, RefreshCw, FileText, HardDrive, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useUploadsApi } from "@/hooks/use-uploads-api"

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

export default function UploadsPage() {
  const fileRef = React.useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const { uploads, isLoading, refresh, uploadFile } = useUploadsApi()

  const onPick = () => fileRef.current?.click()

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return

    setError(null)
    setUploading(true)
    try {
      await uploadFile(file)
      await refresh()
    } catch (err: any) {
      setError(err?.message || "Upload fehlgeschlagen")
    } finally {
      setUploading(false)
    }
  }

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
                await refresh()
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

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Letzte Uploads</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="text-sm text-slate-500 dark:text-slate-400">Lade Uploads…</div>
          ) : uploads.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300/50 dark:border-slate-700 p-6 text-center">
              <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <UploadCloud className="h-6 w-6 text-slate-500" />
              </div>
              <div className="text-sm font-medium text-slate-900 dark:text-slate-100">Noch keine Uploads</div>
              <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                Klicke auf <span className="font-semibold">„Datei hochladen“</span>, um zu starten.
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-200/60 dark:divide-slate-800">
              {uploads.map((u) => (
                <div key={u.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-4 w-4 text-slate-500 flex-shrink-0" />
                      <div className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                        {u.original_name}
                      </div>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
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
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">#{u.id}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

