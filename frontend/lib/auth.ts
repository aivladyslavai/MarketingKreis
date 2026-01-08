export type User = {
  id: string
  email: string
  name?: string | null
  role?: string | null
}

// Simple helper that calls the backend profile endpoint via the Next.js proxy.
export async function getCurrentUser(): Promise<User | null> {
  try {
    const res = await fetch("/api/auth/me", {
      credentials: "include",
      cache: "no-store",
    })
    if (!res.ok) return null
    const data = await res.json()
    if (!data) return null
    return {
      id: String(data.id ?? data.user_id ?? "me"),
      email: String(data.email ?? ""),
      name: (data.name as string | null) ?? null,
      role: (data.role as string | null) ?? null,
    }
  } catch {
    return null
  }
}

