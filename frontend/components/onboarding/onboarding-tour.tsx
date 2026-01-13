"use client"

import React from "react"
import { usePathname } from "next/navigation"
import Joyride, { CallBackProps, EVENTS, STATUS, Step, TooltipRenderProps } from "react-joyride"
import { sync } from "@/lib/sync"

const ONBOARDING_VERSION = "3"

type TourKey =
  | "welcome"
  | "dashboard"
  | "crm"
  | "calendar"
  | "activities"
  | "performance"
  | "budget"
  | "content"
  | "reports"
  | "uploads"

function normalizeTourKey(pathname: string | null): TourKey {
  const p = pathname || "/"
  if (p.startsWith("/crm")) return "crm"
  if (p.startsWith("/calendar")) return "calendar"
  if (p.startsWith("/activities")) return "activities"
  if (p.startsWith("/performance")) return "performance"
  if (p.startsWith("/budget")) return "budget"
  if (p.startsWith("/content")) return "content"
  if (p.startsWith("/reports")) return "reports"
  if (p.startsWith("/uploads")) return "uploads"
  if (p.startsWith("/dashboard")) return "dashboard"
  return "dashboard"
}

function seenKey(key: TourKey) {
  return `mkOnboardingSeen:${ONBOARDING_VERSION}:${key}`
}

function safeSteps(steps: Step[]) {
  // Keep "body" steps always; for others ensure selector exists to avoid “stuck” experiences.
  return steps.filter((s) => {
    const t = String((s as any).target || "")
    if (!t || t === "body") return true
    try {
      return !!document.querySelector(t)
    } catch {
      return true
    }
  })
}

function buildTours(): Record<TourKey, Step[]> {
  const commonNav: Step[] = [
    {
      target: '[data-tour="sidebar"]',
      title: "Navigation",
      content: "Über die Seitenleiste wechselst du zwischen den Modulen. Auf dem Handy öffnest du sie über das Menü.",
      placement: "right",
      disableBeacon: true,
    },
    {
      target: '[data-tour="menu-button"]',
      title: "Mobiles Menü",
      content: "Auf kleinen Bildschirmen öffnest du hier die Navigation.",
      placement: "bottom",
    },
    {
      target: '[data-tour="theme-toggle"]',
      title: "Theme",
      content: "Wechsle zwischen Auto, Hell und Dunkel. Auto folgt deinem System.",
      placement: "left",
    },
    {
      target: '[data-tour="notifications"]',
      title: "Benachrichtigungen",
      content: "Hier findest du Hinweise & Updates. (In dieser Version noch minimal.)",
      placement: "bottom",
    },
    {
      target: '[data-tour="user-menu"]',
      title: "Account",
      content: "Profil, Einstellungen und Hilfe. Hier kannst du den Rundgang jederzeit neu starten.",
      placement: "bottom",
    },
  ]

  return {
    welcome: [
      {
        target: "body",
        placement: "center",
        title: "Willkommen bei MarketingKreis",
        content:
          "Wir zeigen dir jetzt die wichtigsten Bereiche. Tipp: Du kannst den Rundgang jederzeit neu starten – ohne dass irgendetwas kaputt geht.",
        disableBeacon: true,
      },
      ...commonNav,
    ],
    dashboard: [
      {
        target: "body",
        placement: "center",
        title: "Dashboard",
        content:
          "Das Dashboard gibt dir einen schnellen Überblick. Wir markieren dir gleich die wichtigsten Stellen.",
        disableBeacon: true,
      },
      {
        target: "#tour-kpis",
        title: "KPIs auf einen Blick",
        content: "Hier siehst du die wichtigsten Kennzahlen, damit du sofort den Status erkennst.",
        placement: "top",
      },
      {
        target: "#tour-modules",
        title: "Schneller Einstieg",
        content: "Die Karten bringen dich direkt zu CRM, Aktivitäten, Kalender, Uploads und Reports.",
        placement: "top",
      },
      ...commonNav,
    ],
    crm: [
      {
        target: "body",
        placement: "center",
        title: "CRM",
        content: "Unternehmen, Kontakte und Deals – alles an einem Ort. Wir zeigen dir die wichtigsten Bereiche.",
        disableBeacon: true,
      },
      { target: '[data-tour="crm-tabs"]', title: "Tabs", content: "Wechsle zwischen Companies, Contacts und Deals.", placement: "bottom" },
      { target: '[data-tour="crm-search"]', title: "Suche", content: "Suche schnell nach Namen, E‑Mails oder IDs.", placement: "bottom" },
      { target: '[data-tour="crm-table"]', title: "Listen", content: "Hier verwaltest du Datensätze. Klicke Zeilen für Details.", placement: "top" },
      ...commonNav,
    ],
    calendar: [
      {
        target: "body",
        placement: "center",
        title: "Kalender",
        content: "Plane Kampagnen und Aktivitäten. Hier bekommst du Überblick und kannst Einträge bearbeiten.",
        disableBeacon: true,
      },
      { target: '[data-tour="calendar-toolbar"]', title: "Steuerung", content: "Wechsle Ansicht/Zeitraum und aktualisiere Daten.", placement: "bottom" },
      { target: '[data-tour="calendar-grid"]', title: "Kalenderansicht", content: "Klicke auf einen Tag oder Eintrag für Details.", placement: "top" },
      ...commonNav,
    ],
    activities: [
      {
        target: "body",
        placement: "center",
        title: "Aktivitäten",
        content: "Erstelle und verfolge Aktivitäten. Import aus Uploads landet ebenfalls hier.",
        disableBeacon: true,
      },
      { target: '[data-tour="activities-actions"]', title: "Aktionen", content: "Neue Aktivität anlegen, filtern und aktualisieren.", placement: "bottom" },
      { target: '[data-tour="activities-list"]', title: "Liste", content: "Hier siehst du alle Aktivitäten – mit Status und Terminen.", placement: "top" },
      ...commonNav,
    ],
    performance: [
      { target: "body", placement: "center", title: "Performance", content: "Analysen und Trends. Ideal für wöchentliche Reviews.", disableBeacon: true },
      { target: '[data-tour="performance-filters"]', title: "Zeitraum", content: "Passe Zeitraum/Filter an für bessere Vergleiche.", placement: "bottom" },
      { target: '[data-tour="performance-charts"]', title: "Charts", content: "Hier siehst du die wichtigsten Entwicklungen.", placement: "top" },
      ...commonNav,
    ],
    budget: [
      { target: "body", placement: "center", title: "Budget & KPIs", content: "Budget planen, Szenarien vergleichen, KPIs beobachten.", disableBeacon: true },
      { target: '[data-tour="budget-scenarios"]', title: "Szenarien", content: "Erstelle Szenarien und vergleiche Budgets.", placement: "top" },
      { target: '[data-tour="budget-kpis"]', title: "KPIs", content: "KPIs pro Zeitraum/Channel – übersichtlich zusammengefasst.", placement: "top" },
      ...commonNav,
    ],
    content: [
      { target: "body", placement: "center", title: "Content Hub", content: "Plane Content, verwalte Aufgaben und behalte Deadlines im Blick.", disableBeacon: true },
      { target: '[data-tour="content-board"]', title: "Board", content: "Ziehe Karten per Drag & Drop zwischen Spalten.", placement: "top" },
      { target: '[data-tour="content-calendar"]', title: "Kalender", content: "Content‑Termine in einer Kalenderansicht.", placement: "top" },
      ...commonNav,
    ],
    reports: [
      { target: "body", placement: "center", title: "Reports", content: "Erstelle Berichte und exportiere Ergebnisse.", disableBeacon: true },
      { target: '[data-tour="reports-actions"]', title: "Report erstellen", content: "Wähle Report‑Typ und generiere/exportiere.", placement: "bottom" },
      { target: '[data-tour="reports-list"]', title: "Historie", content: "Hier findest du zuletzt generierte Reports.", placement: "top" },
      ...commonNav,
    ],
    uploads: [
      { target: "body", placement: "center", title: "Uploads", content: "Hier lädst du Dateien hoch und startest Imports (CSV/XLSX).", disableBeacon: true },
      { target: '[data-tour="uploads-dropzone"]', title: "Dropzone", content: "Ziehe Dateien hierher oder wähle sie aus.", placement: "top" },
      { target: '[data-tour="uploads-mapping"]', title: "Mapping", content: "Ordne Spalten den Feldern zu (title ist Pflicht).", placement: "top" },
      { target: '[data-tour="uploads-list"]', title: "Dateiliste", content: "Suche Dateien und öffne Details.", placement: "top" },
      { target: '[data-tour="jobs-list"]', title: "Import Jobs", content: "Hier siehst du Status und Ergebnisse der Verarbeitung.", placement: "top" },
      ...commonNav,
    ],
  }
}

const FancyTooltip: React.FC<TooltipRenderProps> = ({
  index,
  size,
  step,
  backProps,
  closeProps,
  primaryProps,
  skipProps,
}) => {
  const current = (index ?? 0) + 1
  const isLast = current === size

  return (
    <div className="relative max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/95 text-slate-50 shadow-2xl shadow-rose-500/25 backdrop-blur-xl">
      <div className="pointer-events-none absolute -top-24 -right-24 h-40 w-40 rounded-full bg-rose-500/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-44 w-44 rounded-full bg-sky-500/35 blur-3xl" />
      <div className="relative space-y-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400">
              Schritt {current} von {size}
            </p>
            <h3 className="mt-1 text-lg font-semibold text-slate-50">{step.title}</h3>
          </div>
          <button
            {...closeProps}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-900/80 text-slate-400 ring-1 ring-slate-700 transition hover:bg-slate-800 hover:text-slate-100"
          >
            <span className="sr-only">Schließen</span>
            ×
          </button>
        </div>

        <p className="text-sm leading-relaxed text-slate-200">{step.content}</p>

        <div className="mt-2 flex items-center justify-between gap-3">
          <button
            {...skipProps}
            className="text-xs font-medium text-slate-400 underline-offset-2 hover:text-slate-100 hover:underline"
          >
            Überspringen
          </button>
          <div className="flex items-center gap-2">
            {current > 1 && (
              <button
                {...backProps}
                className="rounded-full border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-100 transition hover:bg-slate-900"
              >
                Zurück
              </button>
            )}
            <button
              {...primaryProps}
              className="rounded-full bg-gradient-to-r from-rose-500 via-red-500 to-orange-400 px-4 py-1.5 text-xs font-semibold text-white shadow-lg shadow-rose-500/40 transition hover:brightness-110"
            >
              {isLast ? "Fertig" : "Weiter"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function OnboardingTour() {
  const pathname = usePathname()
  const [run, setRun] = React.useState(false)
  const [steps, setSteps] = React.useState<Step[]>([])
  const [stepIndex, setStepIndex] = React.useState(0)
  const [activeKey, setActiveKey] = React.useState<TourKey>("dashboard")
  const tours = React.useMemo(() => buildTours(), [])
  const currentKey = React.useMemo(() => normalizeTourKey(pathname), [pathname])

  const startTour = React.useCallback(
    (key: TourKey) => {
      try {
        const raw = tours[key] || []
        const s = safeSteps(raw)
        if (s.length === 0) return
        setActiveKey(key)
        setSteps(s)
        setStepIndex(0)
        setRun(true)
      } catch {}
    },
    [tours],
  )

  React.useEffect(() => {
    // 1) Global welcome once
    try {
      const welcomeDone = localStorage.getItem(seenKey("welcome")) === "1"
      if (!welcomeDone && (currentKey === "dashboard" || pathname === "/dashboard")) {
        setTimeout(() => startTour("welcome"), 450)
        return
      }
    } catch {}

    // 2) Per-page tour once
    try {
      const done = localStorage.getItem(seenKey(currentKey)) === "1"
      if (!done) {
        setTimeout(() => startTour(currentKey), 450)
      }
    } catch {}
  }, [currentKey, pathname, startTour])

  React.useEffect(() => {
    // Allow manual restart (from anywhere)
    const unsub = sync.on("onboarding:restart", (payload) => {
      const key = (payload?.key as TourKey | undefined) || currentKey
      try {
        localStorage.removeItem(seenKey(key))
      } catch {}
      startTour(key)
    })
    return () => {
      try {
        unsub?.()
      } catch {}
    }
  }, [currentKey, startTour])

  const handleJoyrideCallback = React.useCallback((data: CallBackProps) => {
    const { status, type, index } = data
    const finished = status === STATUS.FINISHED || status === STATUS.SKIPPED
    if (type === EVENTS.TARGET_NOT_FOUND) {
      // Skip missing targets safely (prevents “stuck”).
      const next = (index ?? stepIndex) + 1
      setStepIndex(next)
      return
    }
    if (finished) {
      try {
        localStorage.setItem(seenKey(activeKey), "1")
      } catch {}
      setRun(false)
    }
  }, [activeKey, stepIndex])

  if (!run) return null

  return (
    <Joyride
      steps={steps}
      run={run}
      stepIndex={stepIndex}
      callback={(data) => {
        // Keep internal index in sync
        if (typeof data.index === "number") setStepIndex(data.index)
        handleJoyrideCallback(data)
      }}
      continuous
      showSkipButton
      showProgress
      disableScrolling={false}
      scrollToFirstStep={true}
      spotlightClicks={false}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: "#ef4444", // kaboom red
          textColor: "var(--mk-joyride-text, #0f172a)",
          backgroundColor: "transparent",
        },
        tooltipContainer: {
          textAlign: "left",
        },
        spotlight: {
          borderRadius: 18,
        },
      }}
      locale={{
        back: "Zurück",
        close: "Schließen",
        last: "Fertig",
        next: "Weiter",
        skip: "Überspringen",
      }}
      tooltipComponent={FancyTooltip}
    />
  )
}