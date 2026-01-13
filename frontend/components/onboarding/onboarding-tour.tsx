"use client"

import React from "react"
import Joyride, { CallBackProps, STATUS, Step, TooltipRenderProps } from "react-joyride"
import { sync } from "@/lib/sync"

// localStorage key für den Onboarding-Status
const ONBOARDING_KEY = "mkOnboardingDone"
const ONBOARDING_VERSION = "2" // Erhöhen, um Tour erneut zu zeigen nach Updates

function getSteps(): Step[] {
  return [
    // ═══════════════════════════════════════════════════════════════
    // WILLKOMMEN
    // ═══════════════════════════════════════════════════════════════
    {
      target: "body",
      placement: "center",
      title: "Willkommen bei Marketing Kreis! 🎯",
      content:
        "Schön, dass du da bist! In diesem kurzen Rundgang zeigen wir dir die wichtigsten Funktionen der Plattform. Du kannst jederzeit überspringen oder später erneut starten.",
      disableBeacon: true,
    },

    // ═══════════════════════════════════════════════════════════════
    // NAVIGATION
    // ═══════════════════════════════════════════════════════════════
    {
      target: '[data-tour="sidebar"]',
      title: "Deine Kommandozentrale",
      content:
        "Die Seitenleiste ist dein Hauptnavigationspunkt. Hier findest du alle Module: Dashboard, CRM, Kalender, Aktivitäten, Performance, Budget und mehr.",
      placement: "right",
      spotlightPadding: 8,
    },
    {
      target: '[data-tour="menu-button"]',
      title: "Mobile Navigation",
      content:
        "Auf dem Smartphone öffnest du das Menü mit diesem Button. Am Desktop ist die Seitenleiste immer sichtbar.",
      placement: "bottom",
    },

    // ═══════════════════════════════════════════════════════════════
    // DASHBOARD KPIs
    // ═══════════════════════════════════════════════════════════════
    {
      target: "#tour-kpis",
      title: "Deine Kennzahlen auf einen Blick",
      content:
        "Diese Karten zeigen dir die wichtigsten KPIs: Unternehmen, Kontakte, Deals, Pipeline-Wert, Aktivitäten und anstehende Events. Klicke auf eine Karte, um direkt zum entsprechenden Modul zu gelangen.",
      placement: "bottom",
      spotlightPadding: 12,
    },

    // ═══════════════════════════════════════════════════════════════
    // MODULE CARDS
    // ═══════════════════════════════════════════════════════════════
    {
      target: "#tour-modules",
      title: "Schnellzugriff auf Module",
      content:
        "Von hier aus springst du direkt in die wichtigsten Bereiche: CRM für Kundenmanagement, Aktivitäten für Marketing-Kampagnen, Kalender für Termine und mehr.",
      placement: "top",
      spotlightPadding: 12,
    },

    // ═══════════════════════════════════════════════════════════════
    // THEME TOGGLE
    // ═══════════════════════════════════════════════════════════════
    {
      target: '[data-tour="theme-toggle"]',
      title: "Hell, Dunkel oder Automatisch",
      content:
        "Wähle dein bevorzugtes Design: Light-Mode für helle Umgebungen, Dark-Mode für Nachteulen, oder Auto, um deinem System zu folgen.",
      placement: "left",
    },

    // ═══════════════════════════════════════════════════════════════
    // NOTIFICATIONS (wenn vorhanden)
    // ═══════════════════════════════════════════════════════════════
    {
      target: '[data-tour="notifications"]',
      title: "Benachrichtigungen",
      content:
        "Hier findest du wichtige Updates und Erinnerungen. Wir informieren dich über anstehende Deadlines, neue Kontakte und abgeschlossene Imports.",
      placement: "bottom",
    },

    // ═══════════════════════════════════════════════════════════════
    // USER MENU
    // ═══════════════════════════════════════════════════════════════
    {
      target: '[data-tour="user-menu"]',
      title: "Dein Profil & Einstellungen",
      content:
        "Klicke auf deinen Avatar für Kontoeinstellungen, Logout und die Möglichkeit, diesen Rundgang erneut zu starten.",
      placement: "bottom-end",
    },

    // ═══════════════════════════════════════════════════════════════
    // ABSCHLUSS
    // ═══════════════════════════════════════════════════════════════
    {
      target: "body",
      placement: "center",
      title: "Du bist startklar! 🚀",
      content:
        "Das war's! Entdecke jetzt die Plattform. Tipp: Du kannst diesen Rundgang jederzeit über das Benutzermenü (oben rechts) erneut starten. Viel Erfolg mit deinem Marketing!",
      disableBeacon: true,
    },
  ]
}

const FancyTooltip: React.FC<TooltipRenderProps> = ({
  index,
  size,
  step,
  backProps,
  closeProps,
  primaryProps,
  skipProps,
  isLastStep,
}) => {
  const current = (index ?? 0) + 1
  const isFirst = current === 1
  const isLast = isLastStep || current === size

  // Progress dots
  const progressDots = Array.from({ length: size }, (_, i) => (
    <span
      key={i}
      className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${
        i < current
          ? "bg-gradient-to-r from-rose-400 to-orange-400"
          : "bg-slate-700"
      } ${i === current - 1 ? "w-4" : ""}`}
    />
  ))

  return (
    <div className="relative max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/95 text-slate-50 shadow-2xl shadow-rose-500/25 backdrop-blur-xl">
      {/* Decorative blurs */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-40 w-40 rounded-full bg-rose-500/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-44 w-44 rounded-full bg-sky-500/35 blur-3xl" />

      <div className="relative space-y-4 p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400">
                Schritt {current} von {size}
              </p>
            </div>
            <h3 className="mt-1 text-lg font-semibold text-slate-50">
              {step.title}
            </h3>
          </div>
          <button
            {...closeProps}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-900/80 text-slate-400 ring-1 ring-slate-700 transition hover:bg-slate-800 hover:text-slate-100"
            aria-label="Schließen"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <p className="text-sm leading-relaxed text-slate-200">{step.content}</p>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 py-1">
          {progressDots}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3">
          <button
            {...skipProps}
            className="text-xs font-medium text-slate-400 underline-offset-2 hover:text-slate-100 hover:underline"
          >
            Überspringen
          </button>
          <div className="flex items-center gap-2">
            {!isFirst && (
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
              {isLast ? "Los geht's!" : "Weiter"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function OnboardingTour() {
  const [run, setRun] = React.useState(false)
  const [steps, setSteps] = React.useState<Step[]>([])

  // Initialisierung: Prüfe, ob Tour bereits gesehen wurde
  React.useEffect(() => {
    const checkAndStart = () => {
      try {
        const savedVersion = localStorage.getItem(ONBOARDING_KEY)
        // Starte Tour wenn: noch nie gesehen ODER alte Version
        if (!savedVersion || savedVersion !== ONBOARDING_VERSION) {
          setSteps(getSteps())
          // Kleine Verzögerung für DOM-Mount
          const timer = setTimeout(() => setRun(true), 600)
          return () => clearTimeout(timer)
        }
      } catch {
        // localStorage nicht verfügbar - Tour trotzdem nicht starten
      }
    }

    checkAndStart()
  }, [])

  // Event-Listener für manuellen Neustart
  React.useEffect(() => {
    const handleRestart = () => {
      setSteps(getSteps())
      setTimeout(() => setRun(true), 300)
    }

    const unsub = sync.on("onboarding:restart", handleRestart)
    return () => {
      if (unsub) unsub()
    }
  }, [])

  const handleJoyrideCallback = React.useCallback((data: CallBackProps) => {
    const { status } = data
    const finished = status === STATUS.FINISHED || status === STATUS.SKIPPED

    if (finished) {
      try {
        localStorage.setItem(ONBOARDING_KEY, ONBOARDING_VERSION)
      } catch {}
      setRun(false)
    }
  }, [])

  // Wenn nicht aktiv, nichts rendern
  if (!run || steps.length === 0) return null

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showSkipButton
      showProgress
      disableScrolling
      scrollToFirstStep
      spotlightClicks={false}
      disableOverlayClose={false}
      hideCloseButton={false}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: "#ef4444",
          textColor: "var(--mk-joyride-text, #0f172a)",
          backgroundColor: "transparent",
          arrowColor: "transparent",
        },
        tooltipContainer: {
          textAlign: "left",
        },
        spotlight: {
          borderRadius: 16,
        },
        overlay: {
          backgroundColor: "rgba(0, 0, 0, 0.75)",
        },
      }}
      locale={{
        back: "Zurück",
        close: "Schließen",
        last: "Los geht's!",
        next: "Weiter",
        skip: "Überspringen",
      }}
      tooltipComponent={FancyTooltip}
      callback={handleJoyrideCallback}
    />
  )
}

// Export für externen Neustart
export function restartOnboarding() {
  sync.emit("onboarding:restart")
}
