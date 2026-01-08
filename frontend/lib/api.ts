export const apiBase = process.env.NEXT_PUBLIC_API_URL || "/api"

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${apiBase}${path.startsWith("/") ? path : "/" + path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
    credentials: "include",
    cache: "no-store",
  })
  if (!res.ok) {
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
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
    credentials: "include",
    cache: "no-store",
  })
  if (!res.ok) {
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
  const res = await fetch(`${apiBase}${path.startsWith("/") ? path : "/" + path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
    credentials: "include",
    cache: "no-store",
  })
  return res
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
}

export const dealsAPI = {
  getAll: () => request<any[]>(`/crm/deals`),
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
  owner_id?: number | null
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
}

export type ContentTaskUpdateDTO = Partial<ContentTaskCreateDTO>

export const contentTasksAPI = {
  list: () => request<ContentTaskDTO[]>(`/content/tasks`),
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

export type AdminUserUpdatePayload = {
  email?: string
  role?: "user" | "editor" | "admin"
  is_verified?: boolean
  new_password?: string
}

export const adminAPI = {
  // Admin endpoints *must* go via same-origin API routes so that the backend
  // receives the authentication cookies. Direct calls to the backend URL from
  // the browser would otherwise result in 401 on Vercel.
  getSeedStatus: () => requestLocal<AdminSeedStatus>(`/api/admin/seed-status`),
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
}


