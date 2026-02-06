"use client"
import { Suspense, useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"

export const dynamic = "force-dynamic"

function VerifyInner() {
  const params = useSearchParams()
  const router = useRouter()
  const token = params?.get("token") || ""
  const [status, setStatus] = useState<"pending"|"ok"|"error">("pending")
  const [msg, setMsg] = useState<string>("")

  useEffect(() => {
    if (!token) { setStatus("error"); setMsg("Missing token"); return }
    ;(async () => {
      try {
        const res = await fetch(`/api/auth/verify?token=${encodeURIComponent(token)}`, { credentials: "include" })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) { setStatus("error"); setMsg(data?.detail || data?.error || "Verification failed"); return }
        setStatus("ok"); setMsg("Email confirmed. You can sign in now.")
        setTimeout(() => router.push("/signup?mode=login"), 1500)
      } catch (e: any) {
        setStatus("error"); setMsg(e?.message || "Unexpected error")
      }
    })()
  }, [token, router])

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-sm bg-white/10 dark:bg-slate-900/60 border border-white/20 dark:border-slate-700 rounded-2xl p-5 sm:p-6 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-lg sm:text-xl font-semibold">Email verification</h1>
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${
              status === "pending"
                ? "bg-slate-500/10 text-slate-200 border-slate-400/20"
                : status === "ok"
                  ? "bg-emerald-500/10 text-emerald-200 border-emerald-400/20"
                  : "bg-rose-500/10 text-rose-200 border-rose-400/20"
            }`}
          >
            {status === "pending" ? "Checking…" : status === "ok" ? "Verified" : "Error"}
          </span>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300 break-all">{msg || "Checking token..."}</p>
        {status === "ok" && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Redirecting…
          </p>
        )}
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-slate-500">Loading…</div>}>
      <VerifyInner />
    </Suspense>
  )
}





