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
      router.push("/signup?mode=login")
      return
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [status, countdown, router])

  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden bg-[#060b1a] flex items-center justify-center px-4">
      {/* Animated background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="absolute -bottom-32 -right-32 h-[400px] w-[400px] rounded-full bg-cyan-500/8 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[300px] rounded-full bg-fuchsia-500/6 blur-[80px]" />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(148,163,184,1) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo / brand */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-500/30">
            <Mail className="h-7 w-7 text-white" />
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold tracking-tight text-white">Marketing Kreis</div>
            <div className="mt-1 text-sm text-slate-500">E‑Mail Bestätigung</div>
          </div>
        </div>

        {/* Card */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-800/60 bg-slate-900/75 p-6 shadow-2xl shadow-violet-500/5 backdrop-blur-xl sm:p-8">
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
                <div className="absolute inset-0 animate-ping rounded-full bg-violet-500/15" style={{ animationDuration: "1.5s" }} />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 ring-1 ring-violet-500/30">
                  <Loader2 className="h-9 w-9 animate-spin text-violet-400" />
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
                <h2 className="bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-xl font-bold text-transparent">
                  E‑Mail bestätigt!
                </h2>
                <p className="mt-2 text-sm text-slate-400">{msg}</p>
              </div>

              {/* Countdown + progress bar */}
              <div className="w-full rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Weiterleitung zum Login…</span>
                  <span className="text-sm font-semibold tabular-nums text-violet-300">{countdown}s</span>
                </div>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-1000"
                    style={{ width: `${((3 - countdown) / 3) * 100}%` }}
                  />
                </div>
              </div>

              <button
                onClick={() => router.push("/signup?mode=login")}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-violet-500/40 active:scale-[0.98]"
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
        <div className="flex min-h-[100dvh] items-center justify-center bg-[#060b1a]">
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
