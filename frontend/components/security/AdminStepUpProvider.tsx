"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FormField } from "@/components/ui/form-field"
import { Shield, KeyRound } from "lucide-react"
import { requestLocal } from "@/lib/api"

const MK_ADMIN_STEPUP_EVENT = "mk:admin-stepup-required"

type StepUpEventDetail = {
  message?: string
  resolve: () => void
  reject: (err: any) => void
}

export function AdminStepUpProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  const [message, setMessage] = React.useState<string>("")
  const [code, setCode] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const pendingRef = React.useRef<StepUpEventDetail | null>(null)

  React.useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<StepUpEventDetail>
      if (!ce.detail) return
      pendingRef.current = ce.detail
      setMessage(String(ce.detail.message || "Für diese Aktion ist eine 2FA-Bestätigung erforderlich."))
      setError(null)
      setCode("")
      setOpen(true)
    }
    window.addEventListener(MK_ADMIN_STEPUP_EVENT, handler as any)
    return () => window.removeEventListener(MK_ADMIN_STEPUP_EVENT, handler as any)
  }, [])

  const close = (cancelled: boolean) => {
    setOpen(false)
    setLoading(false)
    setError(null)
    setCode("")
    const pending = pendingRef.current
    pendingRef.current = null
    if (cancelled && pending) {
      try {
        pending.reject(new Error("2FA step-up cancelled"))
      } catch {}
    }
  }

  return (
    <>
      {children}
      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!v) close(true)
        }}
      >
        <DialogContent className="w-full sm:w-[460px]">
          <DialogHeader>
            <DialogTitle>
              <span className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-emerald-300" />
                Admin‑Aktion bestätigen (2FA)
              </span>
            </DialogTitle>
            <DialogDescription>
              {message || "Bitte gib deinen 6‑stelligen Code (oder Recovery Code) ein, um fortzufahren."}
            </DialogDescription>
          </DialogHeader>

          {error ? (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-[11px] text-rose-100">
              {error}
            </div>
          ) : null}

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-start gap-3">
              <KeyRound className="h-5 w-5 text-slate-200 mt-0.5" />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-100">2FA Code</div>
                <div className="mt-1 text-[11px] text-slate-400">
                  Wenn du „Invalid code“ bekommst, warte 10–30 Sekunden und versuch es nochmal.
                </div>
              </div>
            </div>
            <div className="mt-3">
              <FormField id="admin-stepup-code" label="Code oder Recovery Code" required>
                {({ describedBy, invalid }) => (
                  <Input
                    id="admin-stepup-code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="123456"
                    inputMode="numeric"
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    autoFocus
                  />
                )}
              </FormField>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className="h-10 border-white/20 text-slate-200"
              onClick={() => close(true)}
              disabled={loading}
            >
              Abbrechen
            </Button>
            <Button
              className="h-10 bg-emerald-500/90 hover:bg-emerald-500 text-white"
              onClick={async () => {
                const pending = pendingRef.current
                if (!pending) return
                try {
                  setLoading(true)
                  setError(null)
                  await requestLocal("/api/auth/2fa/stepup", {
                    method: "POST",
                    body: JSON.stringify({ code }),
                  })
                  pending.resolve()
                  close(false)
                } catch (e: any) {
                  setError(e?.message || "2FA Bestätigung fehlgeschlagen")
                } finally {
                  setLoading(false)
                }
              }}
              disabled={!code || loading}
            >
              Bestätigen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

