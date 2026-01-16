"use client"

import React from "react"
import { usePathname } from "next/navigation"
import Joyride, { ACTIONS, CallBackProps, EVENTS, STATUS, Step, TooltipRenderProps } from "react-joyride"
import { sync } from "@/lib/sync"
import {
  Sparkles,
  Rocket,
  Target,
  Calendar,
  BarChart3,
  Upload,
  FileText,
  Users,
  Zap,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  X,
  Lightbulb,
  Keyboard,
  MousePointer,
} from "lucide-react"

const ONBOARDING_VERSION = "4"

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

interface EnhancedStep extends Step {
  icon?: React.ReactNode
  tip?: string
  emoji?: string
  shortcut?: string
}

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

function safeSteps(steps: EnhancedStep[]) {
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

function buildTours(): Record<TourKey, EnhancedStep[]> {
  return {
    welcome: [
      {
        target: "body",
        placement: "center",
        title: "Willkommen bei MarketingKreis! 🎉",
        content:
          "In 2 Minuten zeigen wir dir die wichtigsten Features. Du kannst den Rundgang jederzeit neu starten.",
        disableBeacon: true,
        icon: <Sparkles className="h-6 w-6" />,
        emoji: "👋",
        tip: "Tipp: Drücke ESC um den Rundgang zu schließen",
      },
      {
        target: '[data-tour="sidebar"]',
        title: "Deine Kommandozentrale",
        content:
          "Von hier aus erreichst du alle Module: CRM für Kundenmanagement, Kalender für Termine, Activities für Kampagnen-Tracking und vieles mehr.",
        placement: "right",
        icon: <Rocket className="h-5 w-5" />,
        emoji: "🧭",
        tip: "Auf dem Desktop ist die Sidebar immer sichtbar",
      },
      {
        target: '[data-tour="user-menu"]',
        title: "Dein Account-Bereich",
        content:
          "Hier findest du deine Einstellungen, kannst dich abmelden und – wichtig – den Rundgang jederzeit neu starten.",
        placement: "bottom",
        icon: <Users className="h-5 w-5" />,
        emoji: "👤",
        tip: "Hier kannst du den Rundgang jederzeit neu starten",
      },
      {
        target: "body",
        placement: "center",
        title: "Du bist startklar! 🚀",
        content:
          "Erkunde jetzt die Plattform. Auf jeder Seite gibt es einen kurzen Rundgang mit den wichtigsten Features. Viel Erfolg!",
        disableBeacon: true,
        icon: <CheckCircle2 className="h-6 w-6" />,
        emoji: "✨",
        tip: "Klicke auf deinen Avatar → 'Rundgang neu starten' für Hilfe",
      },
    ],
    dashboard: [
      {
        target: "body",
        placement: "center",
        title: "Dein Dashboard 📊",
        content:
          "Das Cockpit deiner Marketing-Aktivitäten. Hier siehst du auf einen Blick, was gerade läuft und was ansteht.",
        disableBeacon: true,
        icon: <BarChart3 className="h-6 w-6" />,
        emoji: "🏠",
      },
      {
        target: "#tour-kpis",
        title: "Live KPIs",
        content:
          "Diese Zahlen werden live aktualisiert: Unternehmen, Kontakte, aktive Deals und geplante Events. Ein schneller Health-Check für dein Marketing.",
        placement: "bottom",
        icon: <Target className="h-5 w-5" />,
        emoji: "📈",
        tip: "Klicke auf eine KPI-Karte für Details",
      },
      {
        target: "#tour-modules",
        title: "Schnellzugriff",
        content:
          "Mit einem Klick direkt ins CRM, zu Aktivitäten oder in den Kalender. So sparst du Zeit und behältst den Überblick.",
        placement: "top",
        icon: <Rocket className="h-5 w-5" />,
        emoji: "⚡",
      },
    ],
    crm: [
      {
        target: "body",
        placement: "center",
        title: "CRM – Deine Kundenübersicht 👥",
        content:
          "Verwalte Unternehmen, Kontakte und Deals zentral an einem Ort. Alles was du für erfolgreiches Kundenmanagement brauchst.",
        disableBeacon: true,
        icon: <Users className="h-6 w-6" />,
        emoji: "🏢",
      },
      {
        target: '[data-tour="crm-tabs"]',
        title: "Drei Bereiche, ein System",
        content:
          "Companies = Unternehmen, Contacts = Ansprechpartner, Deals = Verkaufschancen. Wechsle mit einem Klick zwischen den Ansichten.",
        placement: "bottom",
        icon: <Target className="h-5 w-5" />,
        emoji: "📑",
        tip: "Jeder Tab hat eigene Filter und Sortierungen",
      },
      {
        target: '[data-tour="crm-search"]',
        title: "Blitzschnelle Suche",
        content:
          "Finde jeden Datensatz in Sekunden. Suche nach Namen, E-Mail, Telefon oder beliebigen Feldern.",
        placement: "bottom",
        icon: <Zap className="h-5 w-5" />,
        emoji: "🔍",
        shortcut: "⌘+K",
      },
      {
        target: '[data-tour="crm-table"]',
        title: "Deine Datensätze",
        content:
          "Klicke auf eine Zeile für Details, nutze das ⋮ Menü für Aktionen wie Bearbeiten oder Löschen.",
        placement: "top",
        icon: <FileText className="h-5 w-5" />,
        emoji: "📋",
        tip: "Drag & Drop zum Sortieren kommt bald!",
      },
    ],
    calendar: [
      {
        target: "body",
        placement: "center",
        title: "Kalender – Timing ist alles ⏰",
        content:
          "Plane Kampagnen, setze Deadlines und behalte alle Marketing-Termine im Blick. Wiederkehrende Events? Kein Problem.",
        disableBeacon: true,
        icon: <Calendar className="h-6 w-6" />,
        emoji: "📅",
      },
      {
        target: '[data-tour="calendar-toolbar"]',
        title: "Deine Werkzeuge",
        content:
          "Neue Aktivität erstellen, Vorlagen nutzen oder zwischen Ansichten wechseln. Alles mit einem Klick erreichbar.",
        placement: "bottom",
        icon: <Zap className="h-5 w-5" />,
        emoji: "🛠️",
        tip: "Nutze Vorlagen für wiederkehrende Kampagnen-Typen",
      },
      {
        target: '[data-tour="calendar-grid"]',
        title: "Drag & Drop Planung",
        content:
          "Klicke auf einen Tag um einen neuen Termin zu erstellen. Bestehende Einträge kannst du anklicken um Details zu sehen oder zu bearbeiten.",
        placement: "top",
        icon: <MousePointer className="h-5 w-5" />,
        emoji: "📌",
      },
    ],
    activities: [
      {
        target: "body",
        placement: "center",
        title: "Aktivitäten – Der Marketing-Kreis 🎯",
        content:
          "Das Herzstück der Plattform! Hier planst, trackst und analysierst du alle Marketing-Maßnahmen visuell im Jahreskreis.",
        disableBeacon: true,
        icon: <Target className="h-6 w-6" />,
        emoji: "🎪",
      },
      {
        target: '[data-tour="activities-actions"]',
        title: "Schnell starten",
        content:
          "Neue Aktivität anlegen, nach Status filtern, zwischen Jahren wechseln. Die wichtigsten Aktionen immer griffbereit.",
        placement: "bottom",
        icon: <Rocket className="h-5 w-5" />,
        emoji: "⚡",
        tip: "Export als CSV für externe Auswertungen",
      },
      {
        target: '[data-tour="activities-list"]',
        title: "Der Marketing-Kreis",
        content:
          "Jeder Punkt = eine Aktivität. Position = Zeitpunkt im Jahr. Farbe = Kategorie. Größe = Gewichtung. Hover für Details!",
        placement: "top",
        icon: <BarChart3 className="h-5 w-5" />,
        emoji: "🎡",
        tip: "Shift + Drag um Aktivitäten zu verschieben",
      },
    ],
    performance: [
      {
        target: "body",
        placement: "center",
        title: "Performance Analytics 📈",
        content: "Datenbasierte Entscheidungen treffen. Analysiere Trends, vergleiche Zeiträume und optimiere deine Strategie.",
        disableBeacon: true,
        icon: <BarChart3 className="h-6 w-6" />,
        emoji: "📊",
      },
      {
        target: '[data-tour="performance-filters"]',
        title: "Zeitraum wählen",
        content: "Vergleiche Wochen, Monate oder Quartale. Erkenne Muster und reagiere schnell auf Veränderungen.",
        placement: "bottom",
        icon: <Calendar className="h-5 w-5" />,
        emoji: "📆",
      },
      {
        target: '[data-tour="performance-charts"]',
        title: "Visualisierte Insights",
        content: "Charts die sprechen: Trends, Verteilungen und Vergleiche auf einen Blick.",
        placement: "top",
        icon: <Target className="h-5 w-5" />,
        emoji: "📉",
      },
    ],
    budget: [
      {
        target: "body",
        placement: "center",
        title: "Budget & KPIs 💰",
        content: "Plane Budgets, erstelle Szenarien und behalte deine Marketing-KPIs im Griff.",
        disableBeacon: true,
        icon: <Target className="h-6 w-6" />,
        emoji: "💵",
      },
      {
        target: '[data-tour="budget-scenarios"]',
        title: "What-If Szenarien",
        content: "Vergleiche verschiedene Budget-Verteilungen und finde die optimale Strategie.",
        placement: "top",
        icon: <Lightbulb className="h-5 w-5" />,
        emoji: "🔮",
      },
      {
        target: '[data-tour="budget-kpis"]',
        title: "KPI Dashboard",
        content: "Alle wichtigen Kennzahlen pro Channel und Zeitraum übersichtlich zusammengefasst.",
        placement: "top",
        icon: <BarChart3 className="h-5 w-5" />,
        emoji: "📊",
      },
    ],
    content: [
      {
        target: "body",
        placement: "center",
        title: "Content Hub 📝",
        content: "Plane Content, organisiere Aufgaben und behalte Deadlines im Blick. Kanban-Style.",
        disableBeacon: true,
        icon: <FileText className="h-6 w-6" />,
        emoji: "✍️",
      },
      {
        target: '[data-tour="content-board"]',
        title: "Kanban Board",
        content: "Ziehe Karten zwischen Spalten: Idee → In Arbeit → Review → Veröffentlicht.",
        placement: "top",
        icon: <MousePointer className="h-5 w-5" />,
        emoji: "📋",
        tip: "Drag & Drop für schnelle Statusänderungen",
      },
      {
        target: '[data-tour="content-calendar"]',
        title: "Content Kalender",
        content: "Wann wird was veröffentlicht? Behalte den Überblick über deinen Redaktionsplan.",
        placement: "top",
        icon: <Calendar className="h-5 w-5" />,
        emoji: "📅",
      },
    ],
    reports: [
      {
        target: "body",
        placement: "center",
        title: "Reports – Insights auf Knopfdruck 📑",
        content:
          "Generiere professionelle Berichte für Stakeholder. Automatisch aus deinen Live-Daten erstellt.",
        disableBeacon: true,
        icon: <FileText className="h-6 w-6" />,
        emoji: "📊",
      },
      {
        target: '[data-tour="reports-actions"]',
        title: "Report Generator",
        content:
          "Wähle Zeitraum, Sektionen und Format. Der KI-Generator fasst die wichtigsten Insights zusammen.",
        placement: "bottom",
        icon: <Sparkles className="h-5 w-5" />,
        emoji: "🤖",
        tip: "Exportiere als HTML oder PDF für Präsentationen",
      },
      {
        target: '[data-tour="reports-list"]',
        title: "Live Daten",
        content:
          "Diese Übersicht zeigt Echtzeit-Daten aus CRM, Kalender und Activities. Immer aktuell, immer griffbereit.",
        placement: "top",
        icon: <Zap className="h-5 w-5" />,
        emoji: "⚡",
      },
    ],
    uploads: [
      {
        target: "body",
        placement: "center",
        title: "Uploads & Import 📂",
        content:
          "Importiere Daten aus Excel/CSV direkt in deine Aktivitäten. Lade Dateien hoch und verwalte sie zentral.",
        disableBeacon: true,
        icon: <Upload className="h-6 w-6" />,
        emoji: "📤",
      },
      {
        target: '[data-tour="uploads-dropzone"]',
        title: "Drag & Drop Zone",
        content:
          "Ziehe CSV/XLSX Dateien hierher oder klicke zum Auswählen. Der Import startet automatisch.",
        placement: "top",
        icon: <MousePointer className="h-5 w-5" />,
        emoji: "🎯",
        tip: "Unterstützt: CSV, XLSX, XLS, PDF, Bilder",
      },
      {
        target: '[data-tour="uploads-mapping"]',
        title: "Intelligentes Mapping",
        content:
          "Ordne Spalten den Aktivitäts-Feldern zu. Das System schlägt automatisch passende Zuordnungen vor.",
        placement: "top",
        icon: <Sparkles className="h-5 w-5" />,
        emoji: "🔗",
        tip: "'title' ist Pflichtfeld für den Import",
      },
      {
        target: '[data-tour="uploads-list"]',
        title: "Datei-Manager",
        content:
          "Alle hochgeladenen Dateien mit Vorschau, Suche und schnellen Aktionen wie Download oder Teilen.",
        placement: "top",
        icon: <FileText className="h-5 w-5" />,
        emoji: "📁",
      },
      {
        target: '[data-tour="jobs-list"]',
        title: "Import Jobs",
        content:
          "Verfolge den Status deiner Imports in Echtzeit. Fehler werden hier detailliert angezeigt.",
        placement: "top",
        icon: <CheckCircle2 className="h-5 w-5" />,
        emoji: "✅",
      },
    ],
  }
}

// Enhanced tooltip with beautiful design
const FancyTooltip: React.FC<TooltipRenderProps & { step: EnhancedStep }> = ({
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
  const progress = (current / size) * 100
  const enhancedStep = step as EnhancedStep

  return (
    <div className="relative w-[380px] max-w-[calc(100vw-32px)] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-slate-50 shadow-2xl">
      {/* Animated gradient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/2 h-full w-full rounded-full bg-gradient-to-br from-rose-500/20 via-purple-500/10 to-transparent blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/2 -left-1/2 h-full w-full rounded-full bg-gradient-to-tr from-blue-500/20 via-cyan-500/10 to-transparent blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Progress bar */}
      <div className="relative h-1 w-full bg-slate-800">
        <div
          className="h-full bg-gradient-to-r from-rose-500 via-red-500 to-orange-400 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
        <div
          className="absolute top-0 h-full w-8 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"
          style={{ left: `${progress - 10}%` }}
        />
      </div>

      <div className="relative p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-start gap-3">
            {/* Icon with glow */}
            {enhancedStep.icon && (
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-rose-500/40 blur-xl rounded-full" />
                <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 text-white shadow-lg shadow-rose-500/30">
                  {enhancedStep.icon}
                </div>
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                {enhancedStep.emoji && (
                  <span className="text-lg">{enhancedStep.emoji}</span>
                )}
                <h3 className="text-lg font-bold text-white leading-tight">
                  {step.title}
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Schritt {current} von {size}
              </p>
            </div>
          </div>
          <button
            {...closeProps}
            className="flex-shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-slate-400 ring-1 ring-white/10 transition-all hover:bg-white/10 hover:text-white hover:ring-white/20"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <p className="text-sm leading-relaxed text-slate-200 mb-4">
          {step.content}
        </p>

        {/* Tip box */}
        {(enhancedStep.tip || enhancedStep.shortcut) && (
          <div className="mb-4 rounded-xl bg-white/5 border border-white/10 p-3">
            <div className="flex items-start gap-2">
              {enhancedStep.shortcut ? (
                <Keyboard className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
              ) : (
                <Lightbulb className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
              )}
              <div className="text-xs text-slate-300">
                {enhancedStep.shortcut && (
                  <span className="inline-flex items-center gap-1 mr-2">
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-700 text-slate-200 font-mono text-[10px]">
                      {enhancedStep.shortcut}
                    </kbd>
                  </span>
                )}
                {enhancedStep.tip}
              </div>
            </div>
          </div>
        )}

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 mb-4">
          {Array.from({ length: size }, (_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i < current
                  ? "w-6 bg-gradient-to-r from-rose-500 to-orange-400"
                  : i === current - 1
                  ? "w-6 bg-gradient-to-r from-rose-500 to-orange-400"
                  : "w-1.5 bg-slate-600"
              }`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3">
          <button
            {...skipProps}
            className="text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            Überspringen
          </button>
          <div className="flex items-center gap-2">
            {current > 1 && (
              <button
                {...backProps}
                className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/5 px-3 py-2 text-xs font-medium text-white transition-all hover:bg-white/10 hover:border-white/30"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Zurück
              </button>
            )}
            <button
              {...primaryProps}
              className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-rose-500 via-red-500 to-orange-400 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-rose-500/30 transition-all hover:shadow-rose-500/50 hover:brightness-110"
            >
              {isLast ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Los geht's!
                </>
              ) : (
                <>
                  Weiter
                  <ChevronRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Decorative corner accent */}
      <div className="absolute top-0 right-0 h-20 w-20 overflow-hidden">
        <div className="absolute -top-10 -right-10 h-20 w-20 rotate-45 bg-gradient-to-br from-rose-500/20 to-transparent" />
      </div>
    </div>
  )
}

// Shimmer animation keyframes (add to global CSS or use inline)
const shimmerStyle = `
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(200%); }
}
.animate-shimmer {
  animation: shimmer 2s infinite;
}
`

export function restartOnboarding(key?: TourKey) {
  sync.emit("onboarding:restart", { key })
}

export default function OnboardingTour() {
  const pathname = usePathname()
  const [run, setRun] = React.useState(false)
  const [steps, setSteps] = React.useState<EnhancedStep[]>([])
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
        setTimeout(() => startTour("welcome"), 600)
        return
      }
    } catch {}

    // 2) Per-page tour once
    try {
      const done = localStorage.getItem(seenKey(currentKey)) === "1"
      if (!done) {
        setTimeout(() => startTour(currentKey), 600)
      }
    } catch {}
  }, [currentKey, pathname, startTour])

  React.useEffect(() => {
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
    const { status, type, index, action } = data
    const finished = status === STATUS.FINISHED || status === STATUS.SKIPPED
    if (finished) {
      try {
        localStorage.setItem(seenKey(activeKey), "1")
      } catch {}
      setRun(false)
      return
    }
    // Controlled mode: we must advance ourselves.
    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      const i = typeof index === "number" ? index : stepIndex
      const delta = action === ACTIONS.PREV ? -1 : 1
      setStepIndex(i + delta)
    }
  }, [activeKey, stepIndex])

  if (!run) return null

  return (
    <>
      <style>{shimmerStyle}</style>
      <Joyride
        steps={steps}
        run={run}
        stepIndex={stepIndex}
        callback={handleJoyrideCallback}
        continuous
        showSkipButton
        showProgress={false}
        disableScrolling={false}
        scrollToFirstStep={true}
        spotlightClicks={false}
        floaterProps={{
          disableAnimation: false,
        }}
        styles={{
          options: {
            zIndex: 10000,
            primaryColor: "#ef4444",
            overlayColor: "rgba(0, 0, 0, 0.75)",
          },
          spotlight: {
            borderRadius: 16,
            boxShadow: "0 0 0 4px rgba(239, 68, 68, 0.3), 0 0 30px rgba(239, 68, 68, 0.2)",
          },
          overlay: {
            backgroundColor: "rgba(2, 6, 23, 0.85)",
          },
        }}
        locale={{
          back: "Zurück",
          close: "Schließen",
          last: "Los geht's!",
          next: "Weiter",
          skip: "Überspringen",
        }}
        tooltipComponent={FancyTooltip as any}
      />
    </>
  )
}
