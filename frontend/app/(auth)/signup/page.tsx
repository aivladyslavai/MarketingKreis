"use client"

import { Suspense, useState, useMemo, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Lock, Eye, EyeOff, UserPlus, Sparkles, CheckCircle2, XCircle, Info } from "lucide-react"

export const dynamic = "force-dynamic"

function SignupInner() {
  const params = useSearchParams() // Next.js guarantees this hook in app router
  const router = useRouter()

  // Signup state
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [capsLock, setCapsLock] = useState(false)

  // Login state
  const [mode, setMode] = useState<"signup" | "login">(() => {
    const m = params?.get("mode")
    return m === "login" ? "login" : "signup"
  })
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [loginError, setLoginError] = useState<string | null>(null)
  const [loginShowPassword, setLoginShowPassword] = useState(false)
  const [loginRemember, setLoginRemember] = useState(false)
  const [loginCapsLock, setLoginCapsLock] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)

  const token = params?.get("token") || ""

  useEffect(() => {
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem("mk_remember_email") : null
      if (saved) {
        setLoginEmail(saved)
        setLoginRemember(true)
      }
    } catch {
      // ignore
    }
  }, [])

  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: "", color: "" }
    let score = 0
    if (password.length >= 8) score++
    if (password.length >= 12) score++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
    if (/\d/.test(password)) score++
    if (/[^a-zA-Z0-9]/.test(password)) score++

    if (score <= 1) return { score, label: "Schwach", color: "bg-red-500" }
    if (score <= 2) return { score, label: "Mittel", color: "bg-amber-500" }
    if (score <= 3) return { score, label: "Gut", color: "bg-emerald-500" }
    return { score, label: "Stark", color: "bg-green-400" }
  }, [password])

  const passwordsMatch = password && confirmPassword && password === confirmPassword

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirmPassword) {
      setMessage("Passwörter stimmen nicht überein")
      setSuccess(false)
      return
    }
    setSubmitting(true)
    setMessage(null)
    setSuccess(false)
    try {
      const base = (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "https://kreismarketing-backend.onrender.com").replace(/\/$/, "")
      const url = `${base}/auth/register`
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, token }),
        credentials: "include",
        cache: "no-store",
        mode: "cors",
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setMessage(data?.detail || data?.error || "Fehler bei der Registrierung")
        setSuccess(false)
        return
      }
      setSuccess(true)
      setMessage("Konto erfolgreich erstellt! Sie können sich jetzt einloggen.")
      setMode("login")
      setLoginEmail(email)
      setPassword("")
      setConfirmPassword("")
    } catch (e: any) {
      setMessage(e?.message || "Ein unerwarteter Fehler ist aufgetreten")
      setSuccess(false)
    } finally {
      setSubmitting(false)
    }
  }

  async function onLoginSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoginError(null)
    setLoginLoading(true)
    try {
      // Use Next.js API proxy to avoid any direct browser CORS issues
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
        credentials: "include",
        cache: "no-store",
        mode: "cors",
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || "Login fehlgeschlagen")
      }
      try {
        if (loginRemember) {
          localStorage.setItem("mk_remember_email", loginEmail)
        } else {
          localStorage.removeItem("mk_remember_email")
        }
      } catch {
        // ignore
      }
      const next = params?.get("next")
      const redirectTo = next || res.headers.get("X-Redirect-To") || "/dashboard"
      router.push(redirectTo)
    } catch (e: any) {
      setLoginError(e?.message || "Login fehlgeschlagen")
    } finally {
      setLoginLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#060b1a]">
      {/* Animated background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] animate-pulse rounded-full bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 blur-3xl" />
        <div
          className="absolute -bottom-40 -left-40 h-[550px] w-[550px] animate-pulse rounded-full bg-gradient-to-tr from-cyan-600/15 to-blue-600/15 blur-3xl"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-gradient-to-r from-rose-500/10 to-orange-500/10 blur-3xl"
          style={{ animationDelay: "2s" }}
        />
      </div>

      {/* Grid overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-4xl items-center justify-center px-6 sm:px-8 py-12">
        <div className="w-full max-w-lg">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 p-3 backdrop-blur-sm">
              <Sparkles className="h-8 w-8 text-violet-400" />
            </div>
            <h1 className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
              Marketing Kreis
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Erstellen Sie Ihr Konto oder melden Sie sich an, um fortzufahren
            </p>
          </div>

          {/* Card */}
          <Card className="w-full border-slate-800/60 bg-slate-900/75 text-slate-200 shadow-2xl shadow-violet-500/5 backdrop-blur-xl rounded-3xl">
            <CardHeader className="space-y-1 px-5 sm:px-7 pt-5 pb-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    {mode === "signup" ? (
                      <>
                        <UserPlus className="h-5 w-5 text-violet-400" />
                        Registrieren
                      </>
                    ) : (
                      <>
                        <Lock className="h-5 w-5 text-violet-400" />
                        Einloggen
                      </>
                    )}
                  </CardTitle>
                  <p className="text-sm text-slate-400">
                    {mode === "signup"
                      ? "Füllen Sie das Formular aus, um ein Konto zu erstellen"
                      : "Melden Sie sich mit Ihrem bestehenden Konto an"}
                  </p>
                </div>
                <div className="inline-flex items-center rounded-full bg-slate-800/70 p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setMode("signup")}
                    className={`rounded-full px-3 py-1 transition-colors ${
                      mode === "signup" ? "bg-slate-900 text-slate-100" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Registrieren
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className={`rounded-full px-3 py-1 transition-colors ${
                      mode === "login" ? "bg-slate-900 text-slate-100" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Einloggen
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-5 sm:px-7 pb-6 sm:pb-7 pt-1">
              {/* Global messages */}
              {message && (
                <div
                  className={`mb-4 flex items-start gap-2 rounded-lg border p-3 text-sm ${
                    success
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                      : "border-red-500/30 bg-red-500/10 text-red-300"
                  }`}
                >
                  {success ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  ) : (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  )}
                  <span>{message}</span>
                </div>
              )}

              {mode === "signup" ? (
                <form onSubmit={onSubmit} className="space-y-4">
                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                      E-Mail-Adresse
                    </label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <Input
                        placeholder="name@beispiel.de"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-11 border-slate-700/50 bg-slate-800/50 pl-10 text-slate-200 placeholder:text-slate-500 transition-colors focus:border-violet-500/50 focus:ring-violet-500/20"
                        required
                        disabled={submitting}
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                      Passwort
                    </label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <Input
                        placeholder="Mindestens 8 Zeichen"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyUp={(e: any) => setCapsLock(Boolean(e.getModifierState && e.getModifierState("CapsLock")))}
                        className="h-11 border-slate-700/50 bg-slate-800/50 pl-10 pr-10 text-slate-200 placeholder:text-slate-500 transition-colors focus:border-violet-500/50 focus:ring-violet-500/20"
                        required
                        disabled={submitting}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-slate-300"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    {password && (
                      <div className="space-y-1.5">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <div
                              key={i}
                              className={`h-1 flex-1 rounded-full transition-colors ${
                                i <= passwordStrength.score ? passwordStrength.color : "bg-slate-700"
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-slate-500">
                          Passwortstärke:{" "}
                          <span
                            className={
                              passwordStrength.score >= 3
                                ? "text-emerald-400"
                                : passwordStrength.score >= 2
                                ? "text-amber-400"
                                : "text-red-400"
                            }
                          >
                            {passwordStrength.label}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                      Passwort bestätigen
                    </label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <Input
                        placeholder="Passwort wiederholen"
                        type={showConfirm ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`h-11 border-slate-700/50 bg-slate-800/50 pl-10 pr-10 text-slate-200 placeholder:text-slate-500 transition-colors focus:border-violet-500/50 focus:ring-violet-500/20 ${
                          confirmPassword && (passwordsMatch ? "border-emerald-500/50" : "border-red-500/50")
                        }`}
                        required
                        disabled={submitting}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-slate-300"
                      >
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {confirmPassword && !passwordsMatch && (
                      <p className="text-xs text-red-400">Passwörter stimmen nicht überein</p>
                    )}
                    {passwordsMatch && (
                      <p className="flex items-center gap-1 text-xs text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" /> Passwörter stimmen überein
                      </p>
                    )}
                  </div>

                  {capsLock && (
                    <div className="flex items-center gap-2 text-xs text-amber-400">
                      <Info className="h-3.5 w-3.5" />
                      <span>Caps Lock ist aktiviert</span>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={submitting || !passwordsMatch}
                    className="h-11 w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-violet-500/40 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting ? (
                      <span className="inline-flex items-center gap-2">
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25" />
                          <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" fill="none" />
                        </svg>
                        Wird erstellt...
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        <UserPlus className="h-4 w-4" />
                        Konto erstellen
                      </span>
                    )}
                  </Button>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-700/50" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-slate-900/70 px-3 text-slate-500">oder</span>
                    </div>
                  </div>

                  <div className="text-center">
                    <p className="text-sm text-slate-400">
                      Sie haben bereits ein Konto?{" "}
                      <button
                        type="button"
                        onClick={() => setMode("login")}
                        className="font-medium text-violet-400 transition-colors hover:text-violet-300"
                      >
                        Jetzt anmelden
                      </button>
                    </p>
                  </div>

                  <p className="pt-4 text-center text-xs text-slate-500">
                    Mit der Registrierung stimmen Sie unseren{" "}
                    <Link href="#" className="transition-colors underline hover:text-slate-300">
                      AGB
                    </Link>{" "}
                    und der{" "}
                    <Link href="#" className="transition-colors underline hover:text-slate-300">
                      Datenschutzerklärung
                    </Link>{" "}
                    zu.
                  </p>
                </form>
              ) : (
                <form onSubmit={onLoginSubmit} className="space-y-4">
                  {loginError && (
                    <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                      {loginError}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                      E-Mail-Adresse
                    </label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <Input
                        placeholder="name@beispiel.de"
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="h-11 border-slate-700/50 bg-slate-800/50 pl-10 text-slate-200 placeholder:text-slate-500 transition-colors focus:border-violet-500/50 focus:ring-violet-500/20"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                      Passwort
                    </label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <Input
                        placeholder="Ihr Passwort"
                        type={loginShowPassword ? "text" : "password"}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        onKeyUp={(e: any) =>
                          setLoginCapsLock(Boolean(e.getModifierState && e.getModifierState("CapsLock")))
                        }
                        className="h-11 border-slate-700/50 bg-slate-800/50 pl-10 pr-10 text-slate-200 placeholder:text-slate-500 transition-colors focus:border-violet-500/50 focus:ring-violet-500/20"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setLoginShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-slate-300"
                      >
                        {loginShowPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    {loginCapsLock && (
                      <div className="flex items-center gap-2 text-xs text-amber-400">
                        <Info className="h-3.5 w-3.5" />
                        <span>Caps Lock ist aktiviert</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={loginRemember}
                        onChange={(e) => setLoginRemember(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-600 bg-slate-900"
                      />
                      <span>Eingeloggt bleiben</span>
                    </label>
                    <button
                      type="button"
                      className="text-slate-300 hover:text-white"
                      onClick={() =>
                        alert("Passwort-Zurücksetzen ist noch nicht konfiguriert. Bitte wenden Sie sich an den Support.")
                      }
                    >
                      Passwort vergessen?
                    </button>
                  </div>

                  <Button
                    type="submit"
                    disabled={loginLoading}
                    className="h-11 w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-violet-500/40 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loginLoading ? (
                      <span className="inline-flex items-center gap-2">
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25" />
                          <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" fill="none" />
                        </svg>
                        Wird eingeloggt...
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2">Einloggen</span>
                    )}
                  </Button>

                  <div className="text-center">
                    <p className="text-sm text-slate-400">
                      Noch kein Konto?{" "}
                      <button
                        type="button"
                        onClick={() => setMode("signup")}
                        className="font-medium text-violet-400 transition-colors hover:text-violet-300"
                      >
                        Jetzt registrieren
                      </button>
                    </p>
                  </div>

                  <p className="pt-4 text-center text-xs text-slate-500">
                    Mit der Anmeldung stimmen Sie unseren{" "}
                    <Link href="#" className="transition-colors underline hover:text-slate-300">
                      AGB
                    </Link>{" "}
                    und der{" "}
                    <Link href="#" className="transition-colors underline hover:text-slate-300">
                      Datenschutzerklärung
                    </Link>{" "}
                    zu.
                  </p>
                </form>
              )}
            </CardContent>
          </Card>

          <p className="mt-8 text-center text-xs text-slate-600">
            © {new Date().getFullYear()} Marketing Kreis. Alle Rechte vorbehalten.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#060b1a]">
          <div className="flex items-center gap-2 text-slate-400">
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25" />
              <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" fill="none" />
            </svg>
            <span>Laden...</span>
          </div>
        </div>
      }
    >
      <SignupInner />
    </Suspense>
  )
}



