"use client"

import React, { Component, ErrorInfo, ReactNode } from "react"
import Joyride, { CallBackProps, STATUS, Step, TooltipRenderProps } from "react-joyride"

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEY = "mkOnboardingDone"
const TOUR_VERSION = "v2" // Bump this to force re-show tour after major updates

// ============================================================================
// WELCOME TOUR STEPS (German)
// ============================================================================

function getWelcomeTourSteps(): Step[] {
  return [
    {
      target: "body",
      placement: "center",
      title: "Willkommen bei Marketing Kreis! 🎉",
      content:
        "Schön, dass du da bist! In diesem kurzen Rundgang zeigen wir dir die wichtigsten Funktionen der Plattform. Du kannst jederzeit überspringen oder später erneut starten.",
      disableBeacon: true,
    },
    {
      target: '[data-tour="sidebar"]',
      title: "Navigation",
      content:
        "Die Seitenleiste ist dein Hauptmenü. Hier findest du alle Module: Dashboard, CRM, Aktivitäten, Kalender, Performance, Budget und mehr.",
      placement: "right",
      disableBeacon: true,
    },
    {
      target: "#tour-kpis",
      title: "Deine Kennzahlen",
      content:
        "Auf einen Blick siehst du hier die wichtigsten KPIs: Unternehmen, Kontakte, Deals, Pipeline-Wert, Aktivitäten und Events. Klicke auf eine Karte, um direkt zum Modul zu springen.",
      placement: "bottom",
      disableBeacon: true,
    },
    {
      target: "#tour-modules",
      title: "Schnellzugriff",
      content:
        "Diese Karten führen dich direkt zu den wichtigsten Bereichen. CRM für Kundenverwaltung, Aktivitäten für Marketingkampagnen, Kalender für Events.",
      placement: "top",
      disableBeacon: true,
    },
    {
      target: '[data-tour="theme-toggle"]',
      title: "Hell oder Dunkel?",
      content:
        "Wechsle zwischen Auto, Light und Dark Mode. Im Auto-Modus passt sich das Design automatisch an deine System-Einstellungen an.",
      placement: "left",
      disableBeacon: true,
    },
    {
      target: '[data-tour="notifications"]',
      title: "Benachrichtigungen",
      content:
        "Hier findest du wichtige Updates und Benachrichtigungen zu deinen Aktivitäten und Events.",
      placement: "bottom",
      disableBeacon: true,
    },
    {
      target: "body",
      placement: "center",
      title: "Bereit zum Loslegen! 🚀",
      content:
        "Du kannst diesen Rundgang jederzeit über das Hilfe-Menü erneut starten. Viel Erfolg mit Marketing Kreis!",
      disableBeacon: true,
    },
  ]
}

// ============================================================================
// SAFE ELEMENT CHECK
// ============================================================================

/**
 * Filter steps to only include those whose target elements exist in the DOM.
 * This prevents Joyride from crashing when elements are missing.
 */
function filterAvailableSteps(steps: Step[]): Step[] {
  if (typeof document === "undefined") return steps

  return steps.filter((step) => {
    // "body" is always available
    if (step.target === "body") return true

    try {
      const selector = typeof step.target === "string" ? step.target : null
      if (!selector) return true // non-string targets are handled by Joyride

      const element = document.querySelector(selector)
      return element !== null
    } catch {
      // Invalid selector or other error — skip this step
      return false
    }
  })
}

// ============================================================================
// FANCY TOOLTIP COMPONENT
// ============================================================================

const FancyTooltip: React.FC<TooltipRenderProps> = ({
  index,
  size,
  step,
  tooltipProps,
  backProps,
  closeProps,
  primaryProps,
  skipProps,
  isLastStep,
}) => {
  const current = (index ?? 0) + 1

  return (
    <div
      {...tooltipProps}
      // Ensure tooltip is always clickable even if overlay layers misbehave
      style={{
        ...(tooltipProps as any)?.style,
        pointerEvents: "auto",
        zIndex: 10002,
      }}
      className="relative max-w-md overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900/95 text-slate-50 shadow-2xl shadow-rose-500/20 backdrop-blur-xl"
    >
      {/* Decorative blurs */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-40 w-40 rounded-full bg-rose-500/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-44 w-44 rounded-full bg-sky-500/25 blur-3xl" />

      <div className="relative space-y-4 p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400">
              Schritt {current} von {size}
            </p>
            <h3 className="mt-1 text-lg font-semibold text-slate-50">
              {step.title}
            </h3>
          </div>
          <button
            {...closeProps}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-800/80 text-slate-400 ring-1 ring-slate-600 transition hover:bg-slate-700 hover:text-slate-100"
            aria-label="Schließen"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <p className="text-sm leading-relaxed text-slate-300">
          {step.content}
        </p>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5">
          {Array.from({ length: size }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index
                  ? "w-6 bg-gradient-to-r from-rose-500 to-orange-400"
                  : "w-1.5 bg-slate-600"
              }`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="mt-2 flex items-center justify-between gap-3">
          <button
            {...skipProps}
            className="text-xs font-medium text-slate-400 underline-offset-2 transition hover:text-slate-200 hover:underline"
          >
            Überspringen
          </button>
          <div className="flex items-center gap-2">
            {current > 1 && (
              <button
                {...backProps}
                className="rounded-full border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-slate-800"
              >
                Zurück
              </button>
            )}
            <button
              {...primaryProps}
              className="rounded-full bg-gradient-to-r from-rose-500 via-red-500 to-orange-400 px-4 py-1.5 text-xs font-semibold text-white shadow-lg shadow-rose-500/30 transition hover:shadow-rose-500/50 hover:brightness-110"
            >
              {isLastStep ? "Fertig" : "Weiter"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// ERROR BOUNDARY
// ============================================================================

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

class OnboardingErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, _errorInfo: ErrorInfo) {
    // Log but don't crash the app
    console.warn("[OnboardingTour] Error caught:", error.message)
  }

  render() {
    if (this.state.hasError) {
      // Silently fail - don't show anything if onboarding crashes
      return null
    }
    return this.props.children
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function OnboardingTourInner() {
  const [run, setRun] = React.useState(false)
  const [steps, setSteps] = React.useState<Step[]>([])
  const [mounted, setMounted] = React.useState(false)
  const [tourKey, setTourKey] = React.useState(0)

  // Check if tour should run on mount
  React.useEffect(() => {
    setMounted(true)

    const checkAndStart = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        const shouldSkip = stored === TOUR_VERSION

        if (!shouldSkip) {
          // Filter steps to only those with available targets
          const availableSteps = filterAvailableSteps(getWelcomeTourSteps())

          if (availableSteps.length > 0) {
            setSteps(availableSteps)
            // Delay start to ensure DOM is ready
            setTimeout(() => {
              setTourKey((k) => k + 1) // force Joyride remount
              setRun(true)
            }, 600)
          }
        }
      } catch {
        // localStorage not available — skip tour
      }
    }

    // Wait a bit for layout to stabilize
    const timer = setTimeout(checkAndStart, 300)
    return () => clearTimeout(timer)
  }, [])

  // Listen for manual restart event
  React.useEffect(() => {
    const handleRestart = () => {
      try {
        localStorage.removeItem(STORAGE_KEY)
      } catch {}
      setRun(false)
      const availableSteps = filterAvailableSteps(getWelcomeTourSteps())
      setSteps(availableSteps)
      setTimeout(() => {
        setTourKey((k) => k + 1) // force Joyride remount
        setRun(true)
      }, 300)
    }

    window.addEventListener("mk:restart-tour", handleRestart)
    return () => window.removeEventListener("mk:restart-tour", handleRestart)
  }, [])

  const handleJoyrideCallback = React.useCallback((data: CallBackProps) => {
    try {
      const { status } = data
      const finished = status === STATUS.FINISHED || status === STATUS.SKIPPED
      if (finished) {
        try {
          localStorage.setItem(STORAGE_KEY, TOUR_VERSION)
        } catch {}
        setRun(false)
      }
    } catch (e) {
      // Never block the app because of onboarding
      console.warn("[OnboardingTour] callback error:", e)
      try {
        setRun(false)
      } catch {}
    }
  }, [])

  // Don't render until mounted (avoid SSR issues)
  if (!mounted) return null

  // Don't render if not running
  if (!run || steps.length === 0) return null

  return (
    <Joyride
      key={tourKey}
      steps={steps}
      run={run}
      continuous
      showSkipButton
      showProgress
      disableScrolling={false}
      scrollToFirstStep
      scrollOffset={100}
      spotlightClicks={false}
      disableOverlayClose={false}
      hideCloseButton={false}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: "#ef4444",
          arrowColor: "rgb(15 23 42 / 0.95)", // slate-900
          overlayColor: "rgba(0, 0, 0, 0.5)",
        },
        overlay: {
          mixBlendMode: undefined, // Fix for Safari
          zIndex: 10000,
          pointerEvents: "auto",
        },
        tooltip: {
          zIndex: 10002,
          pointerEvents: "auto",
        },
        spotlight: {
          borderRadius: 16,
        },
        tooltipContainer: {
          textAlign: "left",
        },
      }}
      locale={{
        back: "Zurück",
        close: "Schließen",
        last: "Fertig",
        next: "Weiter",
        skip: "Überspringen",
        open: "Dialog öffnen",
      }}
      tooltipComponent={FancyTooltip}
      callback={handleJoyrideCallback}
      floaterProps={{
        styles: {
          floater: {
            filter: "drop-shadow(0 25px 25px rgb(0 0 0 / 0.15))",
          },
        },
      }}
    />
  )
}

// ============================================================================
// EXPORT WITH ERROR BOUNDARY
// ============================================================================

export default function OnboardingTour() {
  return (
    <OnboardingErrorBoundary>
      <OnboardingTourInner />
    </OnboardingErrorBoundary>
  )
}

// ============================================================================
// UTILITY: Restart tour programmatically
// ============================================================================

export function restartOnboardingTour() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("mk:restart-tour"))
  }
}

// ============================================================================
// UTILITY: Check if tour was completed
// ============================================================================

export function isOnboardingComplete(): boolean {
  if (typeof localStorage === "undefined") return true
  try {
    return localStorage.getItem(STORAGE_KEY) === TOUR_VERSION
  } catch {
    return true
  }
}

// ============================================================================
// UTILITY: Reset tour state (for testing)
// ============================================================================

export function resetOnboardingState() {
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {}
  }
}
