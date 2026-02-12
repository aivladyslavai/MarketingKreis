"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { notificationsAPI, type NotificationDTO } from "@/lib/api"
import { Bell, BellOff, CheckCheck, ExternalLink, Loader2, RotateCcw, Search } from "lucide-react"

export function NotificationsPanel() {
  const [items, setItems] = React.useState<NotificationDTO[]>([])
  const [loading, setLoading] = React.useState(true)
  const [unreadOnly, setUnreadOnly] = React.useState(false)
  const [q, setQ] = React.useState("")

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await notificationsAPI.list({ unread_only: unreadOnly, limit: 100 })
      setItems(res || [])
    } finally {
      setLoading(false)
    }
  }, [unreadOnly])

  React.useEffect(() => {
    load()
  }, [load])

  const markRead = async (id: number) => {
    await notificationsAPI.read(id)
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)))
  }

  const readAll = async () => {
    await notificationsAPI.readAll()
    setItems((prev) => prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() })))
  }

  if (loading) {
    return (
      <div className="py-8 flex items-center justify-center text-slate-300">
        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Lade…
      </div>
    )
  }

  const total = items.length
  const unreadCount = items.filter((n) => !n.read_at).length
  const qq = q.trim().toLowerCase()
  const filtered = items.filter((n) => {
    if (!qq) return true
    const hay = `${n.title || ""}\n${n.body || ""}\n${n.type || ""}`.toLowerCase()
    return hay.includes(qq)
  })

  return (
    <div className="space-y-3">
      <div className="relative rounded-2xl border border-white/10 bg-slate-950/40 p-4 overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 -mt-4 h-24 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.10),transparent_60%)]" />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center flex-shrink-0">
              <Bell className="h-5 w-5 text-slate-200" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="text-sm font-semibold text-slate-100">Benachrichtigungen</div>
                <span className="text-[10px] px-2 py-0.5 rounded-full border border-white/10 bg-white/5 text-slate-200/90">
                  {unreadCount} ungelesen · {total} total
                </span>
              </div>
              <div className="mt-1 text-[11px] text-slate-400">Updates zu Content, Reminders und Workflow.</div>
            </div>
          </div>

          <div className="sm:ml-auto flex flex-col sm:flex-row gap-2">
            <div className="relative w-full sm:w-[280px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Suchen…"
                className="pl-9"
              />
            </div>

            <div className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 p-1">
              <button
                type="button"
                onClick={() => setUnreadOnly(false)}
                className={[
                  "h-9 px-3 rounded-lg text-xs font-semibold transition",
                  !unreadOnly ? "bg-white/10 text-white shadow" : "text-slate-200/80 hover:bg-white/10",
                ].join(" ")}
              >
                Alle
              </button>
              <button
                type="button"
                onClick={() => setUnreadOnly(true)}
                className={[
                  "h-9 px-3 rounded-lg text-xs font-semibold transition",
                  unreadOnly ? "bg-emerald-500/15 text-emerald-100 shadow border border-emerald-400/20" : "text-slate-200/80 hover:bg-white/10",
                ].join(" ")}
              >
                Ungelesen
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="h-11 border-white/15 bg-white/5 hover:bg-white/10"
              disabled={unreadCount === 0}
              onClick={async () => {
                if (!confirm("Alle Benachrichtigungen als gelesen markieren?")) return
                await readAll()
              }}
              title="Alle als gelesen"
            >
              <CheckCheck className="h-4 w-4 mr-2" /> Read all
            </Button>

            <Button variant="outline" size="sm" className="h-11 border-white/15 bg-white/5 hover:bg-white/10" onClick={load}>
              <RotateCcw className="h-4 w-4 mr-2" /> Refresh
            </Button>
          </div>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-6 text-center">
          <div className="mx-auto h-12 w-12 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center">
            <BellOff className="h-6 w-6 text-slate-300" />
          </div>
          <div className="mt-3 text-sm font-semibold text-slate-100">Keine Benachrichtigungen</div>
          <div className="mt-1 text-xs text-slate-400">
            {q.trim() ? "Keine Treffer für deine Suche." : unreadOnly ? "Du bist up to date – nichts Ungelesenes." : "Noch keine Notifications vorhanden."}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((n) => {
          const unread = !n.read_at
          return (
            <div
              key={n.id}
              className={[
                "relative rounded-2xl border border-white/10 bg-slate-950/60 p-4 overflow-hidden",
                unread ? "ring-1 ring-emerald-400/15" : "",
              ].join(" ")}
            >
              <div className={["pointer-events-none absolute inset-y-0 left-0 w-1", unread ? "bg-emerald-400/60" : "bg-white/10"].join(" ")} />
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {unread && <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_3px_rgba(16,185,129,0.12)]" />}
                    <div className="text-sm font-semibold text-slate-100 truncate">{n.title}</div>
                    <Badge variant="secondary" className="text-[10px] whitespace-nowrap border border-white/10 bg-white/5 text-slate-200">
                      {n.type}
                    </Badge>
                    {unread && (
                      <Badge variant="secondary" className="text-[10px] whitespace-nowrap bg-emerald-500/15 text-emerald-200 border border-emerald-400/20">
                        neu
                      </Badge>
                    )}
                  </div>
                  {n.body && <div className="mt-1 text-xs text-slate-300 whitespace-pre-wrap break-words">{n.body}</div>}
                  <div className="mt-2 text-[11px] text-slate-500 flex flex-wrap gap-2">
                    <span>{String(n.created_at).slice(0, 19).replace("T", " ")}</span>
                    {n.url && (
                      <a
                        href={n.url}
                        className="inline-flex items-center gap-1 text-blue-300 hover:text-blue-200 truncate max-w-[280px]"
                        target="_blank"
                        rel="noreferrer"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> Öffnen
                      </a>
                    )}
                  </div>
                </div>
                {unread && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => markRead(n.id)}
                    className="shrink-0 h-10 border-white/15 bg-white/5 hover:bg-white/10"
                  >
                    <CheckCheck className="h-4 w-4 mr-2" /> Als gelesen
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

