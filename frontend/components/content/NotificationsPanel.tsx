"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { notificationsAPI, type NotificationDTO } from "@/lib/api"
import { Loader2, RotateCcw } from "lucide-react"

export function NotificationsPanel() {
  const [items, setItems] = React.useState<NotificationDTO[]>([])
  const [loading, setLoading] = React.useState(true)
  const [unreadOnly, setUnreadOnly] = React.useState(false)

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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setUnreadOnly((v) => !v)}>
            {unreadOnly ? "Unread" : "All"}
          </Button>
          <Button variant="outline" size="sm" onClick={readAll}>
            Read all
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          <RotateCcw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      {items.length === 0 && <div className="text-xs text-slate-500">— нет уведомлений —</div>}

      <div className="space-y-2">
        {items.map((n) => {
          const unread = !n.read_at
          return (
            <div key={n.id} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold text-slate-100 truncate">{n.title}</div>
                    <Badge variant="secondary" className="text-[10px] whitespace-nowrap">
                      {n.type}
                    </Badge>
                    {unread && (
                      <Badge variant="secondary" className="text-[10px] whitespace-nowrap bg-emerald-500/20 text-emerald-200 border border-emerald-400/20">
                        unread
                      </Badge>
                    )}
                  </div>
                  {n.body && <div className="mt-1 text-xs text-slate-300 whitespace-pre-wrap break-words">{n.body}</div>}
                  <div className="mt-2 text-[11px] text-slate-500 flex flex-wrap gap-2">
                    <span>{String(n.created_at).slice(0, 19).replace("T", " ")}</span>
                    {n.url && (
                      <a href={n.url} className="text-blue-300 hover:text-blue-200 truncate max-w-[280px]">
                        {n.url}
                      </a>
                    )}
                  </div>
                </div>
                {unread && (
                  <Button variant="outline" size="sm" onClick={() => markRead(n.id)} className="shrink-0">
                    Mark read
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

