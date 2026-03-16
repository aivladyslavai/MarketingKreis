"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2, Building2, UserRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"
import { authFetch } from "@/lib/api"

export const dynamic = "force-dynamic"

export default function OnboardingPage() {
  const router = useRouter()
  const { user, loading, refetch } = useAuth()
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [form, setForm] = React.useState({
    company_name: "",
    industry: "",
    team_size: "",
    country: "",
    language: "de",
    position_title: "",
  })

  React.useEffect(() => {
    if (!user) return
    setForm({
      company_name: user.organization?.name || "",
      industry: user.organization?.industry || "",
      team_size: user.organization?.team_size || "",
      country: user.organization?.country || "",
      language: user.organization?.language || "de",
      position_title: user.position_title || "",
    })
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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await authFetch("/auth/onboarding/company", {
        method: "PATCH",
        body: JSON.stringify(form),
      })
      const text = await res.text()
      const data = text ? JSON.parse(text) : {}
      if (!res.ok) throw new Error(data?.detail || "Onboarding konnte nicht gespeichert werden")
      await refetch()
      router.replace("/dashboard")
    } catch (e: any) {
      setError(e?.message || "Onboarding konnte nicht gespeichert werden")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#060b1a] text-slate-200">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#060b1a] px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600">
            <Building2 className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Unternehmen einrichten</h1>
          <p className="mt-2 text-sm text-slate-400">
            Bestätigt. Jetzt noch kurz Firma und Ihre Rolle vervollständigen.
          </p>
        </div>

        <Card className="border-white/10 bg-slate-900/80 text-white">
          <CardHeader>
            <CardTitle>Company Onboarding</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={onSubmit}>
              <label className="md:col-span-2 space-y-2">
                <span className="text-sm text-slate-300">Firmenname</span>
                <Input
                  value={form.company_name}
                  onChange={(e) => setForm((s) => ({ ...s, company_name: e.target.value }))}
                  placeholder="Kaboom AG"
                  required
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm text-slate-300">Branche</span>
                <Input value={form.industry} onChange={(e) => setForm((s) => ({ ...s, industry: e.target.value }))} />
              </label>
              <label className="space-y-2">
                <span className="text-sm text-slate-300">Teamgröße</span>
                <Input value={form.team_size} onChange={(e) => setForm((s) => ({ ...s, team_size: e.target.value }))} placeholder="1-10" />
              </label>
              <label className="space-y-2">
                <span className="text-sm text-slate-300">Land</span>
                <Input value={form.country} onChange={(e) => setForm((s) => ({ ...s, country: e.target.value }))} placeholder="Schweiz" />
              </label>
              <label className="space-y-2">
                <span className="text-sm text-slate-300">Sprache</span>
                <Input value={form.language} onChange={(e) => setForm((s) => ({ ...s, language: e.target.value }))} placeholder="de" />
              </label>
              <label className="md:col-span-2 space-y-2">
                <span className="text-sm text-slate-300 flex items-center gap-2">
                  <UserRound className="h-4 w-4" />
                  Ihre Position
                </span>
                <Input
                  value={form.position_title}
                  onChange={(e) => setForm((s) => ({ ...s, position_title: e.target.value }))}
                  placeholder="Geschäftsführer, Head of Marketing ..."
                  required
                />
              </label>
              {error ? <div className="md:col-span-2 text-sm text-rose-400">{error}</div> : null}
              <div className="md:col-span-2 flex justify-end">
                <Button disabled={submitting}>
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Weiter zum Dashboard
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
