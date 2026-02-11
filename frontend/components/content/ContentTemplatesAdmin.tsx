"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { GlassSelect } from "@/components/ui/glass-select"
import { Badge } from "@/components/ui/badge"
import { contentAutomationAPI, contentTemplatesAPI, contentItemsAPI, type ContentAutomationRuleDTO, type ContentTemplateDTO } from "@/lib/api"
import { Loader2, Plus, RotateCcw, Sparkles, Trash2, FileText, Wand2, ShieldAlert } from "lucide-react"

export function ContentTemplatesAdmin() {
  const [templates, setTemplates] = React.useState<ContentTemplateDTO[]>([])
  const [rules, setRules] = React.useState<ContentAutomationRuleDTO[]>([])
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [msg, setMsg] = React.useState<string | null>(null)

  const [tplName, setTplName] = React.useState("")
  const [tplChannel, setTplChannel] = React.useState("Website")
  const [tplFormat, setTplFormat] = React.useState("Landing Page")
  const [tplChecklist, setTplChecklist] = React.useState("Brief finalisieren\nCopy schreiben\nDesign prüfen\nQA (CTA/Links)\nFreigabe")
  const [tplTasks, setTplTasks] = React.useState(
    JSON.stringify(
      [
        { title: "Kickoff & Brief", status: "TODO", priority: "MEDIUM", offset_days: 0 },
        { title: "Copy Draft", status: "TODO", priority: "HIGH", offset_days: 2 },
        { title: "Design Review", status: "TODO", priority: "MEDIUM", offset_days: 4 },
        { title: "Final QA + Publish", status: "TODO", priority: "HIGH", offset_days: 6 },
      ],
      null,
      2,
    ),
  )

  const [ruleTrigger, setRuleTrigger] = React.useState("deal_won")
  const [ruleTemplateId, setRuleTemplateId] = React.useState<string>("")
  const [dealId, setDealId] = React.useState<string>("")

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const [t, r] = await Promise.all([contentTemplatesAPI.list().catch(() => []), contentAutomationAPI.list().catch(() => [])])
      setTemplates(t || [])
      setRules(r || [])
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  const createTemplate = async () => {
    const name = tplName.trim()
    if (!name) return
    setSaving(true)
    setMsg(null)
    try {
      let tasks: any[] | null = null
      try {
        const parsed = JSON.parse(tplTasks)
        tasks = Array.isArray(parsed) ? parsed : null
      } catch {
        tasks = null
      }
      const checklist = tplChecklist
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
      const created = await contentTemplatesAPI.create({
        name,
        channel: tplChannel,
        format: tplFormat,
        checklist,
        tasks,
      })
      setTemplates((prev) => [created, ...prev])
      setTplName("")
      setMsg("Template erstellt.")
    } finally {
      setSaving(false)
    }
  }

  const deleteTemplate = async (id: number) => {
    if (!confirm("Template wirklich löschen?")) return
    await contentTemplatesAPI.delete(id)
    setTemplates((prev) => prev.filter((t) => t.id !== id))
  }

  const createRule = async () => {
    if (!ruleTemplateId) return
    const created = await contentAutomationAPI.create({ name: `Auto: ${ruleTrigger}`, trigger: ruleTrigger, is_active: true, template_id: Number(ruleTemplateId) })
    setRules((prev) => [created, ...prev])
  }

  const deleteRule = async (id: number) => {
    if (!confirm("Regel wirklich löschen?")) return
    await contentAutomationAPI.delete(id)
    setRules((prev) => prev.filter((r) => r.id !== id))
  }

  const runReminders = async () => {
    setMsg(null)
    const res = await contentAutomationAPI.runReminders()
    setMsg(`Reminders: +${res.created}`)
  }

  const generateFromDeal = async () => {
    const id = Number(dealId)
    if (!Number.isFinite(id) || id <= 0) return
    setMsg(null)
    const res = await contentItemsAPI.generateFromDeal(id, ruleTemplateId ? Number(ruleTemplateId) : undefined)
    setMsg(`Content Item #${res.item_id} aus Deal #${id} generiert.`)
  }

  if (loading) {
    return (
      <div className="py-8 flex items-center justify-center text-slate-300">
        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Lade…
      </div>
    )
  }

  const inputCls =
    "h-11 w-full rounded-xl bg-slate-900/70 border border-white/15 px-3 text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
  const textareaCls =
    "w-full rounded-xl bg-slate-900/60 border border-white/15 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"

  return (
    <div className="space-y-5">
      {msg && (
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-[11px] text-emerald-100">
          {msg}
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center">
              <FileText className="h-4 w-4 text-slate-100" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-100">Templates</div>
              <div className="text-[11px] text-slate-400">Checklists & Tasks automatisch pro Content-Typ</div>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={load} className="h-9 text-xs border-white/15 text-slate-200 hover:bg-white/10">
            <RotateCcw className="h-3.5 w-3.5 mr-2" /> Neu laden
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-200">Neues Template</div>
            <Input value={tplName} onChange={(e) => setTplName(e.target.value)} placeholder="Name (z.B. Blogpost – Website)" className={inputCls} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <div className="text-[11px] text-slate-400">Channel</div>
                <Input value={tplChannel} onChange={(e) => setTplChannel(e.target.value)} placeholder="Website" className={inputCls} />
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Format</div>
                <Input value={tplFormat} onChange={(e) => setTplFormat(e.target.value)} placeholder="Landing Page" className={inputCls} />
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Checklist (1 pro Zeile)</div>
              <textarea
                value={tplChecklist}
                onChange={(e) => setTplChecklist(e.target.value)}
                className={textareaCls + " min-h-[110px]"}
              />
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Tasks JSON (optional)</div>
              <textarea
                value={tplTasks}
                onChange={(e) => setTplTasks(e.target.value)}
                className={textareaCls + " min-h-[150px] font-mono text-[11px]"}
              />
              <div className="mt-1 text-[11px] text-slate-500">
                Tipp: Lege Tasks mit <span className="font-mono">offset_days</span> an, damit Deadlines automatisch relativ berechnet werden.
              </div>
            </div>
            <Button onClick={createTemplate} disabled={saving || !tplName.trim()} className="h-11 bg-white text-slate-900 hover:bg-white/90">
              <Plus className="h-4 w-4 mr-2" /> {saving ? "Speichere…" : "Template erstellen"}
            </Button>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-200">Vorhandene Templates</div>
            <div className="space-y-2">
              {templates.length === 0 && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-slate-400">
                  Noch keine Templates. Erstelle links dein erstes Template.
                </div>
              )}
              {templates.map((t) => (
                <div key={t.id} className="rounded-xl border border-white/10 bg-white/5 p-3 overflow-hidden">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-100 truncate">{t.name}</div>
                      <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                        <span className="rounded-full border border-white/10 bg-slate-950/30 px-2 py-0.5 text-slate-200">{t.channel || "—"}</span>
                        <span className="rounded-full border border-white/10 bg-slate-950/30 px-2 py-0.5 text-slate-200">{t.format || "—"}</span>
                        <span className="rounded-full border border-white/10 bg-slate-950/30 px-2 py-0.5 text-slate-300">#{t.id}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {Array.isArray(t.checklist) && t.checklist.slice(0, 3).map((c, i) => (
                          <Badge key={i} variant="secondary" className="text-[10px] border border-white/10 bg-slate-950/30 text-slate-200">
                            {c}
                          </Badge>
                        ))}
                        {Array.isArray(t.tasks) && t.tasks.length > 0 && (
                          <Badge variant="secondary" className="text-[10px] border border-white/10 bg-slate-950/30 text-slate-200">
                            {t.tasks.length} Tasks
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 w-9 p-0 border-red-500/30 text-red-200 hover:bg-red-500/10"
                      onClick={() => deleteTemplate(t.id)}
                      title="Löschen"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center">
              <Wand2 className="h-4 w-4 text-slate-100" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-100">Automation</div>
              <div className="text-[11px] text-slate-400">Regeln & Reminder für echten Workflow</div>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={runReminders} className="h-9 text-xs border-white/15 text-slate-200 hover:bg-white/10">
            <Sparkles className="h-3.5 w-3.5 mr-2" /> Reminders (24h)
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-200">Neue Regel</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <div className="text-[11px] text-slate-400">Trigger</div>
                <Input value={ruleTrigger} onChange={(e) => setRuleTrigger(e.target.value)} placeholder="deal_won" className={inputCls} />
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Template</div>
                <GlassSelect
                  value={ruleTemplateId}
                  onChange={setRuleTemplateId}
                  placeholder="Auswählen"
                  options={[{ value: "", label: "Auswählen" }, ...templates.map((t) => ({ value: String(t.id), label: `${t.name} (#${t.id})` }))]}
                />
              </div>
            </div>
            <Button variant="outline" onClick={createRule} disabled={!ruleTemplateId} className="h-11 border-white/15 text-slate-200 hover:bg-white/10">
              <Plus className="h-4 w-4 mr-2" /> Regel erstellen
            </Button>

            <div className="mt-3 border-t border-white/10 pt-3 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <ShieldAlert className="h-4 w-4 text-amber-200" /> Manuell: aus Deal generieren
              </div>
              <div className="flex items-center gap-2">
                <Input value={dealId} onChange={(e) => setDealId(e.target.value)} placeholder="Deal ID" className={inputCls + " max-w-[160px]"} />
                <Button variant="outline" onClick={generateFromDeal} disabled={!dealId.trim()} className="h-11 border-white/15 text-slate-200 hover:bg-white/10">
                  Generieren
                </Button>
              </div>
              <div className="text-[11px] text-slate-400">
                Erstellt ein Content Item und wendet das ausgewählte Template an (falls gesetzt).
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-200">Regeln</div>
            {rules.length === 0 && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-slate-400">
                Noch keine Regeln. Erstelle links eine Regel.
              </div>
            )}
            <div className="space-y-2">
              {rules.map((r) => (
                <div key={r.id} className="rounded-xl border border-white/10 bg-white/5 p-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-100 truncate">{r.name}</div>
                    <div className="mt-1 text-[11px] text-slate-400 truncate">
                      trigger: <span className="text-slate-200">{r.trigger}</span> · template:{" "}
                      <span className="text-slate-200">{r.template_id ?? "—"}</span> ·{" "}
                      <span className={r.is_active ? "text-emerald-200" : "text-slate-300"}>{r.is_active ? "active" : "off"}</span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 w-9 p-0 border-red-500/30 text-red-200 hover:bg-red-500/10"
                    onClick={() => deleteRule(r.id)}
                    title="Löschen"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

