// IMPORTANT:
// In production we must stay same-origin ("/api") so browser cookies issued on the
// frontend domain are sent correctly. If someone accidentally sets
// NEXT_PUBLIC_API_URL to an absolute backend URL, we intentionally ignore it.
const envBase = process.env.NEXT_PUBLIC_API_URL
export const apiBase = envBase && envBase.startsWith("/") ? envBase : "/api"

// Guardrail: absolute NEXT_PUBLIC_API_URL in production is almost always a bug.
// It breaks cookie auth (especially Safari/iOS) because cookies will not be sent
// cross-site, and can bypass our Next.js proxy hardening.
if (
  process.env.NODE_ENV === "production" &&
  envBase &&
  !envBase.startsWith("/") &&
  // tolerate undefined / empty
  String(envBase || "").trim() !== ""
) {
  throw new Error(
    `Invalid NEXT_PUBLIC_API_URL="${envBase}". In production it must be a relative path like "/api" (same-origin).`
  )
}

const MK_ADMIN_STEPUP_EVENT = "mk:admin-stepup-required"

const DEFAULT_TIMEOUT_READ_MS = 35_000
const DEFAULT_TIMEOUT_WRITE_MS = 90_000

function isAbortError(err: any): boolean {
  return (
    err?.name === "AbortError" ||
    String(err?.message || "").toLowerCase().includes("aborted") ||
    String(err?.message || "").toLowerCase().includes("aborterror")
  )
}

function wrapTimeoutError(err: any, timeoutMs: number): Error {
  if (!isAbortError(err)) return err instanceof Error ? err : new Error(String(err || "Request failed"))
  return new Error(`Request timed out after ${Math.round(timeoutMs / 1000)}s`)
}

function withTimeout(init: RequestInit, timeoutMs: number): { init: RequestInit; cleanup: () => void } {
  const controller = new AbortController()
  const prev = init.signal

  const onAbort = () => {
    try { controller.abort() } catch {}
  }
  if (prev) {
    if (prev.aborted) {
      try { controller.abort() } catch {}
    } else {
      try { prev.addEventListener("abort", onAbort, { once: true } as any) } catch {}
    }
  }

  const id = setTimeout(() => {
    try { controller.abort() } catch {}
  }, timeoutMs)

  return {
    init: { ...init, signal: controller.signal },
    cleanup: () => {
      clearTimeout(id)
      if (prev) {
        try { prev.removeEventListener("abort", onAbort as any) } catch {}
      }
    },
  }
}

function timeoutFor(init: RequestInit): number {
  const method = String(init.method || "GET").toUpperCase()
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return DEFAULT_TIMEOUT_READ_MS
  return DEFAULT_TIMEOUT_WRITE_MS
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null
  try {
    const parts = (document.cookie || "").split(";")
    for (const rawPart of parts) {
      const part = rawPart.trim()
      if (!part) continue
      const eq = part.indexOf("=")
      if (eq < 0) continue
      const k = part.slice(0, eq).trim()
      if (k !== name) continue
      return decodeURIComponent(part.slice(eq + 1))
    }
    return null
  } catch {
    return null
  }
}

function withCsrfHeader(init: RequestInit): RequestInit {
  const method = (init.method || "GET").toUpperCase()
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return init
  const csrf = getCookie("csrf_token") || getCookie("mk_csrf") || getCookie("XSRF-TOKEN")
  if (!csrf) return init
  return {
    ...init,
    headers: { ...(init.headers || {}), "X-CSRF-Token": csrf },
  }
}

type StepUpEventDetail = {
  message?: string
  resolve: () => void
  reject: (err: any) => void
}

let _stepUpGate: { promise: Promise<void>; resolve: () => void; reject: (err: any) => void } | null = null

async function ensureAdminStepUp(message?: string): Promise<void> {
  if (typeof window === "undefined") throw new Error(message || "2FA step-up required")
  if (_stepUpGate) return _stepUpGate.promise

  let resolve!: () => void
  let reject!: (err: any) => void
  const promise = new Promise<void>((res, rej) => {
    resolve = res
    reject = rej
  })
  _stepUpGate = { promise, resolve, reject }

  try {
    window.dispatchEvent(new CustomEvent<StepUpEventDetail>(MK_ADMIN_STEPUP_EVENT, { detail: { message, resolve, reject } }))
  } catch (e) {
    _stepUpGate = null
    throw e
  }

  try {
    await promise
  } finally {
    _stepUpGate = null
  }
}

async function request<T>(path: string, init: RequestInit = {}, attempt: number = 0): Promise<T> {
  const i = withCsrfHeader(init)
  const timeoutMs = timeoutFor(i)
  const timed = withTimeout(i, timeoutMs)
  let res: Response
  try {
    res = await fetch(`${apiBase}${path.startsWith("/") ? path : "/" + path}`, {
      ...timed.init,
      headers: { "Content-Type": "application/json", ...(timed.init.headers || {}) },
      credentials: "include",
      cache: "no-store",
    })
  } catch (e: any) {
    throw wrapTimeoutError(e, timeoutMs)
  } finally {
    timed.cleanup()
  }
  if (!res.ok) {
    if (res.status === 428 && attempt < 1) {
      // Admin step-up required: show popup and retry once.
      let msg = "2FA step-up required"
      try {
        const j = await res.json()
        msg = (j as any)?.detail || (j as any)?.error || msg
      } catch {}
      await ensureAdminStepUp(msg)
      return request<T>(path, init, attempt + 1)
    }
    let msg = res.statusText
    try {
      const j = await res.json()
      msg = (j as any)?.detail || (j as any)?.error || msg
    } catch {}
    throw new Error(msg)
  }
  try {
    return (await res.json()) as T
  } catch {
    return undefined as unknown as T
  }
}

// Same-origin helper that always talks to the Next.js API routes (`/api/...`).
// This is critical in production (Vercel) so that authentication cookies
// issued on the frontend domain are sent correctly to the backend via
// server-side proxies, avoiding 401 "Not authenticated" errors.
export async function requestLocal<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = path.startsWith("/") ? path : "/" + path
  const i = withCsrfHeader(init)
  const timeoutMs = timeoutFor(i)
  const timed = withTimeout(i, timeoutMs)
  let res: Response
  try {
    res = await fetch(url, {
      ...timed.init,
      headers: { "Content-Type": "application/json", ...(timed.init.headers || {}) },
      credentials: "include",
      cache: "no-store",
    })
  } catch (e: any) {
    throw wrapTimeoutError(e, timeoutMs)
  } finally {
    timed.cleanup()
  }
  if (!res.ok) {
    if (res.status === 428) {
      let msg = "2FA step-up required"
      try {
        const j = await res.json()
        msg = (j as any)?.detail || (j as any)?.error || msg
      } catch {}
      await ensureAdminStepUp(msg)
      return requestLocal<T>(path, init)
    }
    let msg = res.statusText
    try {
      const j = await res.json()
      msg = (j as any)?.detail || (j as any)?.error || msg
    } catch {}
    throw new Error(msg)
  }
  try {
    return (await res.json()) as T
  } catch {
    return undefined as unknown as T
  }
}

export const authFetch = async (path: string, init: RequestInit = {}): Promise<Response> => {
  const i = withCsrfHeader(init)
  const timeoutMs = timeoutFor(i)
  const timed = withTimeout(i, timeoutMs)
  try {
    return await fetch(`${apiBase}${path.startsWith("/") ? path : "/" + path}`, {
      ...timed.init,
      headers: { "Content-Type": "application/json", ...(timed.init.headers || {}) },
      credentials: "include",
      cache: "no-store",
    })
  } catch (e: any) {
    throw wrapTimeoutError(e, timeoutMs)
  } finally {
    timed.cleanup()
  }
}

export const companiesAPI = {
  getAll: () => request<any[]>(`/crm/companies`),
  getById: (id: string) => request<any>(`/crm/companies/${id}`),
  create: (data: any) => request(`/crm/companies`, { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request(`/crm/companies/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request(`/crm/companies/${id}`, { method: 'DELETE' }),
}

export const contactsAPI = {
  getAll: () => request<any[]>(`/crm/contacts`),
  create: (data: any) => request(`/crm/contacts`, { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    request(`/crm/contacts/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => request(`/crm/contacts/${id}`, { method: "DELETE" }),
}

export const dealsAPI = {
  getAll: () => request<any[]>(`/crm/deals`),
  create: (data: any) => request(`/crm/deals`, { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    request(`/crm/deals/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => request(`/crm/deals/${id}`, { method: "DELETE" }),
}

export const crmAPI = {
  getStats: () => request<any>(`/crm/stats`),
}

// === Content Tasks ===

export type ContentTaskDTO = {
  id: number
  title: string
  channel: string
  format?: string | null
  status: "TODO" | "IN_PROGRESS" | "REVIEW" | "APPROVED" | "PUBLISHED" | "ARCHIVED"
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  notes?: string | null
  deadline?: string | null
  activity_id?: number | null
  content_item_id?: number | null
  recurrence?: any | null
  owner_id?: number | null
  owner?: { id: number; email: string; role: string } | null
  created_at: string
  updated_at: string
}

export type ContentTaskCreateDTO = {
  title: string
  channel?: string
  format?: string | null
  status?: ContentTaskDTO["status"]
  priority?: ContentTaskDTO["priority"]
  notes?: string | null
  deadline?: string | null
  activity_id?: number | null
  content_item_id?: number | null
  recurrence?: any | null
  owner_id?: number | null
}

export type ContentTaskUpdateDTO = Partial<ContentTaskCreateDTO>

export type ContentTasksListParams = {
  status?: ContentTaskDTO["status"]
  owner_id?: number
  unassigned?: boolean
  content_item_id?: number
  q?: string
}

export const contentTasksAPI = {
  list: (params?: ContentTasksListParams) => {
    const sp = new URLSearchParams()
    if (params?.status) sp.set("status", params.status)
    if (params?.owner_id != null) sp.set("owner_id", String(params.owner_id))
    if (params?.unassigned) sp.set("unassigned", "true")
    if (params?.content_item_id != null) sp.set("content_item_id", String(params.content_item_id))
    if (params?.q) sp.set("q", params.q)
    const qs = sp.toString()
    return request<ContentTaskDTO[]>(`/content/tasks${qs ? `?${qs}` : ""}`)
  },
  create: (payload: ContentTaskCreateDTO) =>
    request<ContentTaskDTO>(`/content/tasks`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  update: (id: number, payload: ContentTaskUpdateDTO) =>
    request<ContentTaskDTO>(`/content/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  delete: (id: number) =>
    request<{ ok: boolean; id: number }>(`/content/tasks/${id}`, {
      method: "DELETE",
    }),
  complete: (id: number) =>
    request<{ ok: boolean; completed: ContentTaskDTO; next?: ContentTaskDTO | null }>(`/content/tasks/${id}/complete`, {
      method: "POST",
    }),
}

// === Content Items (Content Hub) ===

export type ContentItemStatus = "IDEA" | "DRAFT" | "REVIEW" | "APPROVED" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED" | "BLOCKED"
export type ContentAssetKind = "LINK" | "UPLOAD"

export type ContentItemDTO = {
  id: number
  title: string
  channel: string
  format?: string | null
  status: ContentItemStatus
  tags?: string[] | null
  brief?: string | null
  body?: string | null
  tone?: string | null
  language?: string | null
  due_at?: string | null
  scheduled_at?: string | null
  published_at?: string | null
  company_id?: number | null
  project_id?: number | null
  activity_id?: number | null
  owner_id?: number | null
  owner?: { id: number; email: string; role: string } | null
  blocked_reason?: string | null
  blocked_by?: string[] | null
  created_at: string
  updated_at: string
}

export type ContentItemCreateDTO = {
  title: string
  channel?: string
  format?: string | null
  status?: ContentItemStatus
  tags?: string[] | null
  brief?: string | null
  body?: string | null
  tone?: string | null
  language?: string | null
  due_at?: string | null
  scheduled_at?: string | null
  company_id?: number | null
  project_id?: number | null
  activity_id?: number | null
  owner_id?: number | null
  blocked_reason?: string | null
  blocked_by?: string[] | null
}

export type ContentItemUpdateDTO = Partial<ContentItemCreateDTO> & { create_version?: boolean }

export type ContentItemsListParams = {
  q?: string
  status?: ContentItemStatus
  owner_id?: number
  unassigned?: boolean
  company_id?: number
  project_id?: number
}

export type ContentCommentDTO = {
  id: number
  item_id: number
  author_id?: number | null
  author?: { id: number; email: string; role: string } | null
  body: string
  created_at: string
}

export type ContentChecklistDTO = {
  id: number
  item_id: number
  title: string
  is_done: boolean
  position: number
  created_at: string
  updated_at: string
}

export type ContentAssetDTO = {
  id: number
  item_id: number
  kind: ContentAssetKind
  name?: string | null
  url?: string | null
  upload_id?: number | null
  source?: string | null
  mime_type?: string | null
  size_bytes?: number | null
  version: number
  created_by?: number | null
  created_at: string
}

export type ContentVersionDTO = {
  id: number
  item_id: number
  version: number
  title?: string | null
  brief?: string | null
  body?: string | null
  meta?: any | null
  created_by?: number | null
  created_at: string
}

export type ContentAuditDTO = {
  id: number
  item_id: number
  actor_id?: number | null
  action: string
  data?: any | null
  created_at: string
}

export type ContentReviewerDTO = {
  id: number
  reviewer_id?: number | null
  role?: string | null
  reviewer?: { id: number; email: string; role: string } | null
  created_at: string
}

export type ContentReviewDecisionDTO = {
  id: number
  item_id: number
  reviewer_id: number
  decision: string
  note?: string | null
  reviewer?: { id: number; email: string; role: string } | null
  created_at: string
}

export type ContentTemplateDTO = {
  id: number
  name: string
  description?: string | null
  channel?: string | null
  format?: string | null
  tags?: string[] | null
  checklist?: string[] | null
  tasks?: any[] | null
  reviewers?: number[] | null
  created_by?: number | null
  created_at: string
  updated_at: string
}

export type ContentAutomationRuleDTO = {
  id: number
  name: string
  is_active: boolean
  trigger: string
  template_id?: number | null
  config?: any | null
  created_by?: number | null
  created_at: string
  updated_at: string
}

export type NotificationDTO = {
  id: number
  type: string
  title: string
  body?: string | null
  url?: string | null
  read_at?: string | null
  created_at: string
}

export type ReportTemplateDTO = {
  id: number
  name: string
  description?: string | null
  config?: any | null
  is_default?: boolean
  created_by?: number | null
  created_at: string
  updated_at: string
}

export type ReportRunDTO = {
  id: number
  template_id?: number | null
  created_by?: number | null
  created_at: string
  params?: any | null
  kpi_snapshot?: any | null
  status: string
  error?: string | null
}

export type ReportRunWithHtmlDTO = ReportRunDTO & { html?: string | null }

export type ReportScheduleDTO = {
  id: number
  name: string
  template_id?: number | null
  is_active: boolean
  weekday: number
  hour: number
  minute: number
  timezone: string
  recipients: string[]
  last_run_at?: string | null
  next_run_at?: string | null
  created_by?: number | null
  created_at: string
  updated_at: string
}

export type AuthSessionDTO = {
  id: string
  ip?: string | null
  user_agent?: string | null
  created_at: string
  last_seen_at?: string | null
  revoked_at?: string | null
  revoked_reason?: string | null
  is_current: boolean
}

export const contentItemsAPI = {
  list: (params?: ContentItemsListParams) => {
    const sp = new URLSearchParams()
    if (params?.q) sp.set("q", params.q)
    if (params?.status) sp.set("status", params.status)
    if (params?.owner_id != null) sp.set("owner_id", String(params.owner_id))
    if (params?.unassigned) sp.set("unassigned", "true")
    if (params?.company_id != null) sp.set("company_id", String(params.company_id))
    if (params?.project_id != null) sp.set("project_id", String(params.project_id))
    const qs = sp.toString()
    return request<ContentItemDTO[]>(`/content/items${qs ? `?${qs}` : ""}`)
  },
  get: (id: number) => request<ContentItemDTO>(`/content/items/${id}`),
  create: (payload: ContentItemCreateDTO) =>
    request<ContentItemDTO>(`/content/items`, { method: "POST", body: JSON.stringify(payload) }),
  update: (id: number, payload: ContentItemUpdateDTO) =>
    request<ContentItemDTO>(`/content/items/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  delete: (id: number) => request<{ ok: boolean; id: number }>(`/content/items/${id}`, { method: "DELETE" }),

  comments: {
    list: (itemId: number) => request<ContentCommentDTO[]>(`/content/items/${itemId}/comments`),
    create: (itemId: number, body: string) =>
      request<ContentCommentDTO>(`/content/items/${itemId}/comments`, { method: "POST", body: JSON.stringify({ body }) }),
    delete: (commentId: number) => request<{ ok: boolean; id: number }>(`/content/comments/${commentId}`, { method: "DELETE" }),
  },
  reviewers: {
    list: (itemId: number) => request<ContentReviewerDTO[]>(`/content/items/${itemId}/reviewers`),
    add: (itemId: number, payload: { reviewer_id: number; role?: string }) =>
      request<ContentReviewerDTO>(`/content/items/${itemId}/reviewers`, { method: "POST", body: JSON.stringify(payload) }),
    remove: (reviewerRowId: number) => request<{ ok: boolean; id: number }>(`/content/reviewers/${reviewerRowId}`, { method: "DELETE" }),
  },
  checklist: {
    list: (itemId: number) => request<ContentChecklistDTO[]>(`/content/items/${itemId}/checklist`),
    create: (itemId: number, payload: { title: string; position?: number }) =>
      request<ContentChecklistDTO>(`/content/items/${itemId}/checklist`, { method: "POST", body: JSON.stringify(payload) }),
    update: (checkId: number, payload: Partial<{ title: string; is_done: boolean; position: number }>) =>
      request<ContentChecklistDTO>(`/content/checklist/${checkId}`, { method: "PATCH", body: JSON.stringify(payload) }),
    delete: (checkId: number) => request<{ ok: boolean; id: number }>(`/content/checklist/${checkId}`, { method: "DELETE" }),
  },
  assets: {
    list: (itemId: number) => request<ContentAssetDTO[]>(`/content/items/${itemId}/assets`),
    create: (itemId: number, payload: { kind: ContentAssetKind; name?: string; url?: string; upload_id?: number; source?: string }) =>
      request<ContentAssetDTO>(`/content/items/${itemId}/assets`, { method: "POST", body: JSON.stringify(payload) }),
    update: (assetId: number, payload: Partial<{ name: string; url: string; source: string; version: number }>) =>
      request<ContentAssetDTO>(`/content/assets/${assetId}`, { method: "PATCH", body: JSON.stringify(payload) }),
    delete: (assetId: number) => request<{ ok: boolean; id: number }>(`/content/assets/${assetId}`, { method: "DELETE" }),
    downloadUrl: (assetId: number) => `${apiBase}/content/assets/${assetId}/download`,
    upload: async (itemId: number, file: globalThis.File) => {
      const form = new FormData()
      form.append("file", file)
      const res = await fetch(`${apiBase}/content/items/${itemId}/assets/upload`, {
        method: "POST",
        body: form,
        credentials: "include",
      })
      if (!res.ok) throw new Error(await res.text())
      return (await res.json()) as ContentAssetDTO
    },
  },
  versions: {
    list: (itemId: number) => request<ContentVersionDTO[]>(`/content/items/${itemId}/versions`),
    create: (itemId: number, payload: Partial<{ title: string; brief: string; body: string; meta: any }>) =>
      request<ContentVersionDTO>(`/content/items/${itemId}/versions`, { method: "POST", body: JSON.stringify(payload) }),
  },
  audit: {
    list: (itemId: number, limit = 200) => request<ContentAuditDTO[]>(`/content/items/${itemId}/audit?limit=${limit}`),
  },
  applyTemplate: (itemId: number, templateId: number) =>
    request<{ ok: boolean; template_id: number; created: any }>(`/content/items/${itemId}/apply-template`, {
      method: "POST",
      body: JSON.stringify({ template_id: templateId }),
    }),
  review: {
    request: (itemId: number, note?: string) =>
      request<{ ok: boolean; id: number; status: string }>(`/content/items/${itemId}/review/request`, {
        method: "POST",
        body: JSON.stringify({ note }),
      }),
    approve: (itemId: number, note?: string) =>
      request<{ ok: boolean; id: number; status: string }>(`/content/items/${itemId}/review/approve`, {
        method: "POST",
        body: JSON.stringify({ note }),
      }),
    forceApprove: (itemId: number, note?: string) =>
      request<{ ok: boolean; id: number; status: string }>(`/content/items/${itemId}/review/approve`, {
        method: "POST",
        body: JSON.stringify({ note, force: true }),
      }),
    reject: (itemId: number, reason?: string) =>
      request<{ ok: boolean; id: number; status: string }>(`/content/items/${itemId}/review/reject`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      }),
    decisions: (itemId: number) => request<ContentReviewDecisionDTO[]>(`/content/items/${itemId}/review/decisions`),
  },
  users: {
    list: () => request<Array<{ id: number; email: string; role: string }>>(`/content/users`),
  },
  generateFromDeal: (dealId: number, templateId?: number) =>
    request<{ ok: boolean; item_id: number; template_id?: number | null }>(`/content/generate/from-deal/${dealId}`, {
      method: "POST",
      body: JSON.stringify({ template_id: templateId }),
    }),
}

export const contentTemplatesAPI = {
  list: () => request<ContentTemplateDTO[]>(`/content/templates`),
  create: (payload: Partial<ContentTemplateDTO>) => request<ContentTemplateDTO>(`/content/templates`, { method: "POST", body: JSON.stringify(payload) }),
  update: (id: number, payload: Partial<ContentTemplateDTO>) => request<ContentTemplateDTO>(`/content/templates/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  delete: (id: number) => request<{ ok: boolean; id: number }>(`/content/templates/${id}`, { method: "DELETE" }),
}

export const contentAutomationAPI = {
  list: () => request<ContentAutomationRuleDTO[]>(`/content/automation-rules`),
  create: (payload: Partial<ContentAutomationRuleDTO>) =>
    request<ContentAutomationRuleDTO>(`/content/automation-rules`, { method: "POST", body: JSON.stringify(payload) }),
  update: (id: number, payload: Partial<ContentAutomationRuleDTO>) =>
    request<ContentAutomationRuleDTO>(`/content/automation-rules/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  delete: (id: number) => request<{ ok: boolean; id: number }>(`/content/automation-rules/${id}`, { method: "DELETE" }),
  runReminders: () => request<{ ok: boolean; created: number }>(`/content/reminders/run`, { method: "POST" }),
}

export const notificationsAPI = {
  list: (params?: { unread_only?: boolean; limit?: number }) => {
    const sp = new URLSearchParams()
    if (params?.unread_only) sp.set("unread_only", "true")
    if (params?.limit != null) sp.set("limit", String(params.limit))
    const qs = sp.toString()
    return request<NotificationDTO[]>(`/content/notifications${qs ? `?${qs}` : ""}`)
  },
  read: (id: number) => request<{ ok: boolean; id: number }>(`/content/notifications/${id}/read`, { method: "POST" }),
  readAll: () => request<{ ok: boolean }>(`/content/notifications/read-all`, { method: "POST" }),
}

export const authSecurityAPI = {
  sessions: {
    list: () => request<AuthSessionDTO[]>(`/auth/sessions`),
    revoke: (id: string) => request<{ ok: boolean; id: string; logged_out?: boolean }>(`/auth/sessions/${encodeURIComponent(id)}/revoke`, { method: "POST" }),
    revokeAll: (keepCurrent: boolean) =>
      request<{ ok: boolean; revoked: number; keep_current: boolean }>(`/auth/sessions/revoke_all?keep_current=${keepCurrent ? "true" : "false"}`, { method: "POST" }),
  },
}

export const reportsAPI = {
  templates: {
    list: () => request<ReportTemplateDTO[]>(`/reports/templates`),
    create: (payload: Partial<ReportTemplateDTO>) =>
      request<ReportTemplateDTO>(`/reports/templates`, { method: "POST", body: JSON.stringify(payload) }),
    update: (id: number, payload: Partial<ReportTemplateDTO>) =>
      request<ReportTemplateDTO>(`/reports/templates/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
    delete: (id: number) => request<{ ok: boolean; id: number }>(`/reports/templates/${id}`, { method: "DELETE" }),
  },
  runs: {
    list: (params?: { template_id?: number; limit?: number }) => {
      const sp = new URLSearchParams()
      if (params?.template_id != null) sp.set("template_id", String(params.template_id))
      if (params?.limit != null) sp.set("limit", String(params.limit))
      const qs = sp.toString()
      return request<ReportRunDTO[]>(`/reports/runs${qs ? `?${qs}` : ""}`)
    },
    get: (id: number) => request<ReportRunWithHtmlDTO>(`/reports/runs/${id}`),
    create: (payload: Partial<{ template_id: number | null; params: any; kpi_snapshot: any; html: string; status: string; error: string }>) =>
      request<ReportRunDTO>(`/reports/runs`, { method: "POST", body: JSON.stringify(payload) }),
  },
  schedules: {
    list: () => request<ReportScheduleDTO[]>(`/reports/schedules`),
    create: (payload: Partial<ReportScheduleDTO>) =>
      request<ReportScheduleDTO>(`/reports/schedules`, { method: "POST", body: JSON.stringify(payload) }),
    update: (id: number, payload: Partial<ReportScheduleDTO>) =>
      request<ReportScheduleDTO>(`/reports/schedules/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
    delete: (id: number) => request<{ ok: boolean; id: number }>(`/reports/schedules/${id}`, { method: "DELETE" }),
    runNow: (id: number) =>
      request<{ ok: boolean; schedule_id: number; run_id: number; delivery: string; emails_sent: number; recipients: string[]; error?: string | null }>(
        `/reports/schedules/${id}/run`,
        { method: "POST" },
      ),
  },
}

export const contentAI = {
  run: (payload: { action: string; draft?: any; prompt?: string; tone?: string; language?: string; company_id?: number; project_id?: number; activity_id?: number }) =>
    request<{ ok: boolean; action: string; result: any; provider: string }>(`/ai/content_assistant`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
}

// User Categories persisted in backend
export type UserCategory = {
  id?: number
  name: string
  color: string
  position?: number
}

export const userCategoriesAPI = {
  get: async (): Promise<UserCategory[]> => {
    // Always go through the Next.js proxy so that cookies are forwarded correctly.
    const data = await requestLocal<any>(`/api/user/categories`)
    if (Array.isArray(data)) return data as UserCategory[]
    if (data && Array.isArray(data.categories)) return data.categories as UserCategory[]
    return []
  },
  put: async (categories: UserCategory[]): Promise<UserCategory[]> => {
    const data = await requestLocal<any>(`/api/user/categories`, {
      method: "PUT",
      body: JSON.stringify({ categories }),
    })
    if (Array.isArray(data)) return data as UserCategory[]
    if (data && Array.isArray(data.categories)) return data.categories as UserCategory[]
    return []
  },
}

// === Admin API ===

export type AdminUser = {
  id: number
  email: string
  role: string
  isVerified: boolean
  createdAt?: string | null
  updatedAt?: string | null
  section_permissions?: Record<string, boolean> | null
}

export type AdminUsersResponse = {
  items: AdminUser[]
  total: number
  skip: number
  limit: number
}

export type AdminSeedStatus = {
  users: {
    total: number
    admins: number
  }
  crm: {
    companies: number
    contacts: number
    deals: number
  }
  activities: {
    activities: number
    calendarEntries: number
  }
  performance: {
    metrics: number
  }
}

export type AdminSeedDemoPayload = {
  email?: string
  password: string
  reset?: boolean
}

export type AdminSeedDemoResult = {
  ok: boolean
  demo: { email: string; userId: number; readonly: boolean }
  created: Record<string, number>
  updated: Record<string, number>
  targets?: { clients?: number; projects?: number; activities?: number }
}

export type AdminUserUpdatePayload = {
  email?: string
  role?: "user" | "editor" | "admin"
  is_verified?: boolean
  new_password?: string
  section_permissions?: Record<string, boolean> | null
}

export type AdminSession = {
  id: string
  user_id: number
  user_email: string
  user_role: string
  ip?: string | null
  user_agent?: string | null
  created_at?: string | null
  last_seen_at?: string | null
  revoked_at?: string | null
  revoked_reason?: string | null
}

export const adminAPI = {
  // Admin endpoints *must* go via same-origin API routes so that the backend
  // receives the authentication cookies. Direct calls to the backend URL from
  // the browser would otherwise result in 401 on Vercel.
  getSeedStatus: () => requestLocal<AdminSeedStatus>(`/api/admin/seed-status`),
  seedDemo: (payload: AdminSeedDemoPayload) =>
    requestLocal<AdminSeedDemoResult>(`/api/admin/seed-demo`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getUsers: (params?: { skip?: number; limit?: number; search?: string; role?: string }) => {
    const searchParams = new URLSearchParams()
    if (params?.skip != null) searchParams.set("skip", String(params.skip))
    if (params?.limit != null) searchParams.set("limit", String(params.limit))
    if (params?.search) searchParams.set("search", params.search)
    if (params?.role) searchParams.set("role", params.role)
    const qs = searchParams.toString()
    return requestLocal<AdminUsersResponse>(`/api/admin/users${qs ? `?${qs}` : ""}`)
  },
  updateUser: (id: number, payload: AdminUserUpdatePayload) =>
    requestLocal<AdminUser>(`/api/admin/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteUser: (id: number) =>
    requestLocal<{ ok: boolean; id: number }>(`/api/admin/users/${id}`, {
      method: "DELETE",
    }),

  sessions: {
    list: (params?: { user_id?: number; active_only?: boolean; limit?: number }) => {
      const sp = new URLSearchParams()
      if (params?.user_id != null) sp.set("user_id", String(params.user_id))
      if (params?.active_only != null) sp.set("active_only", params.active_only ? "true" : "false")
      if (params?.limit != null) sp.set("limit", String(params.limit))
      const qs = sp.toString()
      return requestLocal<AdminSession[]>(`/api/admin/sessions${qs ? `?${qs}` : ""}`)
    },
    revoke: (id: string) =>
      requestLocal<{ ok: boolean; id: string }>(`/api/admin/sessions/${encodeURIComponent(id)}/revoke`, { method: "POST" }),
    revokeAllForUser: (userId: number) =>
      requestLocal<{ ok: boolean; revoked: number; user_id: number }>(`/api/admin/users/${userId}/revoke_all_sessions`, { method: "POST" }),
  },
}

// Legacy-style default export used by a few older hooks.
// New code should prefer the named helpers above.
const api = {
  request,
  jobs: {
    get: (id: number) => request<any>(`/jobs/${id}`),
  },
}

export default api


