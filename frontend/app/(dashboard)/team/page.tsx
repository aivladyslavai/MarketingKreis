"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Mail, RefreshCw, Trash2, Users, Shield, Crown,
  Pencil, UserRound, Copy, Check, Clock, XCircle,
  CheckCircle2, AlertCircle, Send, Plus, ChevronDown,
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { authFetch } from "@/lib/api"
import { cn } from "@/lib/utils"

// ─── types ───────────────────────────────────────────────────────────────────

type InviteItem = {
  id: number
  email: string
  role: string
  section_permissions?: Record<string, boolean> | null
  expires_at?: string | null
  status: "active" | "accepted" | "expired" | "revoked" | string
  invite_url?: string
}

// ─── constants ───────────────────────────────────────────────────────────────

const SECTION_KEYS = ["crm", "calendar", "activities", "performance", "budget", "content", "reports", "uploads"]

const SECTION_META: Record<string, { label: string; icon: string }> = {
  crm: { label: "CRM", icon: "🏢" },
  calendar: { label: "Kalender", icon: "📅" },
  activities: { label: "Aktivitäten", icon: "⚡" },
  performance: { label: "Performance", icon: "📈" },
  budget: { label: "Budget", icon: "💰" },
  content: { label: "Content", icon: "✍️" },
  reports: { label: "Reports", icon: "📊" },
  uploads: { label: "Uploads", icon: "📁" },
}

const EXPIRES_OPTIONS = [
  { value: "1440", label: "1 Tag" },
  { value: "4320", label: "3 Tage" },
  { value: "10080", label: "7 Tage" },
  { value: "20160", label: "14 Tage" },
  { value: "43200", label: "30 Tage" },
]

// ─── sub-components ───────────────────────────────────────────────────────────

function RoleCard({
  value,
  role,
  label,
  icon,
  description,
  available,
  onClick,
}: {
  value: string
  role: string
  label: string
  icon: React.ReactNode
  description: string
  available: boolean
  onClick: () => void
}) {
  const active = role === value
  if (!available) return null
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-start gap-1.5 rounded-2xl border p-4 text-left transition-all duration-200",
        active
          ? "border-violet-500 bg-violet-500/15 shadow-[0_0_20px_rgba(139,92,246,0.2)]"
          : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8"
      )}
    >
      {active && (
        <div className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-violet-500">
          <Check className="h-3 w-3 text-white" />
        </div>
      )}
      <span className={cn("text-xl", active ? "text-violet-300" : "text-slate-400")}>{icon}</span>
      <span className={cn("text-sm font-semibold", active ? "text-violet-200" : "text-slate-200")}>{label}</span>
      <span className="text-xs text-slate-500 leading-snug">{description}</span>
    </button>
  )
}

function SectionToggle({
  sectionKey,
  checked,
  onChange,
}: {
  sectionKey: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  const meta = SECTION_META[sectionKey] ?? { label: sectionKey, icon: "•" }
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm transition-all duration-200",
        checked
          ? "border-violet-500/50 bg-violet-500/10 text-violet-200"
          : "border-white/10 bg-white/5 text-slate-500 hover:border-white/20"
      )}
    >
      <span className="flex items-center gap-2">
        <span className="text-base">{meta.icon}</span>
        <span className="font-medium">{meta.label}</span>
      </span>
      <span
        className={cn(
          "relative ml-3 inline-flex h-5 w-9 flex-shrink-0 rounded-full transition-colors duration-200",
          checked ? "bg-violet-500" : "bg-white/15"
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 translate-y-0.5 rounded-full bg-white shadow transition-transform duration-200",
            checked ? "translate-x-4.5" : "translate-x-0.5"
          )}
          style={{ transform: `translateX(${checked ? "18px" : "2px"}) translateY(2px)` }}
        />
      </span>
    </button>
  )
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
    active: {
      label: "Aktiv",
      icon: <CheckCircle2 className="h-3 w-3" />,
      cls: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    },
    accepted: {
      label: "Angenommen",
      icon: <Check className="h-3 w-3" />,
      cls: "border-blue-500/30 bg-blue-500/10 text-blue-400",
    },
    expired: {
      label: "Abgelaufen",
      icon: <Clock className="h-3 w-3" />,
      cls: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    },
    revoked: {
      label: "Widerrufen",
      icon: <XCircle className="h-3 w-3" />,
      cls: "border-rose-500/30 bg-rose-500/10 text-rose-400",
    },
  }
  const { label, icon, cls } = cfg[status] ?? {
    label: status,
    icon: <AlertCircle className="h-3 w-3" />,
    cls: "border-white/20 bg-white/5 text-slate-400",
  }
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium", cls)}>
      {icon}
      {label}
    </span>
  )
}

function RoleBadge({ role }: { role: string }) {
  const cfg: Record<string, { icon: React.ReactNode; cls: string }> = {
    owner: { icon: <Crown className="h-3 w-3" />, cls: "border-amber-500/30 bg-amber-500/10 text-amber-300" },
    admin: { icon: <Shield className="h-3 w-3" />, cls: "border-violet-500/30 bg-violet-500/10 text-violet-300" },
    editor: { icon: <Pencil className="h-3 w-3" />, cls: "border-blue-500/30 bg-blue-500/10 text-blue-300" },
    user: { icon: <UserRound className="h-3 w-3" />, cls: "border-white/20 bg-white/5 text-slate-400" },
  }
  const { icon, cls } = cfg[role] ?? cfg["user"]
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize", cls)}>
      {icon}
      {role}
    </span>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false)
  return (
    <button
      type="button"
      title="Link kopieren"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setCopied(true)
          setTimeout(() => setCopied(false), 1800)
        } catch {}
      }}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:border-white/25 hover:text-slate-200 transition-all"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  )
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function TeamPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  const [items, setItems] = React.useState<InviteItem[]>([])
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null)
  const [lastInviteUrl, setLastInviteUrl] = React.useState<string | null>(null)

  // form
  const [email, setEmail] = React.useState("")
  const [role, setRole] = React.useState("user")
  const [expiresMinutes, setExpiresMinutes] = React.useState("10080")
  const [sectionPermissions, setSectionPermissions] = React.useState<Record<string, boolean>>({})
  const [formOpen, setFormOpen] = React.useState(true)

  const isOwner = user?.role === "owner"
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
    if (!user) { router.replace("/signup?mode=login&next=/team"); return }
    if (!isCompanyAdmin) { router.replace("/dashboard"); return }
    loadInvites()
  }, [loading, user, isCompanyAdmin, router, loadInvites])

  function flash(msg: string) {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(null), 3000)
  }

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
        setLastInviteUrl(String(data.invite_url))
        try { await navigator.clipboard.writeText(String(data.invite_url)) } catch {}
        flash("Einladung erstellt – Link in Zwischenablage kopiert ✓")
      } else {
        setLastInviteUrl(null)
        flash("Einladung erfolgreich erstellt ✓")
      }
    } catch (e: any) {
      setError(e?.message || "Invite konnte nicht erstellt werden")
    } finally {
      setBusy(false)
    }
  }

  async function revokeInvite(id: number) {
    if (!confirm("Einladung wirklich widerrufen?")) return
    setBusy(true)
    try {
      const res = await authFetch(`/auth/invites/${id}`, { method: "DELETE" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.detail || "Widerruf fehlgeschlagen")
      await loadInvites()
      flash("Einladung widerrufen")
    } catch (e: any) {
      setError(e?.message)
    } finally {
      setBusy(false)
    }
  }

  async function resendInvite(id: number) {
    setBusy(true)
    try {
      const res = await authFetch(`/auth/invites/${id}/resend`, { method: "POST" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.detail || "Erneutes Senden fehlgeschlagen")
      if (data?.invite_url) {
        try { await navigator.clipboard.writeText(String(data.invite_url)) } catch {}
        flash("Einladung erneut gesendet – Link kopiert ✓")
      } else {
        flash("Einladung erneut gesendet ✓")
      }
      await loadInvites()
    } catch (e: any) {
      setError(e?.message)
    } finally {
      setBusy(false)
    }
  }

  const toggleSection = (key: string, val: boolean) =>
    setSectionPermissions((p) => ({ ...p, [key]: val }))

  const toggleAll = (val: boolean) =>
    setSectionPermissions(Object.fromEntries(SECTION_KEYS.map((k) => [k, val])))

  const allEnabled = SECTION_KEYS.every((k) => sectionPermissions[k] !== false)
  const noneEnabled = SECTION_KEYS.every((k) => sectionPermissions[k] === false)

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center py-32">
        <RefreshCw className="h-5 w-5 animate-spin text-violet-400" />
      </div>
    )
  }

  const activeItems = items.filter((i) => i.status === "active")
  const otherItems = items.filter((i) => i.status !== "active")

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-1 py-2">

      {/* ── header ── */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-[0_0_24px_rgba(139,92,246,0.4)]">
          <Users className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Team & Einladungen</h1>
          <p className="mt-0.5 text-sm text-slate-400">
            Lade Mitglieder ein – sie werden automatisch deiner Organisation zugeordnet.
          </p>
        </div>
      </div>

      {/* ── global flash ── */}
      {successMsg && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          {successMsg}
        </div>
      )}

      {/* ── form card ── */}
      <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl overflow-hidden">
        {/* card header / toggle */}
        <button
          type="button"
          onClick={() => setFormOpen((v) => !v)}
          className="flex w-full items-center justify-between px-7 py-5 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500/20">
              <Plus className="h-4 w-4 text-violet-400" />
            </div>
            <span className="text-base font-semibold text-white">Neue Einladung</span>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-slate-400 transition-transform duration-300",
              formOpen ? "rotate-180" : "rotate-0"
            )}
          />
        </button>

        {formOpen && (
          <form onSubmit={createInvite} className="border-t border-white/10 px-7 pb-7 pt-6 space-y-7">

            {/* email */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300">
                <Mail className="h-4 w-4 text-violet-400" />
                E-Mail-Adresse
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@firma.ch"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/60 focus:border-violet-500/50 transition-all"
              />
            </div>

            {/* role */}
            <div>
              <label className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-300">
                <Shield className="h-4 w-4 text-violet-400" />
                Rolle
              </label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <RoleCard value="owner" role={role} label="Owner" icon={<Crown className="h-5 w-5" />} description="Voller Zugriff" available={isOwner} onClick={() => setRole("owner")} />
                <RoleCard value="admin" role={role} label="Admin" icon={<Shield className="h-5 w-5" />} description="Team verwalten" available={isOwner} onClick={() => setRole("admin")} />
                <RoleCard value="editor" role={role} label="Editor" icon={<Pencil className="h-5 w-5" />} description="Inhalte bearbeiten" available={true} onClick={() => setRole("editor")} />
                <RoleCard value="user" role={role} label="User" icon={<UserRound className="h-5 w-5" />} description="Nur lesen" available={true} onClick={() => setRole("user")} />
              </div>
            </div>

            {/* section permissions */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                  <span className="text-violet-400">🔒</span>
                  Bereichszugriff
                </label>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => toggleAll(true)} className={cn("text-xs px-2.5 py-1 rounded-lg border transition-all", allEnabled ? "border-violet-500/50 bg-violet-500/15 text-violet-300" : "border-white/10 text-slate-500 hover:text-slate-300")}>Alle</button>
                  <button type="button" onClick={() => toggleAll(false)} className={cn("text-xs px-2.5 py-1 rounded-lg border transition-all", noneEnabled ? "border-rose-500/40 bg-rose-500/10 text-rose-400" : "border-white/10 text-slate-500 hover:text-slate-300")}>Keine</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {SECTION_KEYS.map((k) => (
                  <SectionToggle
                    key={k}
                    sectionKey={k}
                    checked={sectionPermissions[k] !== false}
                    onChange={(v) => toggleSection(k, v)}
                  />
                ))}
              </div>
            </div>

            {/* expires */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300">
                <Clock className="h-4 w-4 text-violet-400" />
                Link gültig für
              </label>
              <div className="flex flex-wrap gap-2">
                {EXPIRES_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setExpiresMinutes(o.value)}
                    className={cn(
                      "rounded-xl border px-3.5 py-2 text-sm font-medium transition-all",
                      expiresMinutes === o.value
                        ? "border-violet-500 bg-violet-500/20 text-violet-200 shadow-[0_0_12px_rgba(139,92,246,0.3)]"
                        : "border-white/10 bg-white/5 text-slate-400 hover:border-white/25 hover:text-slate-200"
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {lastInviteUrl && (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" />
                  Einladungslink zum manuellen Versenden
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    readOnly
                    value={lastInviteUrl}
                    className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-200 outline-none"
                  />
                  <div className="flex items-center gap-2">
                    <CopyButton text={lastInviteUrl} />
                    <a
                      href={lastInviteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-300 transition-all hover:border-white/20 hover:text-white"
                    >
                      Öffnen
                    </a>
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Den Link kannst du direkt selbst per Mail, Slack oder WhatsApp verschicken.
                </p>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={busy}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold transition-all duration-200",
                  !busy
                    ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:shadow-[0_0_28px_rgba(139,92,246,0.6)] hover:scale-[1.02]"
                    : "bg-white/10 text-slate-500 cursor-not-allowed"
                )}
              >
                {busy
                  ? <RefreshCw className="h-4 w-4 animate-spin" />
                  : <Send className="h-4 w-4" />
                }
                Einladung erstellen
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ── invite list ── */}
      <div className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-slate-500">
          <span className="h-px flex-1 bg-white/10" />
          Einladungen ({items.length})
          <span className="h-px flex-1 bg-white/10" />
        </h2>

        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-3xl border border-white/10 bg-white/5 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-3xl">📭</div>
            <p className="text-sm text-slate-400">Noch keine Einladungen erstellt.</p>
          </div>
        ) : (
          <>
            {/* active */}
            {activeItems.length > 0 && (
              <div className="space-y-2">
                {activeItems.map((item) => (
                  <InviteRow key={item.id} item={item} busy={busy} onRevoke={revokeInvite} onResend={resendInvite} />
                ))}
              </div>
            )}
            {/* others */}
            {otherItems.length > 0 && (
              <div className="space-y-2 opacity-60">
                {otherItems.map((item) => (
                  <InviteRow key={item.id} item={item} busy={busy} onRevoke={revokeInvite} onResend={resendInvite} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ─── invite row ───────────────────────────────────────────────────────────────

function InviteRow({
  item,
  busy,
  onRevoke,
  onResend,
}: {
  item: InviteItem
  busy: boolean
  onRevoke: (id: number) => void
  onResend: (id: number) => void
}) {
  const isActive = item.status === "active"
  const sections = item.section_permissions
    ? Object.entries(item.section_permissions).filter(([, v]) => v).map(([k]) => k)
    : null

  return (
    <div className="group flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 transition-all hover:border-white/20 hover:bg-white/8 md:flex-row md:items-center md:justify-between">
      {/* left */}
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600/30 to-fuchsia-600/30 text-sm font-semibold text-violet-300">
            {(item.email[0] ?? "?").toUpperCase()}
          </div>
          <span className="font-medium text-slate-200 text-sm">{item.email}</span>
          <RoleBadge role={item.role} />
          <StatusBadge status={item.status} />
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          {item.expires_at && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(item.expires_at).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" })}
            </span>
          )}
          {sections !== null && (
            <span className="flex items-center gap-1 flex-wrap">
              <span className="text-slate-600">Zugriff:</span>
              {sections.length === SECTION_KEYS.length
                ? <span className="text-violet-400">Alle</span>
                : sections.length === 0
                ? <span className="text-rose-400">Keiner</span>
                : sections.map((k) => (
                    <span key={k} className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 capitalize">{k}</span>
                  ))}
            </span>
          )}
        </div>

        {item.invite_url && isActive && (
          <div className="flex flex-col gap-2 pt-1">
            <div className="text-[11px] uppercase tracking-wider text-slate-600">Einladungslink</div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                readOnly
                value={item.invite_url}
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 outline-none"
              />
              <a
                href={item.invite_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 transition-all hover:border-white/20 hover:text-white"
              >
                Link öffnen
              </a>
            </div>
          </div>
        )}
      </div>

      {/* right */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {item.invite_url && <CopyButton text={item.invite_url} />}

        {isActive && (
          <button
            type="button"
            title="Erneut senden"
            disabled={busy}
            onClick={() => onResend(item.id)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:border-violet-500/40 hover:bg-violet-500/10 hover:text-violet-300 transition-all disabled:opacity-40"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        )}

        {(isActive) && (
          <button
            type="button"
            title="Widerrufen"
            disabled={busy}
            onClick={() => onRevoke(item.id)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-400 transition-all disabled:opacity-40"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}
