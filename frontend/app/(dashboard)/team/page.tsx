"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { GlassSelect } from "@/components/ui/glass-select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-auth"
import { authFetch } from "@/lib/api"
import { Mail, RefreshCw, Trash2, Users } from "lucide-react"

type InviteItem = {
  id: number
  email: string
  role: string
  section_permissions?: Record<string, boolean> | null
  expires_at?: string | null
  status: string
  invite_url?: string
}

const SECTION_KEYS = ["crm", "calendar", "activities", "performance", "budget", "content", "reports", "uploads"]

export default function TeamPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [items, setItems] = React.useState<InviteItem[]>([])
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [email, setEmail] = React.useState("")
  const [role, setRole] = React.useState("user")
  const [expiresMinutes, setExpiresMinutes] = React.useState("10080")
  const [sectionPermissions, setSectionPermissions] = React.useState<Record<string, boolean>>({})

  const isCompanyAdmin = user?.role === "owner" || user?.role === "admin"

  const loadInvites = React.useCallback(async () => {
    try {
      const res = await authFetch("/auth/invites", { method: "GET" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.detail || "Invites konnten nicht geladen werden")
      setItems((data?.items || []) as InviteItem[])
    } catch (e: any) {
      setError(e?.message || "Invites konnten nicht geladen werden")
    }
  }, [])

  React.useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace("/signup?mode=login&next=/team")
      return
    }
    if (!isCompanyAdmin) {
      router.replace("/dashboard")
      return
    }
    loadInvites()
  }, [loading, user, isCompanyAdmin, router, loadInvites])

  async function createInvite(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const res = await authFetch("/auth/invites", {
        method: "POST",
        body: JSON.stringify({
          email,
          role,
          expires_minutes: Number(expiresMinutes || 10080),
          section_permissions: sectionPermissions,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.detail || "Invite konnte nicht erstellt werden")
      setEmail("")
      setRole("user")
      setSectionPermissions({})
      await loadInvites()
      if (data?.invite_url) {
        try {
          await navigator.clipboard.writeText(String(data.invite_url))
        } catch {}
      }
    } catch (e: any) {
      setError(e?.message || "Invite konnte nicht erstellt werden")
    } finally {
      setBusy(false)
    }
  }

  async function revokeInvite(id: number) {
    setBusy(true)
    try {
      const res = await authFetch(`/auth/invites/${id}`, { method: "DELETE" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.detail || "Invite konnte nicht widerrufen werden")
      await loadInvites()
    } catch (e: any) {
      setError(e?.message || "Invite konnte nicht widerrufen werden")
    } finally {
      setBusy(false)
    }
  }

  async function resendInvite(id: number) {
    setBusy(true)
    try {
      const res = await authFetch(`/auth/invites/${id}/resend`, { method: "POST" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.detail || "Invite konnte nicht erneut gesendet werden")
      if (data?.invite_url) {
        try {
          await navigator.clipboard.writeText(String(data.invite_url))
        } catch {}
      }
      await loadInvites()
    } catch (e: any) {
      setError(e?.message || "Invite konnte nicht erneut gesendet werden")
    } finally {
      setBusy(false)
    }
  }

  if (loading || !user) {
    return <div className="p-8 text-sm text-slate-500">Lade…</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Users className="h-6 w-6 text-kaboom-red" />
          Team Invites
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Erstellen Sie E-Mail-Einladungen für Ihre Firma. Neue Nutzer werden automatisch derselben Organisation zugeordnet.
        </p>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Neue Einladung</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={createInvite}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@firma.ch" required />
              <GlassSelect
                value={role}
                onChange={(v) => setRole(v || "user")}
                options={[
                  ...(user.role === "owner" ? [{ value: "owner", label: "Owner" }, { value: "admin", label: "Admin" }] : []),
                  { value: "editor", label: "Editor" },
                  { value: "user", label: "User" },
                ]}
              />
              <Input value={expiresMinutes} onChange={(e) => setExpiresMinutes(e.target.value)} placeholder="10080" />
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {SECTION_KEYS.map((key) => (
                <label key={key} className="flex items-center justify-between rounded-xl border border-white/10 px-3 py-2 text-sm">
                  <span className="capitalize">{key}</span>
                  <Switch
                    checked={sectionPermissions[key] !== false}
                    onCheckedChange={(checked) =>
                      setSectionPermissions((prev) => ({
                        ...prev,
                        [key]: Boolean(checked),
                      }))
                    }
                  />
                </label>
              ))}
            </div>

            {error ? <div className="text-sm text-rose-500">{error}</div> : null}

            <Button disabled={busy}>
              {busy ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
              Einladung erstellen
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Einladungen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.length === 0 ? (
            <div className="text-sm text-slate-500">Noch keine Einladungen.</div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex flex-col gap-3 rounded-xl border border-white/10 p-4 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <div className="font-medium text-slate-900 dark:text-white">{item.email}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <Badge>{item.role}</Badge>
                    <Badge variant="outline">{item.status}</Badge>
                    <span>{item.expires_at ? new Date(item.expires_at).toLocaleString("de-DE") : "—"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => resendInvite(item.id)} disabled={busy}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => revokeInvite(item.id)} disabled={busy}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
