import { useState, useEffect } from 'react'

// Always go through Next.js API routes on the same origin (`/api/auth/...`)
const API_BASE = ''

type User = {
  id: number
  email: string
  role: string
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

  const fetchProfile = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/profile`, {
        credentials: 'include',
      })

      if (response.ok) {
        const user = await response.json()
        setState({ user, loading: false, error: null })
      } else {
        setState({ user: null, loading: false, error: 'Not authenticated' })
      }
    } catch (error) {
      setState({ user: null, loading: false, error: 'Failed to fetch profile' })
    }
  }

  const logout = async () => {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      })
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


