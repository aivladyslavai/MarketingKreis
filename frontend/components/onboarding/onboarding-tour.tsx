"use client"

import React from "react"
import Joyride, { CallBackProps, STATUS, Step, TooltipRenderProps } from "react-joyride"

function getSteps(): Step[] {
  return [
    {
      target: "body",
      placement: "center",
      title: "Willkommen!",
      content:
        "Das ist ein kurzer Rundgang durch die Plattform. In 5 Schritten zeigen wir dir die wichtigsten Bereiche. Du kannst den Rundgang jederzeit überspringen.",
      disableBeacon: true,
    },
    {
      target: '[data-tour="menu-button"]',
      title: "Hauptmenü",
      content: "Hier öffnest du das Seitenmenü auf dem Smartphone. Am Desktop ist es permanent links sichtbar.",
      placement: "bottom",
    },
    {
      target: '[data-tour="sidebar"]',
      title: "Module & Navigation",
      content:
        "Über die Seitenleiste wechselst du schnell zwischen Dashboard, CRM, Aktivitäten, Kalender und weiteren Modulen.",
      placement: "right",
    },
    {
      target: "#tour-kpis",
      title: "Wichtige KPIs",
      content:
        "Hier siehst du die wichtigsten Kennzahlen – z. B. Unternehmen, Kontakte, Deals, Aktivitäten und Events.",
      placement: "top",
    },
    {
      target: "#tour-modules",
      title: "Schneller Einstieg",
      content:
        "Die Karten führen dich direkt in die wichtigsten Bereiche: CRM, Aktivitäten, Kalender und mehr.",
      placement: "top",
    },
    {
      target: '[data-tour="theme-toggle"]',
      title: "Theme & Mood",
      content:
        "Wechsle zwischen Auto, Light und Dark. Im Auto‑Modus folgt das Theme automatisch deinen System‑Einstellungen.",
      placement: "left",
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
  const [run, setRun] = React.useState(false)
  const [steps, setSteps] = React.useState<Step[]>([])

  React.useEffect(() => {
    // Tour nur anzeigen, wenn der Nutzer ihn noch nicht gesehen hat
    try {
      const done = localStorage.getItem('mkOnboardingDone') === '1'
      const shouldStart = !done
      if (shouldStart) {
        setSteps(getSteps())
        // небольшая задержка, чтобы DOM успел смонтироваться
        setTimeout(() => setRun(true), 400)
      }
    } catch {}
  }, [])

  const handleJoyrideCallback = React.useCallback((data: CallBackProps) => {
    const { status } = data
    const finished = [STATUS.FINISHED, STATUS.SKIPPED].includes(status)
    if (finished) {
      try { localStorage.setItem('mkOnboardingDone', '1') } catch {}
      setRun(false)
    }
  }, [])

  if (!run) return null

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
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: "#ef4444", // kaboom red
          textColor: "var(--mk-joyride-text, #0f172a)",
          backgroundColor: "transparent",
          spotlightColor: "rgba(248, 113, 113, 0.26)",
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
      callback={handleJoyrideCallback}
    />
  )
}