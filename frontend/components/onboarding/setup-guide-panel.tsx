"use client"

import * as React from "react"
import { CheckCircle2, ChevronLeft, ChevronRight, HelpCircle, Sparkles, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { companiesAPI, projectsAPI } from "@/lib/api"
import useActivitiesApi from "@/hooks/use-activities-api"
import { useCalendarApi } from "@/hooks/use-calendar-api"
import { CategoryPicker } from "@/components/forms/category-picker"
import { DateRangePicker } from "@/components/forms/date-range-picker"
import { sync } from "@/lib/sync"

const GUIDE_KEY = "mk:setup-guide:v1"

type Step = "project" | "activity" | "event" | "done"

const STEPS: Array<{ id: Step; title: string; description: string }> = [
  { id: "project", title: "Projekt", description: "Warum machen wir es?" },
  { id: "activity", title: "Aktivität", description: "Was wird umgesetzt?" },
  { id: "event", title: "Termin", description: "Wann passiert es?" },
]

function today() {
  return new Date().toISOString().slice(0, 10)
}

function inDays(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export default function SetupGuidePanel({ organizationName }: { organizationName?: string | null }) {
  const [open, setOpen] = React.useState(false)
  const [dismissed, setDismissed] = React.useState(false)
  const [step, setStep] = React.useState<Step>("project")
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [companies, setCompanies] = React.useState<any[]>([])
  const { createActivity } = useActivitiesApi()
  const { createEvent } = useCalendarApi()

  const [form, setForm] = React.useState({
    companyId: "",
    companyName: organizationName || "",
    projectTitle: "Erstes Marketingprojekt",
    activityTitle: "Kickoff Aktivität",
    activityCategory: "",
    activityStart: today(),
    activityEnd: inDays(14),
    activityNotes: "",
    eventTitle: "Kickoff Termin",
    eventDate: today(),
    eventTime: "09:00",
    eventLocation: "",
  })

  const [created, setCreated] = React.useState<{ companyId?: number; projectId?: number; activityId?: string }>({})

  React.useEffect(() => {
    try {
      setDismissed(localStorage.getItem(GUIDE_KEY) === "done")
    } catch {}
  }, [])

  React.useEffect(() => {
    if (!open) return
    companiesAPI.getAll().then((items: any) => {
      const list = Array.isArray(items) ? items : []
      setCompanies(list)
      if (!form.companyId && list[0]?.id) {
        setForm((prev) => ({ ...prev, companyId: String(list[0].id), companyName: prev.companyName || list[0].name || "" }))
      }
    }).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const activeIndex = Math.max(0, STEPS.findIndex((item) => item.id === step))

  const markDone = () => {
    try {
      localStorage.setItem(GUIDE_KEY, "done")
    } catch {}
    setDismissed(true)
    setOpen(false)
  }

  const saveProject = async () => {
    setSaving(true)
    setError(null)
    try {
      let companyId = Number(form.companyId)
      if (!companyId) {
        const company = await companiesAPI.create({
          name: form.companyName.trim() || organizationName || "Unknown Company",
          status: "active",
          lead_source: "onboarding_guide",
        }) as any
        companyId = Number(company?.id)
      }
      if (!companyId) throw new Error("Unternehmen konnte nicht erstellt werden")

      const project = await projectsAPI.create({
        title: form.projectTitle.trim(),
        company_id: companyId,
        stage: "qualified",
        value: 0,
        probability: 50,
        owner: "",
        notes: "Created from onboarding guide.",
      }) as any
      const projectId = Number(project?.id)
      if (!projectId) throw new Error("Projekt konnte nicht erstellt werden")

      setCreated((prev) => ({ ...prev, companyId, projectId }))
      sync.emit("crm:deals:changed")
      sync.emit("crm:companies:changed")
      setStep("activity")
    } catch (e: any) {
      setError(e?.message || "Projekt konnte nicht gespeichert werden")
    } finally {
      setSaving(false)
    }
  }

  const saveActivity = async () => {
    setSaving(true)
    setError(null)
    try {
      const activity = await createActivity({
        title: form.activityTitle.trim(),
        category: form.activityCategory,
        status: "PLANNED",
        budgetCHF: 0,
        weight: 50,
        start: `${form.activityStart}T09:00:00`,
        end: form.activityEnd ? `${form.activityEnd}T18:00:00` : undefined,
        notes: form.activityNotes || `Projekt ${form.projectTitle}`,
      } as any)
      if (!activity?.id) throw new Error("Aktivität konnte nicht erstellt werden")
      setCreated((prev) => ({ ...prev, activityId: String(activity.id) }))
      sync.emit("activities:changed")
      setStep("event")
    } catch (e: any) {
      setError(e?.message || "Aktivität konnte nicht gespeichert werden")
    } finally {
      setSaving(false)
    }
  }

  const saveEvent = async () => {
    setSaving(true)
    setError(null)
    try {
      const event = await createEvent({
        title: form.eventTitle.trim(),
        description: `Guide-Termin für ${form.projectTitle}`,
        start: `${form.eventDate}T${form.eventTime || "09:00"}:00`,
        end: `${form.eventDate}T${form.eventTime || "09:00"}:00`,
        type: "event",
        status: "PLANNED",
        category: form.activityCategory,
        location: form.eventLocation.trim() || undefined,
        company_id: created.companyId,
        project_id: created.projectId,
        activity_id: created.activityId ? Number(created.activityId) : undefined,
      } as any)
      if (!event?.id) throw new Error("Termin konnte nicht erstellt werden")
      sync.emit("calendar:changed")
      setStep("done")
      try {
        localStorage.setItem(GUIDE_KEY, "done")
      } catch {}
    } catch (e: any) {
      setError(e?.message || "Termin konnte nicht gespeichert werden")
    } finally {
      setSaving(false)
    }
  }

  const canContinue =
    step === "project"
      ? form.projectTitle.trim().length > 1 && (form.companyId || form.companyName.trim().length > 1)
      : step === "activity"
        ? form.activityTitle.trim().length > 1 && !!form.activityCategory && !!form.activityStart
        : step === "event"
          ? form.eventTitle.trim().length > 1 && !!form.eventDate
          : true

  return (
    <>
      {!dismissed ? (
        <div className="fixed bottom-20 right-4 z-40 w-[min(92vw,360px)] rounded-3xl border border-white/10 bg-slate-950/90 p-4 text-white shadow-2xl shadow-black/30 backdrop-blur-xl md:bottom-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold">Setup Guide</div>
              <p className="mt-1 text-xs leading-relaxed text-slate-300">
                Erstelle einmal sauber: Projekt → Aktivität → Termin. Danach ist die Systemlogik klar.
              </p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" className="h-8 bg-white text-slate-950 hover:bg-white/90" onClick={() => setOpen(true)}>
                  Starten
                </Button>
                <Button size="sm" variant="ghost" className="h-8 text-slate-300 hover:bg-white/10 hover:text-white" onClick={markDone}>
                  Später
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          size="icon"
          className="fixed bottom-20 right-4 z-40 rounded-full bg-slate-950 text-white shadow-2xl hover:bg-slate-800 md:bottom-5"
          onClick={() => {
            setDismissed(false)
            setOpen(true)
          }}
          title="Setup Guide öffnen"
        >
          <HelpCircle className="h-5 w-5" />
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[min(94vw,720px)] sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>
              <span className="flex items-center gap-2">
                <Target className="h-5 w-5 text-violet-500" />
                Project → Activity → Event
              </span>
            </DialogTitle>
            <DialogDescription>
              Der Master legt einen ersten verbundenen Flow an. So sieht man später im CRM und Dashboard dieselben Beziehungen.
            </DialogDescription>
          </DialogHeader>

          {step !== "done" ? (
            <div className="mb-4 grid grid-cols-3 gap-2">
              {STEPS.map((item, index) => (
                <div key={item.id} className={`rounded-2xl border p-3 ${index <= activeIndex ? "border-violet-500/40 bg-violet-500/10" : "border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5"}`}>
                  <div className="text-xs font-semibold">{index + 1}. {item.title}</div>
                  <div className="mt-1 text-[11px] text-muted-foreground">{item.description}</div>
                </div>
              ))}
            </div>
          ) : null}

          {error ? <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-600 dark:text-rose-200">{error}</div> : null}

          {step === "project" ? (
            <div className="grid gap-4">
              <div className="grid gap-1.5">
                <label className="text-sm font-medium">Unternehmen</label>
                {companies.length > 0 ? (
                  <select
                    className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-slate-950"
                    value={form.companyId}
                    onChange={(event) => setForm((prev) => ({ ...prev, companyId: event.target.value }))}
                  >
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>{company.name}</option>
                    ))}
                  </select>
                ) : (
                  <Input value={form.companyName} onChange={(event) => setForm((prev) => ({ ...prev, companyName: event.target.value }))} placeholder="z.B. Kaboom AG" />
                )}
              </div>
              <div className="grid gap-1.5">
                <label className="text-sm font-medium">Projekt-Titel</label>
                <Input value={form.projectTitle} onChange={(event) => setForm((prev) => ({ ...prev, projectTitle: event.target.value }))} />
              </div>
            </div>
          ) : null}

          {step === "activity" ? (
            <div className="grid gap-4">
              <div className="grid gap-1.5">
                <label className="text-sm font-medium">Aktivität</label>
                <Input value={form.activityTitle} onChange={(event) => setForm((prev) => ({ ...prev, activityTitle: event.target.value }))} />
              </div>
              <CategoryPicker id="guide_activity_category" value={form.activityCategory} onChange={(value) => setForm((prev) => ({ ...prev, activityCategory: value }))} required />
              <DateRangePicker start={form.activityStart} end={form.activityEnd} onStartChange={(value) => setForm((prev) => ({ ...prev, activityStart: value }))} onEndChange={(value) => setForm((prev) => ({ ...prev, activityEnd: value }))} />
              <Textarea value={form.activityNotes} onChange={(event) => setForm((prev) => ({ ...prev, activityNotes: event.target.value }))} placeholder="Notizen zur Aktivität" />
            </div>
          ) : null}

          {step === "event" ? (
            <div className="grid gap-4">
              <div className="grid gap-1.5">
                <label className="text-sm font-medium">Termin-Titel</label>
                <Input value={form.eventTitle} onChange={(event) => setForm((prev) => ({ ...prev, eventTitle: event.target.value }))} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input type="date" value={form.eventDate} onChange={(event) => setForm((prev) => ({ ...prev, eventDate: event.target.value }))} />
                <Input type="time" value={form.eventTime} onChange={(event) => setForm((prev) => ({ ...prev, eventTime: event.target.value }))} />
              </div>
              <Input value={form.eventLocation} onChange={(event) => setForm((prev) => ({ ...prev, eventLocation: event.target.value }))} placeholder="Ort / Zoom / Meetingraum" />
            </div>
          ) : null}

          {step === "done" ? (
            <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
              <h3 className="mt-3 text-lg font-semibold">Flow erstellt</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Projekt, Aktivität und Termin sind jetzt verbunden. Dashboard und CRM zeigen diese Beziehungen über den gemeinsamen Daten-Layer.
              </p>
            </div>
          ) : null}

          <DialogFooter>
            {step !== "project" && step !== "done" ? (
              <Button variant="outline" onClick={() => setStep(step === "event" ? "activity" : "project")} disabled={saving}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Zurück
              </Button>
            ) : null}
            {step === "done" ? (
              <Button onClick={markDone}>Fertig</Button>
            ) : (
              <Button disabled={!canContinue || saving} onClick={step === "project" ? saveProject : step === "activity" ? saveActivity : saveEvent}>
                {saving ? "Speichern…" : step === "event" ? "Flow abschließen" : "Weiter"}
                {!saving ? <ChevronRight className="ml-2 h-4 w-4" /> : null}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
