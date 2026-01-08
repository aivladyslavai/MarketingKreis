"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { companiesAPI, contactsAPI, dealsAPI } from "@/lib/api"

interface Item {
  id: string
  title: string
  type: "company" | "contact" | "deal" | "event" | "page"
  href?: string
  subtitle?: string
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState("")
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<Item[]>([])
  const router = useRouter()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  useEffect(() => {
    if (!open) return
    let cancel = false
    const load = async () => {
      setLoading(true)
      try {
        const [companies, contacts, deals] = await Promise.all([
          companiesAPI.getAll().catch(() => []),
          contactsAPI.getAll().catch(() => []),
          dealsAPI.getAll().catch(() => []),
        ])
        if (cancel) return
        const base: Item[] = [
          { id: "p:/dashboard", title: "Go to Dashboard", type: "page", href: "/dashboard" },
          { id: "p:/crm", title: "Open CRM", type: "page", href: "/crm" },
          { id: "p:/calendar", title: "Open Calendar", type: "page", href: "/calendar" },
          { id: "p:/reports", title: "Open Reports", type: "page", href: "/reports" },
        ]
        const map = (arr: any[], type: Item["type"], getTitle: (x: any) => string, href: string) =>
          arr.slice(0, 200).map((x: any) => ({ id: `${type}:${x.id}`, title: getTitle(x), type, href, subtitle: type.toUpperCase() }))
        const all = [
          ...base,
          ...map(companies, "company", (x) => x.name || x.title, "/crm?tab=companies"),
          ...map(contacts, "contact", (x) => x.name || x.email, "/crm?tab=contacts"),
          ...map(deals, "deal", (x) => x.title || "Deal", "/crm?tab=deals"),
        ]
        setItems(all)
      } finally {
        if (!cancel) setLoading(false)
      }
    }
    load()
    return () => { cancel = true }
  }, [open])

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase()
    if (!qq) return items.slice(0, 20)
    return items.filter(i => i.title.toLowerCase().includes(qq)).slice(0, 20)
  }, [q, items])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative z-10 mx-auto mt-24 w-[min(720px,92vw)] rounded-2xl border border-white/15 bg-white/80 dark:bg-slate-900/80 shadow-2xl">
        <div className="p-3 border-b border-white/10">
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Suche… (Cmd/Ctrl+K)"
            className="w-full h-10 rounded-md bg-white/70 dark:bg-slate-900/60 border border-white/20 dark:border-slate-700 px-3 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
          />
        </div>
        <div className="max-h-[360px] overflow-y-auto p-2">
          {loading && <div className="p-4 text-sm text-slate-500">Laden…</div>}
          {!loading && filtered.length === 0 && <div className="p-4 text-sm text-slate-500">Nichts gefunden</div>}
          {filtered.map((it) => (
            <button
              key={it.id}
              onClick={() => { setOpen(false); if (it.href) router.push(it.href) }}
              className="w-full text-left p-2 rounded-md hover:bg-white/40 dark:hover:bg-white/10 border border-transparent hover:border-white/10"
            >
              <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{it.title}</div>
              {it.subtitle && <div className="text-xs text-slate-500 dark:text-slate-400">{it.subtitle}</div>}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}



