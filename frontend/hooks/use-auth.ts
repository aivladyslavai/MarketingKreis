import { useState, useEffect } from 'react'
import { refreshAuthSession, requestLocal } from '@/lib/api'

// Always go through Next.js API routes on the same origin (`/api/auth/...`)
const API_BASE = ''

type User = {
  id: number
  email: string
  role: string
  organization_id?: number
  position_title?: string | null
  onboarding_completed_at?: string | null
  onboarding_required?: boolean
  organization?: {
    id: number
    name: string
    industry?: string | null
    team_size?: string | null
    country?: string | null
    language?: string | null
    owner_user_id?: number | null
    onboarding_completed_at?: string | null
  } | null
  section_permissions?: Record<string, boolean> | null
}

interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    if (!state.user) return

    const tick = async () => {
      try {
        if (document.visibilityState !== "visible") return
      } catch {}
      try {
        await refreshAuthSession()
      } catch {
        // Best-effort only. On-demand requests can still refresh on 401.
      }
    }

    const id = window.setInterval(() => {
      void tick()
    }, 10 * 60_000)

    try {
      document.addEventListener("visibilitychange", tick)
    } catch {}

    return () => {
      window.clearInterval(id)
      try {
        document.removeEventListener("visibilitychange", tick)
      } catch {}
    }
  }, [state.user])

  const fetchProfile = async () => {
    try {
      const user = await requestLocal<User | null>(`${API_BASE}/api/auth/profile`)
      if (user) {
        setState({ user, loading: false, error: null })
      } else {
        setState({ user: null, loading: false, error: 'Not authenticated' })
      }
    } catch (error: any) {
      const message = String(error?.message || "")
      const notAuthenticated =
        /not authenticated|invalid token|session revoked|user not found/i.test(message)
      setState({
        user: null,
        loading: false,
        error: notAuthenticated ? 'Not authenticated' : 'Failed to fetch profile',
      })
    }
  }

  const logout = async () => {
    try {
      await requestLocal(`${API_BASE}/api/auth/logout`, { method: 'POST' })
      setState({ user: null, loading: false, error: null })
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return {
    user: state.user,
    loading: state.loading,
    error: state.error,
    isAuthenticated: !!state.user,
    logout,
    refetch: fetchProfile,
  }
}


