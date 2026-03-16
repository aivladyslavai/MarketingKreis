"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Loader2,
  Building2,
  Briefcase,
  Users,

  ChevronRight,
  ChevronLeft,
  Check,
  Sparkles,
  MapPin,
  Languages,
  UserRound,
  Rocket,
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { authFetch } from "@/lib/api"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

// ─── helpers ────────────────────────────────────────────────────────────────

const INDUSTRIES = [
  "Technologie & Software",
  "Marketing & Werbung",
  "Finanzen & Versicherung",
  "Gesundheit & Medizin",
  "Bildung & Forschung",
  "E‑Commerce & Retail",
  "Produktion & Industrie",
  "Beratung & Dienstleistungen",
  "Immobilien & Bau",
  "Medien & Unterhaltung",
  "Sonstiges",
]

const TEAM_SIZES = [
  { value: "1", label: "Nur ich", icon: "👤" },
  { value: "2-10", label: "2 – 10", icon: "👥" },
  { value: "11-50", label: "11 – 50", icon: "🏢" },
  { value: "51-200", label: "51 – 200", icon: "🏗️" },
  { value: "201-1000", label: "201 – 1 000", icon: "🌆" },
  { value: "1000+", label: "1 000+", icon: "🌐" },
]

const LANGUAGES = [
  { value: "de", label: "Deutsch", flag: "🇩🇪" },
  { value: "en", label: "English", flag: "🇬🇧" },
  { value: "fr", label: "Français", flag: "🇫🇷" },
  { value: "it", label: "Italiano", flag: "🇮🇹" },
]

const POSITIONS = [
  "CEO / Geschäftsführer",
  "CMO / Marketing-Leiter",
  "Head of Marketing",
  "Marketing Manager",
  "Content Manager",
  "Social Media Manager",
  "Brand Manager",
  "Growth Manager",
  "Gründer / Co-Gründer",
  "Andere Position",
]

const TOTAL_STEPS = 4

// ─── sub-components ─────────────────────────────────────────────────────────

function ProgressDots({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-10">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <React.Fragment key={i}>
          <div
            className={cn(
              "transition-all duration-500 rounded-full",
              i < step
                ? "h-2 w-6 bg-violet-500"
                : i === step
                ? "h-2.5 w-8 bg-gradient-to-r from-violet-500 to-fuchsia-500 shadow-[0_0_12px_rgba(139,92,246,0.7)]"
                : "h-2 w-2 bg-white/15"
            )}
          />
          {i < TOTAL_STEPS - 1 && (
            <div className="h-px w-4 bg-white/10" />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

function StepLabel({ current, total }: { current: number; total: number }) {
  return (
    <p className="text-center text-xs text-slate-500 mb-6 tracking-widest uppercase">
      Schritt {current + 1} von {total}
    </p>
  )
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "relative rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl p-8",
        className
      )}
    >
      {/* inner glow */}
      <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-b from-white/5 to-transparent" />
      {children}
    </div>
  )
}

function FieldLabel({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-2 text-sm text-slate-300 font-medium">
      <span className="text-violet-400">{icon}</span>
      {children}
    </div>
  )
}

function GlassInput({
  value,
  onChange,
  placeholder,
  required,
  className,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  required?: boolean
  className?: string
}) {
  return (
    <input
      className={cn(
        "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 placeholder-slate-500",
        "focus:outline-none focus:ring-2 focus:ring-violet-500/60 focus:border-violet-500/50",
        "transition-all duration-200",
        className
      )}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
    />
  )
}

function PillSelect<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; icon?: string; flag?: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-medium transition-all duration-200",
            value === o.value
              ? "border-violet-500 bg-violet-500/20 text-violet-200 shadow-[0_0_12px_rgba(139,92,246,0.3)]"
              : "border-white/10 bg-white/5 text-slate-400 hover:border-white/25 hover:text-slate-200"
          )}
        >
          {(o.icon || o.flag) && <span>{o.icon ?? o.flag}</span>}
          {o.label}
        </button>
      ))}
    </div>
  )
}

function IndustryGrid({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {INDUSTRIES.map((ind) => (
        <button
          key={ind}
          type="button"
          onClick={() => onChange(ind)}
          className={cn(
            "rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-all duration-200",
            value === ind
              ? "border-violet-500 bg-violet-500/20 text-violet-200"
              : "border-white/10 bg-white/5 text-slate-400 hover:border-white/25 hover:text-slate-200"
          )}
        >
          {ind}
        </button>
      ))}
    </div>
  )
}

function PositionGrid({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {POSITIONS.map((pos) => (
        <button
          key={pos}
          type="button"
          onClick={() => onChange(pos)}
          className={cn(
            "rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-all duration-200",
            value === pos
              ? "border-violet-500 bg-violet-500/20 text-violet-200"
              : "border-white/10 bg-white/5 text-slate-400 hover:border-white/25 hover:text-slate-200"
          )}
        >
          {pos}
        </button>
      ))}
    </div>
  )
}

function NavButtons({
  step,
  onBack,
  onNext,
  nextLabel,
  canNext,
  loading,
}: {
  step: number
  onBack: () => void
  onNext: () => void
  nextLabel?: string
  canNext: boolean
  loading?: boolean
}) {
  return (
    <div className="mt-8 flex items-center justify-between">
      {step > 0 ? (
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-400 hover:text-slate-200 hover:border-white/25 transition-all duration-200"
        >
          <ChevronLeft className="h-4 w-4" />
          Zurück
        </button>
      ) : (
        <div />
      )}

      <button
        type="button"
        onClick={onNext}
        disabled={!canNext || loading}
        className={cn(
          "flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold transition-all duration-200",
          canNext && !loading
            ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:shadow-[0_0_28px_rgba(139,92,246,0.6)] hover:scale-[1.02]"
            : "bg-white/10 text-slate-500 cursor-not-allowed"
        )}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : null}
        {nextLabel ?? "Weiter"}
        {!loading && <ChevronRight className="h-4 w-4" />}
      </button>
    </div>
  )
}

// ─── main component ──────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter()
  const { user, loading, refetch } = useAuth()
  const [step, setStep] = React.useState(0)
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [animDir, setAnimDir] = React.useState<"forward" | "back">("forward")
  const [visible, setVisible] = React.useState(true)

  const [form, setForm] = React.useState({
    company_name: "",
    industry: "",
    team_size: "",
    country: "",
    language: "de",
    position_title: "",
    position_custom: "",
  })

  React.useEffect(() => {
    if (!user) return
    setForm((f) => ({
      ...f,
      company_name: user.organization?.name || "",
      industry: user.organization?.industry || "",
      team_size: user.organization?.team_size || "",
      country: user.organization?.country || "",
      language: user.organization?.language || "de",
      position_title: user.position_title || "",
    }))
  }, [user])

  React.useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace("/signup?mode=login&next=/onboarding")
      return
    }
    if (!user.onboarding_required) {
      router.replace("/dashboard")
    }
  }, [loading, user, router])

  // ── animated step transition ──
  function goTo(next: number, dir: "forward" | "back") {
    setAnimDir(dir)
    setVisible(false)
    setTimeout(() => {
      setStep(next)
      setVisible(true)
    }, 220)
  }

  function handleNext() {
    if (step < TOTAL_STEPS - 1) goTo(step + 1, "forward")
  }
  function handleBack() {
    if (step > 0) goTo(step - 1, "back")
  }

  // resolve effective position
  const effectivePosition =
    form.position_title === "Andere Position"
      ? form.position_custom.trim()
      : form.position_title

  async function handleFinish() {
    setSubmitting(true)
    setError(null)
    try {
      const body = {
        company_name: form.company_name.trim(),
        industry: form.industry || undefined,
        team_size: form.team_size || undefined,
        country: form.country.trim() || undefined,
        language: form.language || undefined,
        position_title: effectivePosition,
      }
      const res = await authFetch("/auth/onboarding/company", {
        method: "PATCH",
        body: JSON.stringify(body),
      })
      const text = await res.text()
      const data = text ? JSON.parse(text) : {}
      if (!res.ok) throw new Error(data?.detail || "Onboarding konnte nicht gespeichert werden")
      await refetch()
      // show success step
      goTo(TOTAL_STEPS - 1, "forward")
    } catch (e: any) {
      setError(e?.message || "Onboarding konnte nicht gespeichert werden")
    } finally {
      setSubmitting(false)
    }
  }

  // ── step can-advance logic ──
  const canNext = (() => {
    if (step === 0) return form.company_name.trim().length >= 2
    if (step === 1) return true // optional fields
    if (step === 2) {
      if (form.position_title === "Andere Position") return form.position_custom.trim().length >= 2
      return form.position_title.length > 0
    }
    return true
  })()

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#060b1a]">
        <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
      </div>
    )
  }

  // ── background blobs ──
  const bg = (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-violet-700/20 blur-[120px]" />
      <div className="absolute -bottom-40 -right-20 h-[500px] w-[500px] rounded-full bg-fuchsia-700/20 blur-[120px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[300px] rounded-full bg-indigo-700/10 blur-[100px]" />
    </div>
  )

  // ─── Step 0: Firmenname ───────────────────────────────────────────────────
  if (step === 0) {
    return (
      <div className="relative min-h-screen bg-[#060b1a] flex items-center justify-center px-4 py-16">
        {bg}
        <div
          className="relative z-10 w-full max-w-lg transition-all duration-220"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible
              ? "translateY(0)"
              : animDir === "forward"
              ? "translateY(16px)"
              : "translateY(-16px)",
          }}
        >
          <div className="flex flex-col items-center mb-8">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-[0_0_40px_rgba(139,92,246,0.5)]">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white text-center leading-tight">
              Willkommen bei<br />
              <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                Marketing Kreis
              </span>
            </h1>
            <p className="mt-3 text-center text-sm text-slate-400 max-w-xs">
              Lass uns dein Unternehmen einrichten. Das dauert weniger als 2 Minuten.
            </p>
          </div>

          <ProgressDots step={step} />
          <StepLabel current={step} total={TOTAL_STEPS} />

          <Card>
            <FieldLabel icon={<Building2 className="h-4 w-4" />}>
              Wie heißt dein Unternehmen?
            </FieldLabel>
            <GlassInput
              value={form.company_name}
              onChange={(v) => setForm((s) => ({ ...s, company_name: v }))}
              placeholder="z. B. Kaboom AG"
              required
            />
            <p className="mt-2 text-xs text-slate-500">
              Der Name kann später in den Einstellungen geändert werden.
            </p>
          </Card>

          <NavButtons
            step={step}
            onBack={handleBack}
            onNext={handleNext}
            canNext={canNext}
          />
        </div>
      </div>
    )
  }

  // ─── Step 1: Branche & Team ───────────────────────────────────────────────
  if (step === 1) {
    return (
      <div className="relative min-h-screen bg-[#060b1a] flex items-start justify-center px-4 py-16">
        {bg}
        <div
          className="relative z-10 w-full max-w-xl transition-all duration-220"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible
              ? "translateY(0)"
              : animDir === "forward"
              ? "translateY(16px)"
              : "translateY(-16px)",
          }}
        >
          <div className="flex flex-col items-center mb-8">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-[0_0_40px_rgba(139,92,246,0.5)]">
              <Briefcase className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white text-center">
              Branche & Team
            </h1>
            <p className="mt-2 text-center text-sm text-slate-400">
              Diese Infos helfen uns, die Plattform besser anzupassen.
            </p>
          </div>

          <ProgressDots step={step} />
          <StepLabel current={step} total={TOTAL_STEPS} />

          <div className="space-y-6">
            <Card>
              <FieldLabel icon={<Briefcase className="h-4 w-4" />}>
                In welcher Branche seid ihr tätig?
              </FieldLabel>
              <IndustryGrid
                value={form.industry}
                onChange={(v) => setForm((s) => ({ ...s, industry: v }))}
              />
            </Card>

            <Card>
              <FieldLabel icon={<Users className="h-4 w-4" />}>
                Wie groß ist euer Team?
              </FieldLabel>
              <PillSelect
                options={TEAM_SIZES}
                value={form.team_size as any}
                onChange={(v) => setForm((s) => ({ ...s, team_size: v }))}
              />
            </Card>

            <Card>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel icon={<MapPin className="h-4 w-4" />}>
                    Land
                  </FieldLabel>
                  <GlassInput
                    value={form.country}
                    onChange={(v) => setForm((s) => ({ ...s, country: v }))}
                    placeholder="z. B. Schweiz"
                  />
                </div>
                <div>
                  <FieldLabel icon={<Languages className="h-4 w-4" />}>
                    Sprache
                  </FieldLabel>
                  <PillSelect
                    options={LANGUAGES}
                    value={form.language as any}
                    onChange={(v) => setForm((s) => ({ ...s, language: v }))}
                  />
                </div>
              </div>
            </Card>
          </div>

          <NavButtons
            step={step}
            onBack={handleBack}
            onNext={handleNext}
            canNext={canNext}
          />
        </div>
      </div>
    )
  }

  // ─── Step 2: Deine Rolle ──────────────────────────────────────────────────
  if (step === 2) {
    return (
      <div className="relative min-h-screen bg-[#060b1a] flex items-start justify-center px-4 py-16">
        {bg}
        <div
          className="relative z-10 w-full max-w-xl transition-all duration-220"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible
              ? "translateY(0)"
              : animDir === "forward"
              ? "translateY(16px)"
              : "translateY(-16px)",
          }}
        >
          <div className="flex flex-col items-center mb-8">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-[0_0_40px_rgba(139,92,246,0.5)]">
              <UserRound className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white text-center">
              Deine Rolle
            </h1>
            <p className="mt-2 text-center text-sm text-slate-400">
              Was ist deine Position im Unternehmen?
            </p>
          </div>

          <ProgressDots step={step} />
          <StepLabel current={step} total={TOTAL_STEPS} />

          <Card>
            <FieldLabel icon={<UserRound className="h-4 w-4" />}>
              Position auswählen
            </FieldLabel>
            <PositionGrid
              value={form.position_title}
              onChange={(v) => setForm((s) => ({ ...s, position_title: v }))}
            />

            {form.position_title === "Andere Position" && (
              <div className="mt-4">
                <GlassInput
                  value={form.position_custom}
                  onChange={(v) => setForm((s) => ({ ...s, position_custom: v }))}
                  placeholder="Deine Position eingeben…"
                  required
                />
              </div>
            )}
          </Card>

          {error && (
            <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
              {error}
            </div>
          )}

          <NavButtons
            step={step}
            onBack={handleBack}
            onNext={handleFinish}
            nextLabel="Abschließen"
            canNext={canNext}
            loading={submitting}
          />
        </div>
      </div>
    )
  }

  // ─── Step 3: Fertig ───────────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen bg-[#060b1a] flex items-center justify-center px-4 py-16">
      {bg}
      <div
        className="relative z-10 w-full max-w-lg text-center transition-all duration-220"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "scale(1)" : "scale(0.96)",
        }}
      >
        {/* success ring */}
        <div className="relative mx-auto mb-8 flex h-24 w-24 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 opacity-20 blur-xl animate-pulse" />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-[0_0_60px_rgba(139,92,246,0.6)]">
            <Check className="h-11 w-11 text-white stroke-[2.5]" />
          </div>
        </div>

        <h1 className="text-4xl font-bold text-white mb-3">
          Alles bereit!
        </h1>
        <p className="text-slate-400 mb-2 text-base">
          <span className="font-semibold text-white">{form.company_name}</span> ist eingerichtet.
        </p>
        <p className="text-slate-500 text-sm mb-10 max-w-xs mx-auto">
          Dein Dashboard wartet auf dich. Starte jetzt mit dem Marketing.
        </p>

        <div className="grid grid-cols-3 gap-3 mb-10 max-w-sm mx-auto">
          {[
            { icon: <Building2 className="h-4 w-4" />, label: form.company_name },
            { icon: <Briefcase className="h-4 w-4" />, label: form.industry || "–" },
            { icon: <UserRound className="h-4 w-4" />, label: effectivePosition || "–" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex flex-col items-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 px-3 py-3"
            >
              <span className="text-violet-400">{item.icon}</span>
              <span className="text-xs text-slate-300 text-center font-medium leading-tight line-clamp-2">
                {item.label}
              </span>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => router.replace("/dashboard")}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-8 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(139,92,246,0.5)] hover:shadow-[0_0_36px_rgba(139,92,246,0.7)] hover:scale-[1.03] transition-all duration-200"
        >
          <Rocket className="h-4 w-4" />
          Zum Dashboard
        </button>
      </div>
    </div>
  )
}
