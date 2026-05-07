"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Mail, RefreshCw, Trash2, Users, Shield, Crown,
  Pencil, UserRound, Copy, Check, Clock, XCircle,
  CheckCircle2, AlertCircle, Send, Plus, ChevronDown, UserCog,
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { authFetch } from "@/lib/api"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/layout/page-header"

type TeamMember = {
  id: number
  email: string
  role: string
  isVerified: boolean
  createdAt?: string | null
  updatedAt?: string | null
  section_permissions?: Record<string, boolean> | null
  position_title?: string | null
}

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
  crm: { label: "CRM", icon: "CR" },
  calendar: { label: "Kalender", icon: "KA" },
  activities: { label: "Aktivitäten", icon: "AK" },
  performance: { label: "Performance", icon: "PF" },
  budget: { label: "Budget", icon: "BU" },
  content: { label: "Content", icon: "CO" },
  reports: { label: "Reports", icon: "RE" },
  uploads: { label: "Uploads", icon: "UP" },
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
        "relative inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-left transition-all duration-200",
        active
          ? "border-kaboom-red bg-kaboom-red/10 shadow-[0_0_18px_hsl(var(--kaboom-red)/0.18)]"
          : "border-border bg-card hover:border-foreground/20 hover:bg-secondary"
      )}
    >
      {active && (
        <div className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-kaboom-red">
          <Check className="h-3 w-3 text-white" />
        </div>
      )}
      <span className={cn("shrink-0", active ? "text-kaboom-red" : "text-muted-foreground")}>{icon}</span>
      <span className="min-w-0">
        <span className={cn("block text-sm font-semibold leading-none", active ? "text-foreground" : "text-foreground/85")}>{label}</span>
        <span className="mt-1 block truncate text-[11px] leading-none text-muted-foreground">{description}</span>
      </span>
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
        "flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-xs transition-all duration-200",
        checked
          ? "border-kaboom-red/40 bg-kaboom-red/10 text-foreground"
          : "border-border bg-card text-muted-foreground hover:border-foreground/20"
      )}
    >
      <span className="flex min-w-0 items-center gap-1.5">
        <span className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[9px] font-black tracking-tight",
          checked ? "bg-kaboom-red text-white" : "bg-secondary text-muted-foreground"
        )}>
          {meta.icon}
        </span>
        <span className="truncate font-semibold">{meta.label}</span>
      </span>
      <span
        className={cn(
          "relative ml-2 inline-flex h-4 w-7 flex-shrink-0 rounded-full transition-colors duration-200",
          checked ? "bg-kaboom-red" : "bg-foreground/15"
        )}
      >
        <span
          className={cn(
            "inline-block h-3 w-3 rounded-full bg-white shadow transition-transform duration-200",
            checked ? "translate-x-4.5" : "translate-x-0.5"
          )}
          style={{ transform: `translateX(${checked ? "14px" : "2px"}) translateY(2px)` }}
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
    admin: { icon: <Shield className="h-3 w-3" />, cls: "border-kaboom-red/30 bg-kaboom-red/10 text-kaboom-red" },
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
  const [members, setMembers] = React.useState<TeamMember[]>([])
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null)
  const [lastInviteUrl, setLastInviteUrl] = React.useState<string | null>(null)
  const [membersLoading, setMembersLoading] = React.useState(false)
  const [memberActionId, setMemberActionId] = React.useState<number | null>(null)

  // form
  const [email, setEmail] = React.useState("")
  const [role, setRole] = React.useState("user")
  const [expiresMinutes, setExpiresMinutes] = React.useState("10080")
  const [sectionPermissions, setSectionPermissions] = React.useState<Record<string, boolean>>({})
  const [formOpen, setFormOpen] = React.useState(true)
  const [advancedOpen, setAdvancedOpen] = React.useState(false)

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

  const loadMembers = React.useCallback(async () => {
    try {
      setMembersLoading(true)
      const res = await authFetch("/auth/team/members", { method: "GET" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.detail || "Mitglieder konnten nicht geladen werden")
      setMembers((data?.items || []) as TeamMember[])
    } catch (e: any) {
      setError(e?.message || "Mitglieder konnten nicht geladen werden")
    } finally {
      setMembersLoading(false)
    }
  }, [])

  React.useEffect(() => {
    if (loading) return
    if (!user) { router.replace("/signup?mode=login&next=/team"); return }
    if (!isCompanyAdmin) { router.replace("/dashboard"); return }
    loadInvites()
    loadMembers()
  }, [loading, user, isCompanyAdmin, router, loadInvites, loadMembers])

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
      await loadMembers()
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
      await loadMembers()
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
      await loadMembers()
    } catch (e: any) {
      setError(e?.message)
    } finally {
      setBusy(false)
    }
  }

  async function updateMemberRole(member: TeamMember, nextRole: "user" | "editor" | "admin") {
    if (member.role === nextRole || member.role === "owner") return
    try {
      setMemberActionId(member.id)
      const res = await authFetch(`/auth/team/members/${member.id}`, {
        method: "PATCH",
        body: JSON.stringify({ role: nextRole }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.detail || "Rolle konnte nicht aktualisiert werden")
      setMembers((prev) => prev.map((m) => (m.id === member.id ? ((data?.member || m) as TeamMember) : m)))
      flash("Mitglied aktualisiert")
    } catch (e: any) {
      setError(e?.message || "Rolle konnte nicht aktualisiert werden")
    } finally {
      setMemberActionId(null)
    }
  }

  async function toggleMemberVerified(member: TeamMember) {
    if (member.role === "owner") return
    try {
      setMemberActionId(member.id)
      const res = await authFetch(`/auth/team/members/${member.id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_verified: !member.isVerified }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.detail || "Verifizierungsstatus konnte nicht geändert werden")
      setMembers((prev) => prev.map((m) => (m.id === member.id ? ((data?.member || m) as TeamMember) : m)))
      flash(member.isVerified ? "Verifizierung entfernt" : "Benutzer verifiziert")
    } catch (e: any) {
      setError(e?.message || "Verifizierungsstatus konnte nicht geändert werden")
    } finally {
      setMemberActionId(null)
    }
  }

  async function updateMemberPermissions(member: TeamMember, nextPerms: Record<string, boolean>) {
    if (member.role === "owner") return
    try {
      setMemberActionId(member.id)
      const res = await authFetch(`/auth/team/members/${member.id}`, {
        method: "PATCH",
        body: JSON.stringify({ section_permissions: nextPerms }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.detail || "Zugriffe konnten nicht aktualisiert werden")
      setMembers((prev) => prev.map((m) => (m.id === member.id ? ((data?.member || m) as TeamMember) : m)))
      flash("Zugriffe aktualisiert")
    } catch (e: any) {
      setError(e?.message || "Zugriffe konnten nicht aktualisiert werden")
    } finally {
      setMemberActionId(null)
    }
  }

  async function deleteMember(member: TeamMember) {
    if (member.role === "owner") return
    if (!confirm(`Benutzer ${member.email} wirklich löschen?`)) return
    try {
      setMemberActionId(member.id)
      const res = await authFetch(`/auth/team/members/${member.id}`, { method: "DELETE" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.detail || "Benutzer konnte nicht gelöscht werden")
      setMembers((prev) => prev.filter((m) => m.id !== member.id))
      flash("Mitglied gelöscht")
    } catch (e: any) {
      setError(e?.message || "Benutzer konnte nicht gelöscht werden")
    } finally {
      setMemberActionId(null)
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
        <RefreshCw className="h-5 w-5 animate-spin text-kaboom-red" />
      </div>
    )
  }

  const activeItems = items.filter((i) => i.status === "active")
  const otherItems = items.filter((i) => i.status !== "active")

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-1 py-2">

      <PageHeader
        title="Team & Einladungen"
        description="Lade Mitarbeitende ein, vergib Rollen und steuere den Zugriff auf jeden Bereich der Plattform."
        icon={Users}
        meta={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-kaboom-red/10 px-2.5 py-0.5 text-xs font-medium text-kaboom-red ring-1 ring-kaboom-red/25">
            {members.length} {members.length === 1 ? "Mitglied" : "Mitglieder"}
            <span className="text-kaboom-red/60">·</span>
            {items.filter((i) => i.status === "active").length} offen
          </span>
        }
        actions={
          <button
            type="button"
            onClick={() => loadMembers()}
            disabled={membersLoading}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-3 text-sm text-foreground/70 transition-all hover:bg-secondary hover:text-foreground disabled:opacity-50"
          >
            <RefreshCw className={cn("h-4 w-4", membersLoading && "animate-spin")} />
            Aktualisieren
          </button>
        }
      />

      {/* ── global flash ── */}
      {successMsg && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          {successMsg}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)] lg:items-start">
        <aside className="lg:sticky lg:top-20">
      {/* ── form card ── */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {/* corner brand accent */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rotate-12 rounded-2xl bg-kaboom-red/10 blur-2xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 h-full w-[3px] bg-kaboom-red"
        />
        {/* card header / toggle */}
        <button
          type="button"
          onClick={() => setFormOpen((v) => !v)}
          className="relative flex w-full items-center justify-between px-4 py-3 transition-colors hover:bg-secondary"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-kaboom-red/15 ring-1 ring-kaboom-red/30">
              <Plus className="h-3.5 w-3.5 text-kaboom-red" />
            </div>
            <span className="font-display text-[15px] font-bold tracking-tight text-foreground">Neue Einladung</span>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-300",
              formOpen ? "rotate-180" : "rotate-0"
            )}
          />
        </button>

        {formOpen && (
          <form onSubmit={createInvite} className="relative space-y-5 border-t border-border px-4 pb-5 pt-4 sm:px-5">

            {/* email */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Mail className="h-3.5 w-3.5 text-kaboom-red" />
                E-Mail-Adresse
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@firma.ch"
                className="w-full rounded-xl border border-border bg-background/40 px-3.5 py-2.5 text-sm text-foreground placeholder-muted-foreground/70 transition-all focus:border-kaboom-red/50 focus:outline-none focus:ring-2 focus:ring-kaboom-red/30"
              />
            </div>

            {/* role */}
            <div>
              <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Shield className="h-3.5 w-3.5 text-kaboom-red" />
                Rolle
              </label>
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-1">
                <RoleCard value="owner" role={role} label="Owner" icon={<Crown className="h-5 w-5" />} description="Voller Zugriff" available={isOwner} onClick={() => setRole("owner")} />
                <RoleCard value="admin" role={role} label="Admin" icon={<Shield className="h-5 w-5" />} description="Team verwalten" available={isOwner} onClick={() => setRole("admin")} />
                <RoleCard value="editor" role={role} label="Editor" icon={<Pencil className="h-5 w-5" />} description="Inhalte bearbeiten" available={true} onClick={() => setRole("editor")} />
                <RoleCard value="user" role={role} label="User" icon={<UserRound className="h-5 w-5" />} description="Nur lesen" available={true} onClick={() => setRole("user")} />
              </div>
            </div>

            {/* advanced permissions */}
            <div className="rounded-xl border border-border bg-background/30 p-2.5">
              <button
                type="button"
                onClick={() => setAdvancedOpen((v) => !v)}
                className="flex w-full items-center justify-between rounded-lg px-1 py-0.5 text-left"
              >
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Shield className="h-3.5 w-3.5 text-kaboom-red" />
                  Erweitert: Bereichszugriff
                </span>
                <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", advancedOpen && "rotate-180")} />
              </button>
              {advancedOpen && (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <button type="button" onClick={() => toggleAll(true)} className={cn("rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider transition-all", allEnabled ? "border-kaboom-red/40 bg-kaboom-red/10 text-kaboom-red" : "border-border text-muted-foreground hover:text-foreground")}>Alle</button>
                    <button type="button" onClick={() => toggleAll(false)} className={cn("rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider transition-all", noneEnabled ? "border-rose-500/40 bg-rose-500/10 text-rose-400" : "border-border text-muted-foreground hover:text-foreground")}>Keine</button>
                  </div>
                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
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
              )}
            </div>

            {/* expires */}
            <div>
              <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Clock className="h-3.5 w-3.5 text-kaboom-red" />
                Link gültig für
              </label>
              <div className="flex flex-wrap gap-1.5">
                {EXPIRES_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setExpiresMinutes(o.value)}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all",
                      expiresMinutes === o.value
                        ? "border-kaboom-red bg-kaboom-red/15 text-foreground shadow-[0_0_10px_hsl(var(--kaboom-red)/0.25)]"
                        : "border-border bg-card text-muted-foreground hover:border-foreground/20 hover:text-foreground"
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

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={busy}
                className={cn(
                  "group inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold uppercase tracking-wider transition-all duration-200",
                  !busy
                    ? "bg-kaboom-red text-white shadow-[0_0_18px_hsl(var(--kaboom-red)/0.45)] hover:shadow-[0_0_28px_hsl(var(--kaboom-red)/0.7)] hover:-translate-y-0.5"
                    : "cursor-not-allowed bg-secondary text-muted-foreground"
                )}
              >
                {busy
                  ? <RefreshCw className="h-4 w-4 animate-spin" />
                  : <Send className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                }
                Einladung erstellen
              </button>
            </div>
          </form>
        )}
      </div>

        </aside>

        <section className="flex flex-col gap-4">
      {/* ── invite list ── */}
      <div className="order-2 space-y-2">
        <h2 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          <span className="h-2 w-2 rounded-sm bg-kaboom-red" />
          Einladungen
          <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] text-foreground/70">{items.length}</span>
          <span className="ml-1 h-px flex-1 bg-border" />
        </h2>

        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-card py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-kaboom-red">
              <Mail className="h-5 w-5" />
            </div>
            <p className="text-sm text-muted-foreground">Noch keine Einladungen erstellt.</p>
          </div>
        ) : (
          <>
            {/* active */}
            {activeItems.length > 0 && (
              <div className="space-y-1.5">
                {activeItems.map((item) => (
                  <InviteRow key={item.id} item={item} busy={busy} onRevoke={revokeInvite} onResend={resendInvite} />
                ))}
              </div>
            )}
            {/* others */}
            {otherItems.length > 0 && (
              <div className="space-y-1.5 opacity-60">
                {otherItems.map((item) => (
                  <InviteRow key={item.id} item={item} busy={busy} onRevoke={revokeInvite} onResend={resendInvite} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── members ── */}
      <div className="order-1 space-y-2">
        <h2 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          <span className="h-2 w-2 rounded-sm bg-kaboom-red" />
          Team-Mitglieder
          <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] text-foreground/70">{members.length}</span>
          <span className="ml-1 h-px flex-1 bg-border" />
        </h2>

        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-4 sm:p-5">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-0 h-full w-[3px] bg-kaboom-red/70"
          />
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-kaboom-red/10 ring-1 ring-kaboom-red/25">
                <UserCog className="h-4 w-4 text-kaboom-red" />
              </div>
              <div>
                <div className="font-display text-sm font-bold tracking-tight text-foreground">Mitglieder deiner Firma</div>
                <div className="text-xs text-muted-foreground">
                  Rollen anpassen, Zugriff steuern, Mitglieder verwalten.
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => loadMembers()}
              disabled={membersLoading}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 text-xs font-semibold text-foreground/80 transition-all hover:bg-secondary disabled:opacity-50"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", membersLoading && "animate-spin")} />
              Neu laden
            </button>
          </div>

          {membersLoading && members.length === 0 ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
            </div>
          ) : members.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-secondary/40 py-8 text-center text-sm text-muted-foreground">
              Keine Mitglieder gefunden.
            </div>
          ) : (
            <div className="space-y-2">
              {members.map((member) => {
                const memberBusy = memberActionId === member.id
                const isOwnerMember = member.role === "owner"
                return (
                  <div
                    key={member.id}
                    className="group relative overflow-hidden rounded-xl border border-border bg-card p-3 transition-all hover:border-kaboom-red/30 hover:shadow-[0_0_0_1px_hsl(var(--kaboom-red)/0.15)]"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-kaboom-red/30 to-kaboom-red/10 text-sm font-semibold text-kaboom-red">
                            {(member.email?.[0] ?? "?").toUpperCase()}
                          </div>
                          <span className="truncate text-sm font-medium text-slate-100">{member.email}</span>
                          <RoleBadge role={member.role} />
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                              member.isVerified
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                                : "border-slate-500/30 bg-slate-500/10 text-slate-400"
                            )}
                          >
                            <span className={cn("h-1.5 w-1.5 rounded-full", member.isVerified ? "bg-emerald-400" : "bg-slate-400")} />
                            {member.isVerified ? "Verifiziert" : "Unbestätigt"}
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-slate-500">
                          User ID {member.id}
                          {member.createdAt ? ` • seit ${new Date(member.createdAt).toLocaleDateString("de-DE")}` : ""}
                          {member.position_title ? ` • ${member.position_title}` : ""}
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3 lg:w-[440px]">
                        <div className="sm:col-span-2">
                          <div className="mb-2 text-[11px] uppercase tracking-wider text-slate-500">Rolle</div>
                          {isOwnerMember ? (
                            <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2.5 text-sm font-medium text-amber-200">
                              Owner
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {(["user", "editor", "admin"] as const).map((r) => (
                                <button
                                  key={r}
                                  type="button"
                                  disabled={memberBusy}
                                  onClick={() => updateMemberRole(member, r)}
                                  className={cn(
                                    "rounded-xl border px-3 py-2 text-xs font-medium transition-all",
                                    member.role === r
                                      ? "border-kaboom-red bg-kaboom-red/20 text-white"
                                      : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-slate-200"
                                  )}
                                >
                                  {r}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <div>
                          <div className="mb-2 text-[11px] uppercase tracking-wider text-slate-500">Aktionen</div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={memberBusy || isOwnerMember}
                              onClick={() => toggleMemberVerified(member)}
                              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 transition-all hover:border-white/20 hover:text-white disabled:opacity-40"
                            >
                              {member.isVerified ? "Unverify" : "Verify"}
                            </button>
                            <button
                              type="button"
                              disabled={memberBusy || isOwnerMember}
                              onClick={() => deleteMember(member)}
                              className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300 transition-all hover:bg-rose-500/15 disabled:opacity-40"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 border-t border-white/10 pt-4">
                      <div className="mb-2 text-[11px] uppercase tracking-wider text-slate-500">Zugriffe</div>
                      {isOwnerMember ? (
                        <div className="rounded-xl border border-amber-400/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-200">
                          Owner hat vollständigen Firmenzugriff.
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                          {SECTION_KEYS.map((k) => {
                            const allowed = member.section_permissions?.[k] !== false
                            return (
                              <SectionToggle
                                key={`${member.id}-${k}`}
                                sectionKey={k}
                                checked={allowed}
                                onChange={(v) =>
                                  updateMemberPermissions(member, {
                                    ...(member.section_permissions || {}),
                                    [k]: v,
                                  })
                                }
                              />
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
        </section>
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
    <div className="group relative flex flex-col gap-2.5 overflow-hidden rounded-xl border border-border bg-card p-3 transition-all hover:border-kaboom-red/30 hover:shadow-[0_0_0_1px_hsl(var(--kaboom-red)/0.15)] md:flex-row md:items-center md:justify-between">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 h-full w-[2px] bg-kaboom-red/0 transition-colors group-hover:bg-kaboom-red"
      />
      {/* left */}
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-kaboom-red/30 to-kaboom-red/10 text-sm font-semibold text-kaboom-red">
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
                ? <span className="text-kaboom-red">Alle</span>
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
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:border-kaboom-red/40 hover:bg-kaboom-red/10 hover:text-kaboom-red transition-all disabled:opacity-40"
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
