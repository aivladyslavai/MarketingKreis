"use client"
import { Suspense, useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { CheckCircle2, XCircle, Loader2, ArrowRight, Mail } from "lucide-react"

export const dynamic = "force-dynamic"

function VerifyInner() {
  const params = useSearchParams()
  const router = useRouter()
  const token = params?.get("token") || ""
  const [status, setStatus] = useState<"pending" | "ok" | "error">("pending")
  const [msg, setMsg] = useState<string>("")
  const [countdown, setCountdown] = useState(3)
  const [redirectTo, setRedirectTo] = useState("/signup?mode=login")

  useEffect(() => {
    if (!token) {
      setStatus("error")
      setMsg("Kein Token gefunden. Bitte den Link aus der E‑Mail erneut öffnen.")
      return
    }
    ;(async () => {
      try {
        const res = await fetch(`/api/auth/verify?token=${encodeURIComponent(token)}`, {
          credentials: "include",
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          setStatus("error")
          setMsg(data?.detail || data?.error || "Verifizierung fehlgeschlagen.")
          return
        }
        setStatus("ok")
        setMsg("Ihre E‑Mail wurde erfolgreich bestätigt.")
        setRedirectTo(String(data?.redirect_to || res.headers.get("X-Redirect-To") || "/onboarding"))
      } catch (e: any) {
        setStatus("error")
        setMsg(e?.message || "Ein unerwarteter Fehler ist aufgetreten.")
      }
    })()
  }, [token, router])

  // Countdown redirect on success
  useEffect(() => {
    if (status !== "ok") return
    if (countdown <= 0) {
      router.push(redirectTo)
      return
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [status, countdown, router, redirectTo])

  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden bg-kaboom-black text-slate-100 flex items-center justify-center px-4">
      <div className="kaboom-brand-band absolute top-0 left-0 right-0 z-20" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-kaboom-red/10 blur-[120px]" />
        <div className="absolute -bottom-32 -right-32 h-[400px] w-[400px] rounded-full bg-kaboom-red/5 blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo / brand */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="inline-flex items-center justify-center rounded-md bg-kaboom-white px-3 py-1.5 font-display font-extrabold text-kaboom-black tracking-tight text-base">
            KA<span className="text-kaboom-red">·</span>BOOM
          </div>
          <div className="text-center">
            <div className="font-display text-2xl font-extrabold tracking-tight text-white">
              Marketing<span className="text-kaboom-red">Kreis</span>
            </div>
            <div className="mt-1 text-sm text-slate-500">E‑Mail Bestätigung</div>
          </div>
        </div>

        {/* Card */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-kaboom-black/80 p-6 shadow-2xl shadow-kaboom-red/10 backdrop-blur-xl sm:p-8">
          {/* Decorative glow */}
          {status === "ok" && (
            <div className="pointer-events-none absolute -top-16 -right-16 h-32 w-32 animate-pulse rounded-full bg-emerald-500/20 blur-3xl" />
          )}
          {status === "error" && (
            <div className="pointer-events-none absolute -top-16 -left-16 h-32 w-32 animate-pulse rounded-full bg-rose-500/20 blur-3xl" />
          )}

          {/* Pending state */}
          {status === "pending" && (
            <div className="flex flex-col items-center gap-5 py-4">
              <div className="relative flex h-20 w-20 items-center justify-center">
                <div className="absolute inset-0 animate-ping rounded-full bg-kaboom-red/20" style={{ animationDuration: "1.5s" }} />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-kaboom-red/15 ring-1 ring-kaboom-red/30">
                  <Loader2 className="h-9 w-9 animate-spin text-kaboom-red" />
                </div>
              </div>
              <div className="text-center">
                <h2 className="text-xl font-bold text-white">Token wird geprüft…</h2>
                <p className="mt-2 text-sm text-slate-400">Bitte einen Moment warten.</p>
              </div>
            </div>
          )}

          {/* Success state */}
          {status === "ok" && (
            <div className="flex flex-col items-center gap-5 py-4">
              <div className="relative flex h-20 w-20 items-center justify-center">
                <div className="absolute inset-0 animate-ping rounded-full bg-emerald-500/20" style={{ animationDuration: "2s" }} />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 ring-1 ring-emerald-500/30">
                  <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                </div>
              </div>
              <div className="text-center">
                <h2 className="font-display text-xl font-extrabold tracking-tight text-white">
                  E‑Mail bestätigt!
                </h2>
                <p className="mt-2 text-sm text-slate-400">{msg}</p>
              </div>

              {/* Countdown + progress bar */}
              <div className="w-full rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Weiterleitung…</span>
                  <span className="text-sm font-semibold tabular-nums text-kaboom-red">{countdown}s</span>
                </div>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-kaboom-red transition-all duration-1000"
                    style={{ width: `${((3 - countdown) / 3) * 100}%` }}
                  />
                </div>
              </div>

              <button
                onClick={() => router.push(redirectTo)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-kaboom-red py-3 text-sm font-semibold text-white shadow-lg shadow-kaboom-red/30 transition-all hover:bg-kaboom-red-dark hover:shadow-kaboom-red/50 active:scale-[0.98]"
              >
                Jetzt einloggen
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Error state */}
          {status === "error" && (
            <div className="flex flex-col items-center gap-5 py-4">
              <div className="relative flex h-20 w-20 items-center justify-center">
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-rose-500/20 to-rose-600/10 ring-1 ring-rose-500/30">
                  <XCircle className="h-10 w-10 text-rose-400" />
                </div>
              </div>
              <div className="text-center">
                <h2 className="text-xl font-bold text-white">Verifizierung fehlgeschlagen</h2>
                <p className="mt-2 text-sm text-slate-400">{msg}</p>
              </div>

              <div className="w-full rounded-2xl border border-rose-500/15 bg-rose-500/[0.06] p-4">
                <p className="text-xs leading-relaxed text-rose-300/80">
                  Der Link ist möglicherweise abgelaufen (72 Stunden) oder wurde bereits verwendet.
                  Bitte fordern Sie einen neuen Bestätigungs‑Link an.
                </p>
              </div>

              <button
                onClick={() => router.push("/signup?mode=login")}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] py-3 text-sm font-semibold text-slate-200 transition-all hover:bg-white/[0.08] hover:text-white active:scale-[0.98]"
              >
                Zurück zum Login
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-700">
          © {new Date().getFullYear()} Marketing Kreis. Alle Rechte vorbehalten.
        </p>
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[100dvh] items-center justify-center bg-kaboom-black">
          <div className="flex items-center gap-2 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Laden…</span>
          </div>
        </div>
      }
    >
      <VerifyInner />
    </Suspense>
  )
}
