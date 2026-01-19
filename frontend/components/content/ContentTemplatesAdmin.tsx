"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { GlassSelect } from "@/components/ui/glass-select"
import { Badge } from "@/components/ui/badge"
import { contentAutomationAPI, contentTemplatesAPI, contentItemsAPI, type ContentAutomationRuleDTO, type ContentTemplateDTO } from "@/lib/api"
import { Loader2, Plus, RotateCcw, Sparkles, Trash2 } from "lucide-react"

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
    if (!confirm("Template löschen?")) return
    await contentTemplatesAPI.delete(id)
    setTemplates((prev) => prev.filter((t) => t.id !== id))
  }

  const createRule = async () => {
    if (!ruleTemplateId) return
    const created = await contentAutomationAPI.create({ name: `Auto: ${ruleTrigger}`, trigger: ruleTrigger, is_active: true, template_id: Number(ruleTemplateId) })
    setRules((prev) => [created, ...prev])
  }

  const deleteRule = async (id: number) => {
    if (!confirm("Rule löschen?")) return
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
    setMsg(`Generated Content Item #${res.item_id} from Deal #${id}`)
  }

  if (loading) {
    return (
      <div className="py-8 flex items-center justify-center text-slate-300">
        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Lade…
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {msg && <div className="text-xs text-emerald-300">{msg}</div>}

      <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm font-semibold text-slate-100">Templates</div>
          <Button variant="outline" size="sm" onClick={load}>
            <RotateCcw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-2">
            <div className="text-xs text-slate-300">Neues Template</div>
            <Input value={tplName} onChange={(e) => setTplName(e.target.value)} placeholder="Template name" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <div className="text-[11px] text-slate-400">Channel</div>
                <Input value={tplChannel} onChange={(e) => setTplChannel(e.target.value)} placeholder="Website" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Format</div>
                <Input value={tplFormat} onChange={(e) => setTplFormat(e.target.value)} placeholder="Landing Page" />
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Checklist (one per line)</div>
              <textarea value={tplChecklist} onChange={(e) => setTplChecklist(e.target.value)} className="min-h-[90px] w-full rounded-md bg-slate-950/60 border border-slate-700 px-3 py-2 text-xs text-slate-100" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Tasks JSON</div>
              <textarea value={tplTasks} onChange={(e) => setTplTasks(e.target.value)} className="min-h-[130px] w-full rounded-md bg-slate-950/60 border border-slate-700 px-3 py-2 text-[11px] text-slate-100 font-mono" />
            </div>
            <Button onClick={createTemplate} disabled={saving || !tplName.trim()}>
              <Plus className="h-4 w-4 mr-2" /> {saving ? "Speichere…" : "Create"}
            </Button>
          </div>

          <div className="space-y-2">
            <div className="text-xs text-slate-300">Vorhandene Templates</div>
            <div className="space-y-2">
              {templates.length === 0 && <div className="text-xs text-slate-500">— keine —</div>}
              {templates.map((t) => (
                <div key={t.id} className="rounded-xl border border-white/10 bg-white/5 p-3 overflow-hidden">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-100 truncate">{t.name}</div>
                      <div className="mt-1 text-[11px] text-slate-400 truncate">
                        {t.channel || "—"} · {t.format || "—"}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {Array.isArray(t.checklist) && t.checklist.slice(0, 3).map((c, i) => (
                          <Badge key={i} variant="secondary" className="text-[10px]">
                            {c}
                          </Badge>
                        ))}
                        {Array.isArray(t.tasks) && t.tasks.length > 0 && (
                          <Badge variant="secondary" className="text-[10px]">
                            {t.tasks.length} tasks
                          </Badge>
                        )}
                      </div>
                    </div>
                    <button type="button" className="text-slate-400 hover:text-red-300" onClick={() => deleteTemplate(t.id)} title="delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm font-semibold text-slate-100">Automation</div>
          <Button variant="outline" size="sm" onClick={runReminders}>
            <Sparkles className="h-4 w-4 mr-2" /> Run reminders (24h)
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-2">
            <div className="text-xs text-slate-300">Neue Rule</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <div className="text-[11px] text-slate-400">Trigger</div>
                <Input value={ruleTrigger} onChange={(e) => setRuleTrigger(e.target.value)} placeholder="deal_won" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Template</div>
                <GlassSelect
                  value={ruleTemplateId}
                  onChange={setRuleTemplateId}
                  placeholder="Select"
                  options={[{ value: "", label: "Select" }, ...templates.map((t) => ({ value: String(t.id), label: `${t.name} (#${t.id})` }))]}
                />
              </div>
            </div>
            <Button variant="outline" onClick={createRule} disabled={!ruleTemplateId}>
              <Plus className="h-4 w-4 mr-2" /> Create rule
            </Button>

            <div className="mt-3 border-t border-white/10 pt-3 space-y-2">
              <div className="text-xs text-slate-300">Manual: generate from Deal</div>
              <div className="flex items-center gap-2">
                <Input value={dealId} onChange={(e) => setDealId(e.target.value)} placeholder="Deal ID" className="max-w-[140px]" />
                <Button variant="outline" onClick={generateFromDeal} disabled={!dealId.trim()}>
                  Generate
                </Button>
              </div>
              <div className="text-[11px] text-slate-400">Создаёт Content Item и применяет выбранный template.</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs text-slate-300">Rules</div>
            {rules.length === 0 && <div className="text-xs text-slate-500">— нет правил —</div>}
            <div className="space-y-2">
              {rules.map((r) => (
                <div key={r.id} className="rounded-xl border border-white/10 bg-white/5 p-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-100 truncate">{r.name}</div>
                    <div className="mt-1 text-[11px] text-slate-400 truncate">
                      trigger: {r.trigger} · template: {r.template_id ?? "—"} · {r.is_active ? "active" : "off"}
                    </div>
                  </div>
                  <button type="button" className="text-slate-400 hover:text-red-300" onClick={() => deleteRule(r.id)} title="delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

