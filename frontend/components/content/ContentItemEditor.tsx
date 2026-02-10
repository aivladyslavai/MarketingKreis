"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GlassSelect } from "@/components/ui/glass-select"
import { Badge } from "@/components/ui/badge"
import {
  contentAI,
  contentItemsAPI,
  contentTemplatesAPI,
  type ContentItemDTO,
  type ContentItemStatus,
  type ContentReviewerDTO,
  type ContentReviewDecisionDTO,
} from "@/lib/api"
import { sync } from "@/lib/sync"
import { useAuth } from "@/hooks/use-auth"
import { AlertCircle, Check, FileText, Link2, Loader2, Plus, Sparkles, Trash2, Upload } from "lucide-react"

const STATUS_OPTIONS: Array<{ value: ContentItemStatus; label: string }> = [
  { value: "IDEA", label: "IDEA" },
  { value: "DRAFT", label: "DRAFT" },
  { value: "REVIEW", label: "REVIEW" },
  { value: "APPROVED", label: "APPROVED" },
  { value: "SCHEDULED", label: "SCHEDULED" },
  { value: "PUBLISHED", label: "PUBLISHED" },
  { value: "ARCHIVED", label: "ARCHIVED" },
  { value: "BLOCKED", label: "BLOCKED" },
]

function fmtDateInput(d?: Date | null) {
  if (!d) return ""
  const iso = d.toISOString()
  return iso.slice(0, 16) // yyyy-mm-ddThh:mm
}

function parseDateInput(v: string): Date | undefined {
  const s = String(v || "").trim()
  if (!s) return undefined
  try {
    const d = new Date(s)
    if (Number.isNaN(d.getTime())) return undefined
    return d
  } catch {
    return undefined
  }
}

export function ContentItemEditor({
  itemId,
  initial,
  onClose,
}: {
  itemId?: number
  initial?: Partial<ContentItemDTO>
  onClose?: () => void
}) {
  const { user } = useAuth()
  const isAdmin = user?.role === "admin" || user?.role === "editor"

  const [loading, setLoading] = React.useState<boolean>(Boolean(itemId))
  const [saving, setSaving] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)

  const [item, setItem] = React.useState<ContentItemDTO>(() => {
    const base: ContentItemDTO = {
      id: itemId || 0,
      title: initial?.title || "",
      channel: initial?.channel || "Website",
      format: initial?.format || null,
      status: (initial?.status as any) || "DRAFT",
      tags: initial?.tags || [],
      brief: initial?.brief || null,
      body: initial?.body || null,
      tone: (initial as any)?.tone || null,
      language: (initial as any)?.language || "de",
      due_at: (initial as any)?.due_at || null,
      scheduled_at: (initial as any)?.scheduled_at || null,
      published_at: (initial as any)?.published_at || null,
      company_id: (initial as any)?.company_id || null,
      project_id: (initial as any)?.project_id || null,
      activity_id: (initial as any)?.activity_id || null,
      owner_id: (initial as any)?.owner_id || null,
      owner: (initial as any)?.owner || null,
      blocked_reason: (initial as any)?.blocked_reason || null,
      blocked_by: (initial as any)?.blocked_by || null,
      created_at: (initial as any)?.created_at || new Date().toISOString(),
      updated_at: (initial as any)?.updated_at || new Date().toISOString(),
    }
    return base
  })

  const [tagsInput, setTagsInput] = React.useState<string>(() => (Array.isArray(item.tags) ? item.tags.join(", ") : ""))

  // Subresources
  const [comments, setComments] = React.useState<any[]>([])
  const [checklist, setChecklist] = React.useState<any[]>([])
  const [assets, setAssets] = React.useState<any[]>([])
  const [versions, setVersions] = React.useState<any[]>([])
  const [audit, setAudit] = React.useState<any[]>([])
  const [reviewers, setReviewers] = React.useState<ContentReviewerDTO[]>([])
  const [reviewDecisions, setReviewDecisions] = React.useState<ContentReviewDecisionDTO[]>([])
  const [orgUsers, setOrgUsers] = React.useState<Array<{ id: number; email: string; role: string }>>([])
  const [reviewerPick, setReviewerPick] = React.useState<string>("")
  const [templates, setTemplates] = React.useState<any[]>([])
  const [templatePick, setTemplatePick] = React.useState<string>("")
  const [tab, setTab] = React.useState<
    "details" | "workflow" | "checklist" | "assets" | "comments" | "ai"
  >("details")
  const [workflowTab, setWorkflowTab] = React.useState<"audit" | "versions">("audit")

  const [newComment, setNewComment] = React.useState("")
  const [newChecklist, setNewChecklist] = React.useState("")
  const [newAssetUrl, setNewAssetUrl] = React.useState("")
  const [newAssetName, setNewAssetName] = React.useState("")
  const [reviewNote, setReviewNote] = React.useState("")
  const [reviewBusy, setReviewBusy] = React.useState(false)

  // AI
  const [aiLoading, setAiLoading] = React.useState(false)
  const [aiResult, setAiResult] = React.useState<any>(null)
  const [aiAction, setAiAction] = React.useState<string>("brief")
  const [aiPrompt, setAiPrompt] = React.useState<string>("")

  const loadAll = React.useCallback(
    async (id: number) => {
      const [it, cs, cl, as, vs, au, rv, rd] = await Promise.all([
        contentItemsAPI.get(id),
        contentItemsAPI.comments.list(id).catch(() => []),
        contentItemsAPI.checklist.list(id).catch(() => []),
        contentItemsAPI.assets.list(id).catch(() => []),
        contentItemsAPI.versions.list(id).catch(() => []),
        contentItemsAPI.audit.list(id).catch(() => []),
        contentItemsAPI.reviewers.list(id).catch(() => []),
        contentItemsAPI.review.decisions(id).catch(() => []),
      ])
      setItem(it)
      setTagsInput(Array.isArray(it.tags) ? it.tags.join(", ") : "")
      setComments(cs as any[])
      setChecklist(cl as any[])
      setAssets(as as any[])
      setVersions(vs as any[])
      setAudit(au as any[])
      setReviewers(rv as any)
      setReviewDecisions(rd as any)
    },
    []
  )

  React.useEffect(() => {
    if (!itemId) return
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        await loadAll(itemId)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [itemId, loadAll])

  // Load picklists for workflow (admins/editors only)
  React.useEffect(() => {
    if (!isAdmin) return
    let cancelled = false
    ;(async () => {
      try {
        const [users, tpls] = await Promise.all([contentItemsAPI.users.list().catch(() => []), contentTemplatesAPI.list().catch(() => [])])
        if (cancelled) return
        setOrgUsers(Array.isArray(users) ? (users as any) : [])
        setTemplates(Array.isArray(tpls) ? (tpls as any) : [])
      } catch {
        /* noop */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isAdmin])

  const save = async (opts?: { createVersion?: boolean }) => {
    const tags = tagsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
    const payload: any = {
      title: item.title,
      channel: item.channel,
      format: item.format,
      status: item.status,
      tags,
      brief: item.brief,
      body: item.body,
      tone: item.tone,
      language: item.language,
      due_at: item.due_at,
      scheduled_at: item.scheduled_at,
      company_id: item.company_id,
      project_id: item.project_id,
      activity_id: item.activity_id,
      blocked_reason: item.blocked_reason,
      blocked_by: item.blocked_by,
      create_version: Boolean(opts?.createVersion),
    }

    setSaving(true)
    try {
      if (!itemId) {
        const created = await contentItemsAPI.create(payload)
        setItem(created)
        await loadAll(created.id)
      } else {
        const updated = await contentItemsAPI.update(itemId, payload)
        setItem(updated)
        await loadAll(itemId)
      }
      try {
        sync.emit("content:changed")
      } catch {}
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!itemId) return
    if (!confirm("Content Item wirklich löschen?")) return
    setDeleting(true)
    try {
      await contentItemsAPI.delete(itemId)
      try {
        sync.emit("content:changed")
      } catch {}
      onClose?.()
    } finally {
      setDeleting(false)
    }
  }

  const addChecklist = async () => {
    if (!itemId) return
    const t = newChecklist.trim()
    if (!t) return
    setNewChecklist("")
    const created = await contentItemsAPI.checklist.create(itemId, { title: t })
    setChecklist((prev) => [created, ...prev].sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0)))
  }

  const toggleChecklist = async (row: any) => {
    const next = await contentItemsAPI.checklist.update(row.id, { is_done: !row.is_done })
    setChecklist((prev) => prev.map((r: any) => (r.id === row.id ? next : r)))
  }

  const addComment = async () => {
    if (!itemId) return
    const t = newComment.trim()
    if (!t) return
    setNewComment("")
    const created = await contentItemsAPI.comments.create(itemId, t)
    setComments((prev) => [...prev, created])
  }

  const addLinkAsset = async () => {
    if (!itemId) return
    const url = newAssetUrl.trim()
    if (!url) return
    const created = await contentItemsAPI.assets.create(itemId, {
      kind: "LINK",
      name: newAssetName.trim() || undefined,
      url,
      source: url.includes("figma.com") ? "figma" : url.includes("docs.google.com") ? "docs" : "link",
    })
    setAssets((prev) => [created, ...prev])
    setNewAssetUrl("")
    setNewAssetName("")
  }

  const uploadFileAsset = async (file: globalThis.File | null) => {
    if (!itemId || !file) return
    const created = await contentItemsAPI.assets.upload(itemId, file)
    setAssets((prev) => [created, ...prev])
  }

  const runAI = async (action: string) => {
    setAiLoading(true)
    setAiAction(action)
    try {
      const res = await contentAI.run({
        action,
        prompt: aiPrompt || undefined,
        tone: item.tone || undefined,
        language: item.language || "de",
        company_id: item.company_id || undefined,
        project_id: item.project_id || undefined,
        activity_id: item.activity_id || undefined,
        draft: {
          title: item.title,
          channel: item.channel,
          format: item.format,
          brief: item.brief,
          body: item.body,
          tags: item.tags,
        },
      })
      setAiResult(res.result)
    } finally {
      setAiLoading(false)
    }
  }

  const applyAI = () => {
    if (!aiResult) return
    if (aiAction === "titles" && Array.isArray(aiResult.titles) && aiResult.titles[0]) {
      setItem((prev) => ({ ...prev, title: String(aiResult.titles[0]) }))
      return
    }
    if (aiAction === "brief" && typeof aiResult.brief === "string") {
      setItem((prev) => ({ ...prev, brief: aiResult.brief }))
      return
    }
    if (aiAction === "copy" && typeof aiResult.content === "string") {
      setItem((prev) => ({ ...prev, body: aiResult.content }))
      if (typeof aiResult.title === "string" && aiResult.title.trim()) {
        setItem((prev) => ({ ...prev, title: aiResult.title }))
      }
    }
  }

  const addReviewer = async (reviewerId: number) => {
    if (!itemId || !isAdmin) return
    const created = await contentItemsAPI.reviewers.add(itemId, { reviewer_id: reviewerId, role: "reviewer" })
    setReviewers((prev) => [created, ...prev])
  }

  const removeReviewer = async (rowId: number) => {
    if (!isAdmin) return
    await contentItemsAPI.reviewers.remove(rowId)
    setReviewers((prev) => prev.filter((r) => r.id !== rowId))
  }

  const applyTemplate = async () => {
    if (!itemId || !isAdmin) return
    const tid = Number(templatePick)
    if (!Number.isFinite(tid) || tid <= 0) return
    await contentItemsAPI.applyTemplate(itemId, tid)
    await loadAll(itemId)
  }

  const isReviewer = Boolean(user?.id && reviewers.some((r) => r.reviewer_id === user.id))

  const requestReview = async () => {
    if (!itemId) return
    setReviewBusy(true)
    try {
      const res = await contentItemsAPI.review.request(itemId, reviewNote || undefined)
      setItem((p) => ({ ...p, status: res.status as any }))
      await loadAll(itemId)
      setReviewNote("")
    } finally {
      setReviewBusy(false)
    }
  }

  const approve = async () => {
    if (!itemId) return
    setReviewBusy(true)
    try {
      const res = await contentItemsAPI.review.approve(itemId, reviewNote || undefined)
      setItem((p) => ({ ...p, status: res.status as any }))
      await loadAll(itemId)
      setReviewNote("")
    } finally {
      setReviewBusy(false)
    }
  }

  const forceApprove = async () => {
    if (!itemId || !isAdmin) return
    setReviewBusy(true)
    try {
      const res = await contentItemsAPI.review.forceApprove(itemId, reviewNote || undefined)
      setItem((p) => ({ ...p, status: res.status as any }))
      await loadAll(itemId)
      setReviewNote("")
    } finally {
      setReviewBusy(false)
    }
  }

  const reject = async () => {
    if (!itemId) return
    setReviewBusy(true)
    try {
      const res = await contentItemsAPI.review.reject(itemId, reviewNote || undefined)
      setItem((p) => ({ ...p, status: res.status as any }))
      await loadAll(itemId)
      setReviewNote("")
    } finally {
      setReviewBusy(false)
    }
  }

  const reviewerStatus = React.useMemo(() => {
    const m = new Map<number, ContentReviewDecisionDTO>()
    for (const d of reviewDecisions || []) {
      if (!d?.reviewer_id) continue
      // latest wins (API returns desc by created_at)
      if (!m.has(d.reviewer_id)) m.set(d.reviewer_id, d)
    }
    return m
  }, [reviewDecisions])

  if (loading) {
    return (
      <div className="py-8 flex items-center justify-center text-slate-300">
        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Lade…
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1 sm:col-span-2">
          <label className="text-xs text-slate-300">Titel</label>
          <Input value={item.title} onChange={(e) => setItem((p) => ({ ...p, title: e.target.value }))} placeholder="z.B. LinkedIn Carousel – Produkt Update" />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-300">Status</label>
          <GlassSelect
            value={item.status}
            onChange={(v) => setItem((p) => ({ ...p, status: v as any }))}
            options={STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-300">Tags</label>
          <Input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="z.B. launch, q1, pr" />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-300">Channel (Level 1)</label>
          <Input value={item.channel} onChange={(e) => setItem((p) => ({ ...p, channel: e.target.value }))} placeholder="Website, LinkedIn, Email…" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-300">Format (Level 2)</label>
          <Input value={item.format || ""} onChange={(e) => setItem((p) => ({ ...p, format: e.target.value || null }))} placeholder="Landing Page, Newsletter…" />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-300">Fällig bis</label>
          <Input
            type="datetime-local"
            value={fmtDateInput(item.due_at ? new Date(item.due_at) : undefined)}
            onChange={(e) => setItem((p) => ({ ...p, due_at: parseDateInput(e.target.value)?.toISOString() || null }))}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-300">Geplant (Publish)</label>
          <Input
            type="datetime-local"
            value={fmtDateInput(item.scheduled_at ? new Date(item.scheduled_at) : undefined)}
            onChange={(e) => setItem((p) => ({ ...p, scheduled_at: parseDateInput(e.target.value)?.toISOString() || null }))}
          />
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="space-y-3">
        <TabsList className="w-full justify-between bg-slate-900/40 border-white/10">
          <TabsTrigger value="details" className="flex-1 text-xs sm:text-sm">
            Details
          </TabsTrigger>
          <TabsTrigger value="workflow" className="flex-1 text-xs sm:text-sm">
            Workflow
          </TabsTrigger>
          <TabsTrigger value="checklist" className="flex-1 text-xs sm:text-sm">
            Checklist
          </TabsTrigger>
          <TabsTrigger value="assets" className="flex-1 text-xs sm:text-sm">
            Assets
          </TabsTrigger>
          <TabsTrigger value="comments" className="flex-1 text-xs sm:text-sm">
            Kommentare
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex-1 text-xs sm:text-sm">
            KI
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-slate-300">Brief</label>
            <textarea
              value={item.brief || ""}
              onChange={(e) => setItem((p) => ({ ...p, brief: e.target.value || null }))}
              className="min-h-[100px] w-full rounded-md bg-slate-950/60 border border-slate-700 px-3 py-2 text-sm text-slate-100"
              placeholder="Brief / Ziel / Outline…"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-300">Content</label>
            <textarea
              value={item.body || ""}
              onChange={(e) => setItem((p) => ({ ...p, body: e.target.value || null }))}
              className="min-h-[160px] w-full rounded-md bg-slate-950/60 border border-slate-700 px-3 py-2 text-sm text-slate-100"
              placeholder="Draft / Text…"
            />
          </div>
        </TabsContent>

        <TabsContent value="workflow" className="space-y-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-200">Review / Approval</div>
                <div className="mt-0.5 text-[11px] text-slate-400">
                  Reviewer können “approve / reject”. Owner kann “Review anfragen”.
                </div>
              </div>
              <Badge className="bg-white/10 text-slate-200 border-white/10">{item.status}</Badge>
            </div>
            {/* Pending approvals */}
            <div className="mt-3 rounded-xl border border-white/10 bg-slate-950/30 p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-semibold text-slate-200">Pending approvals</div>
                <div className="text-[11px] text-slate-400">
                  {reviewers.length} Reviewer
                </div>
              </div>
              <div className="mt-2 space-y-2">
                {reviewers.length === 0 ? (
                  <div className="text-xs text-slate-400">Keine Reviewer zugewiesen.</div>
                ) : (
                  reviewers.map((r) => {
                    const rid = r.reviewer_id || 0
                    const d = rid ? reviewerStatus.get(rid) : undefined
                    const decision = String(d?.decision || "").toUpperCase()
                    const pill =
                      decision === "APPROVED"
                        ? "bg-emerald-500/15 text-emerald-200 border-emerald-400/30"
                        : decision === "REJECTED"
                        ? "bg-red-500/15 text-red-200 border-red-400/30"
                        : "bg-slate-500/10 text-slate-200 border-white/10"
                    const label = decision === "APPROVED" ? "Approved" : decision === "REJECTED" ? "Rejected" : "Pending"
                    return (
                      <div key={r.id} className="flex items-start justify-between gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-100 truncate">
                            {r.reviewer?.email || (r.reviewer_id ? `#${r.reviewer_id}` : "—")}
                          </div>
                          {d?.note ? <div className="mt-0.5 text-[11px] text-slate-400 line-clamp-2">{d.note}</div> : null}
                        </div>
                        <div className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-semibold ${pill}`}>{label}</div>
                      </div>
                    )
                  })
                )}
              </div>
              {reviewers.length > 0 && (
                <div className="mt-2 text-[11px] text-slate-400">
                  Item wird erst automatisch <span className="text-slate-200 font-semibold">APPROVED</span>, wenn alle Reviewer approved haben.
                </div>
              )}
            </div>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Input
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="Kommentar / Grund (optional)"
                className="sm:col-span-2"
              />
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-11 sm:h-9"
                  disabled={!itemId || reviewBusy}
                  onClick={requestReview}
                  title="Setzt Status auf REVIEW und benachrichtigt Reviewer"
                >
                  Review anfragen
                </Button>
              </div>
            </div>
            <div className="mt-2 flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                className="h-11 sm:h-9"
                disabled={!itemId || reviewBusy || (!isAdmin && !isReviewer)}
                onClick={approve}
              >
                Approve
              </Button>
              {isAdmin && (
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 sm:h-9"
                  disabled={!itemId || reviewBusy}
                  onClick={forceApprove}
                  title="Admin override: sofort APPROVED"
                >
                  Force approve
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                className="h-11 sm:h-9 border-red-500/40 text-red-300 hover:bg-red-500/10"
                disabled={!itemId || reviewBusy || (!isAdmin && !isReviewer)}
                onClick={reject}
              >
                Reject
              </Button>
              {!isAdmin && !isReviewer && (
                <div className="text-[11px] text-slate-400 self-center">
                  (Nur Reviewer / Admin)
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-300">Blocked reason</label>
              <Input
                value={item.blocked_reason || ""}
                onChange={(e) => setItem((p) => ({ ...p, blocked_reason: e.target.value || null }))}
                placeholder="z.B. waiting for client feedback"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-300">Tone</label>
              <Input value={item.tone || ""} onChange={(e) => setItem((p) => ({ ...p, tone: e.target.value || null }))} placeholder="friendly, formal…" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-300">Language</label>
              <Input value={item.language || "de"} onChange={(e) => setItem((p) => ({ ...p, language: e.target.value || "de" }))} placeholder="de" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-300">Links (IDs)</label>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  value={item.company_id ?? ""}
                  onChange={(e) => setItem((p) => ({ ...p, company_id: e.target.value ? Number(e.target.value) : null }))}
                  placeholder="Company"
                />
                <Input
                  value={item.project_id ?? ""}
                  onChange={(e) => setItem((p) => ({ ...p, project_id: e.target.value ? Number(e.target.value) : null }))}
                  placeholder="Project"
                />
                <Input
                  value={item.activity_id ?? ""}
                  onChange={(e) => setItem((p) => ({ ...p, activity_id: e.target.value ? Number(e.target.value) : null }))}
                  placeholder="Activity"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-semibold text-slate-200">Reviewer</div>
              {!isAdmin && <div className="text-[11px] text-slate-400">Nur Admin/Editor</div>}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {reviewers.length === 0 && <div className="text-xs text-slate-400">— keine —</div>}
              {reviewers.map((r) => (
                <span key={r.id} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-slate-200">
                  <span className="truncate max-w-[180px]">{r.reviewer?.email || `#${r.reviewer_id}`}</span>
                  {isAdmin && (
                    <button
                      type="button"
                      className="text-slate-400 hover:text-red-300"
                      onClick={() => removeReviewer(r.id)}
                      title="remove"
                    >
                      ×
                    </button>
                  )}
                </span>
              ))}
            </div>
            {isAdmin && (
              <div className="mt-3 flex items-center gap-2">
                <div className="flex flex-col sm:flex-row w-full gap-2">
                  <div className="flex-1 min-w-0">
                    <GlassSelect
                      value={reviewerPick}
                      onChange={(v) => setReviewerPick(String(v))}
                      options={[
                        { value: "", label: "Reviewer auswählen…" },
                        ...orgUsers.map((u) => ({ value: String(u.id), label: `${u.email} (#${u.id})` })),
                      ]}
                      className="w-full"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 sm:h-9"
                    onClick={() => {
                      const v = Number(reviewerPick)
                      if (!Number.isFinite(v) || v <= 0) return
                      addReviewer(v)
                      setReviewerPick("")
                    }}
                    disabled={!itemId}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              </div>
            )}
          </div>

          {isAdmin && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-semibold text-slate-200">Template anwenden</div>
                <div className="text-[11px] text-slate-400">Erstellt Checklist/Tasks/Reviewer aus dem Template</div>
              </div>
              <div className="mt-3 flex flex-col sm:flex-row gap-2">
                <GlassSelect
                  value={templatePick}
                  onChange={(v) => setTemplatePick(String(v))}
                  options={[
                    { value: "", label: "Template auswählen…" },
                    ...templates.map((t: any) => ({ value: String(t.id), label: `${t.name} (#${t.id})` })),
                  ]}
                  className="flex-1"
                />
                <Button type="button" variant="outline" className="h-11 sm:h-9" onClick={applyTemplate} disabled={!itemId || !templatePick}>
                  Anwenden
                </Button>
              </div>
            </div>
          )}

          <Tabs value={workflowTab} onValueChange={(v) => setWorkflowTab(v as any)} className="space-y-2">
            <TabsList className="w-full bg-slate-900/40 border-white/10">
              <TabsTrigger value="audit" className="flex-1 text-xs">
                History
              </TabsTrigger>
              <TabsTrigger value="versions" className="flex-1 text-xs">
                Versions
              </TabsTrigger>
            </TabsList>
            <TabsContent value="audit" className="space-y-2">
              {audit.length === 0 ? (
                <div className="text-xs text-slate-400">Keine History</div>
              ) : (
                <div className="space-y-2">
                  {audit.slice(0, 20).map((a: any) => (
                    <div key={a.id} className="rounded-lg border border-white/10 bg-white/5 p-2 text-xs text-slate-200">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold truncate">{a.action}</span>
                        <span className="text-[11px] text-slate-400 whitespace-nowrap">{String(a.created_at).slice(0, 19).replace("T", " ")}</span>
                      </div>
                      {a.data && <pre className="mt-1 text-[11px] text-slate-400 overflow-auto">{JSON.stringify(a.data, null, 2)}</pre>}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="versions" className="space-y-2">
              {versions.length === 0 ? (
                <div className="text-xs text-slate-400">Keine Versions</div>
              ) : (
                <div className="space-y-2">
                  {versions.map((v: any) => (
                    <div key={v.id} className="rounded-lg border border-white/10 bg-white/5 p-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs font-semibold text-slate-200">v{v.version}</div>
                        <div className="text-[11px] text-slate-400">{String(v.created_at).slice(0, 19).replace("T", " ")}</div>
                      </div>
                      <div className="mt-1 text-xs text-slate-300 truncate">{v.title || item.title}</div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="checklist" className="space-y-3">
          {!itemId && <div className="text-xs text-slate-400">Сначала сохрани Item, затем добавляй checklist.</div>}
          <div className="flex items-center gap-2">
            <Input value={newChecklist} onChange={(e) => setNewChecklist(e.target.value)} placeholder="Neuer Checklist пункт…" />
            <Button type="button" variant="outline" onClick={addChecklist} disabled={!itemId}>
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
          <div className="space-y-2">
            {checklist.length === 0 && <div className="text-xs text-slate-400">— пусто —</div>}
            {checklist.map((r: any) => (
              <button
                key={r.id}
                type="button"
                className="w-full flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left"
                onClick={() => toggleChecklist(r)}
              >
                <span className="min-w-0 flex-1 truncate text-sm text-slate-200">
                  {r.is_done ? <Check className="inline h-4 w-4 mr-2 text-emerald-300" /> : <span className="inline-block w-4 mr-2" />}
                  {r.title}
                </span>
                <Badge variant="secondary" className="text-[10px] whitespace-nowrap">
                  {r.is_done ? "done" : "todo"}
                </Badge>
              </button>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="assets" className="space-y-3">
          {!itemId && <div className="text-xs text-slate-400">Сначала сохрани Item, затем добавляй assets.</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs text-slate-300">Link URL</label>
              <Input value={newAssetUrl} onChange={(e) => setNewAssetUrl(e.target.value)} placeholder="https://figma.com/…" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-300">Name (optional)</label>
              <Input value={newAssetName} onChange={(e) => setNewAssetName(e.target.value)} placeholder="Figma – Hero" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={addLinkAsset} disabled={!itemId || !newAssetUrl.trim()}>
              <Link2 className="h-4 w-4 mr-1" /> Add Link
            </Button>
            <label className={`inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 cursor-pointer ${!itemId ? "opacity-50 pointer-events-none" : ""}`}>
              <Upload className="h-4 w-4" />
              Upload File
              <input
                type="file"
                className="hidden"
                onChange={(e) => uploadFileAsset(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          <div className="space-y-2">
            {assets.length === 0 && <div className="text-xs text-slate-400">— нет файлов/линков —</div>}
            {assets.map((a: any) => {
              const isImg = String(a.mime_type || "").startsWith("image/")
              const url = a.kind === "UPLOAD" ? contentItemsAPI.assets.downloadUrl(a.id) : a.url
              return (
                <div key={a.id} className="rounded-xl border border-white/10 bg-white/5 p-3 overflow-hidden">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {a.kind === "UPLOAD" ? <FileText className="h-4 w-4 text-slate-300" /> : <Link2 className="h-4 w-4 text-slate-300" />}
                        <div className="text-sm font-semibold text-slate-100 truncate">{a.name || (a.kind === "UPLOAD" ? "Upload" : "Link")}</div>
                      </div>
                      <div className="mt-1 text-xs text-slate-400 truncate">{url}</div>
                      <div className="mt-1 text-[11px] text-slate-500">
                        v{a.version} · {a.size_bytes ? `${a.size_bytes} bytes` : ""} {a.source ? `· ${a.source}` : ""}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <a href={url} target="_blank" rel="noreferrer" className="text-xs text-blue-300 hover:text-blue-200">
                        Öffnen
                      </a>
                      <button
                        type="button"
                        className="text-slate-400 hover:text-red-300"
                        onClick={async () => {
                          if (!confirm("Asset löschen?")) return
                          await contentItemsAPI.assets.delete(a.id)
                          setAssets((prev) => prev.filter((x: any) => x.id !== a.id))
                        }}
                        title="delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {a.kind === "UPLOAD" && isImg && (
                    <div className="mt-2">
                      <img src={url} alt={a.name || "asset"} className="max-h-48 rounded-lg border border-white/10" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="comments" className="space-y-3">
          {!itemId && <div className="text-xs text-slate-400">Сначала сохрани Item, затем добавляй комментарии.</div>}
          <div className="flex items-center gap-2">
            <Input value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Комментарий…" />
            <Button type="button" variant="outline" onClick={addComment} disabled={!itemId || !newComment.trim()}>
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
          <div className="space-y-2">
            {comments.length === 0 && <div className="text-xs text-slate-400">— нет комментариев —</div>}
            {comments.map((c: any) => (
              <div key={c.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs text-slate-400 truncate">{c.author?.email || "User"}</div>
                  <div className="text-[11px] text-slate-500 whitespace-nowrap">{String(c.created_at).slice(0, 19).replace("T", " ")}</div>
                </div>
                <div className="mt-1 text-sm text-slate-100 whitespace-pre-wrap break-words">{c.body}</div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="ai" className="space-y-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
              <Sparkles className="h-4 w-4 text-amber-300" /> KI‑Assistent
            </div>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Input value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="Optional: дополнительная инструкция (короче/строже/…) " />
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={() => runAI("brief")} disabled={aiLoading}>
                  Brief
                </Button>
                <Button type="button" variant="outline" onClick={() => runAI("titles")} disabled={aiLoading}>
                  Titles
                </Button>
                <Button type="button" variant="outline" onClick={() => runAI("copy")} disabled={aiLoading}>
                  Draft
                </Button>
                <Button type="button" variant="outline" onClick={() => runAI("qa")} disabled={aiLoading}>
                  QA
                </Button>
                <Button type="button" variant="outline" onClick={() => runAI("summary")} disabled={aiLoading}>
                  Summary
                </Button>
              </div>
            </div>

            {aiLoading && (
              <div className="mt-3 text-xs text-slate-300 flex items-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> KI arbeitet…
              </div>
            )}
            {aiResult && (
              <div className="mt-3 space-y-2">
                <div className="text-xs text-slate-300 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-slate-400" />
                    Ergebnis ({aiAction})
                  </span>
                  <Button type="button" size="sm" onClick={applyAI} variant="outline">
                    Apply
                  </Button>
                </div>
                <pre className="text-[11px] text-slate-200 bg-slate-950/60 border border-slate-700 rounded-lg p-2 overflow-auto">
                  {JSON.stringify(aiResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2 pt-2 border-t border-white/10">
        <div className="flex items-center gap-2">
          {itemId && (
            <Button variant="destructive" onClick={remove} disabled={deleting}>
              {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Löschen
            </Button>
          )}
        </div>
        <div className="flex flex-col-reverse sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onClose?.()}>
            Schließen
          </Button>
          <Button onClick={() => save({ createVersion: false })} disabled={saving || !item.title.trim()}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Speichern
          </Button>
          <Button variant="outline" onClick={() => save({ createVersion: true })} disabled={saving || !item.title.trim()}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save + Version
          </Button>
        </div>
      </div>
    </div>
  )
}

