"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { useUserCategories } from "@/hooks/use-user-categories"
import { Palette, Plus, Save, Trash2 } from "lucide-react"

export type UserCategory = { name: string; color: string }

export default function CategorySetup({ onReady }: { onReady?: (cats: UserCategory[]) => void }) {
  const { categories, save } = useUserCategories()
  const [items, setItems] = React.useState<UserCategory[]>([{ name: "", color: "#3b82f6" }])

  React.useEffect(() => {
    if (categories && categories.length > 0) {
      setItems(categories)
    }
  }, [categories, onReady])

  const add = () => {
    if (items.length >= 5) return
    setItems((prev) => [...prev, { name: "", color: "#8b5cf6" }])
  }

  const update = (idx: number, patch: Partial<UserCategory>) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)))
  }

  const remove = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }

  const onSave = () => {
    const cleaned = items.map((i) => ({ name: i.name.trim() || "Kategorie", color: i.color }))
    save(cleaned)
    onReady?.(cleaned)
  }

  return (
    <div className="space-y-3">
      {/* Header – responsive layout */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
        <div className="space-y-1 flex-1">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <Palette className="h-3.5 w-3.5 text-violet-300" />
            <span>Kategorien einrichten</span>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-400 leading-snug">
            Definieren Sie bis zu fünf individuelle Kategorien. Die Farben erscheinen im Marketing‑Kreis,
            in Badges und Auswertungen.
          </p>
        </div>
        <div className="shrink-0 self-start">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/35 bg-violet-500/10 px-2.5 sm:px-3 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-medium text-violet-100">
            ✦ Empfohlen
          </div>
        </div>
      </div>

      {/* Categories list */}
      <div className="space-y-2 sm:space-y-3">
        {items.map((it, idx) => (
          <div
            key={idx}
            className="group flex items-center gap-2 sm:gap-3 rounded-xl border border-white/10 bg-slate-900/70 p-2.5 sm:p-3.5 shadow-inner shadow-black/20 backdrop-blur hover:border-violet-500/30 hover:bg-slate-900/80 transition-all"
          >
            <button
              type="button"
              className="relative h-9 w-9 sm:h-11 sm:w-11 shrink-0 rounded-lg sm:rounded-xl border-2 border-white/20 overflow-hidden bg-white/5 hover:border-white/40 transition-colors"
              style={{ backgroundColor: it.color }}
              onClick={() => {
                const input = document.getElementById(`color-${idx}`) as HTMLInputElement | null
                input?.click()
              }}
            >
              <input
                id={`color-${idx}`}
                type="color"
                value={it.color}
                onChange={(e) => update(idx, { color: e.target.value })}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </button>

            <div className="flex-1 min-w-0">
              <input
                placeholder={`Kategorie ${idx + 1}`}
                value={it.name}
                onChange={(e) => update(idx, { name: e.target.value })}
                className="w-full h-9 sm:h-11 rounded-lg border border-white/10 bg-slate-950/60 px-2.5 sm:px-3.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 transition-all"
              />
              <p className="hidden sm:block text-[11px] text-slate-500 mt-1">
                Diese Kategorie wird im Kreis und in Listen angezeigt.
              </p>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => remove(idx)}
              disabled={items.length <= 1}
              className="h-8 w-8 sm:h-10 sm:w-10 shrink-0 text-slate-500 hover:text-red-300 hover:bg-red-500/10 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500"
            >
              <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between gap-2 sm:gap-3 pt-1">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={add}
            disabled={items.length >= 5}
            className="h-8 sm:h-10 gap-1 sm:gap-1.5 rounded-lg border-dashed border-slate-600 bg-transparent text-slate-200 hover:border-violet-500/60 hover:bg-violet-500/10 hover:text-violet-100 disabled:opacity-40 text-xs sm:text-sm px-2 sm:px-3"
          >
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Kategorie</span>
          </Button>
          <span className="text-[10px] sm:text-xs text-slate-500">{items.length}/5</span>
        </div>

        <Button
          onClick={onSave}
          size="sm"
          className="h-8 sm:h-10 gap-1.5 sm:gap-2 rounded-lg bg-gradient-to-r from-violet-600 via-fuchsia-500 to-sky-500 px-3 sm:px-4 text-xs sm:text-sm text-white shadow-lg shadow-violet-500/25 hover:from-violet-500 hover:via-fuchsia-400 hover:to-sky-400 hover:shadow-violet-500/35"
        >
          <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          Speichern
        </Button>
      </div>
    </div>
  )
}
