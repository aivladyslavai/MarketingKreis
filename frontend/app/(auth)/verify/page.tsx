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
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white/10 dark:bg-slate-900/60 border border-white/20 dark:border-slate-700 rounded-xl p-6 space-y-3">
        <h1 className="text-xl font-semibold">Email verification</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 break-all">{msg || "Checking token..."}</p>
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





