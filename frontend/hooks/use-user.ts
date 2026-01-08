"use client"

import { useState, useEffect } from 'react'
import { getCurrentUser, User } from '@/lib/auth'

/**
 * Hook to get current authenticated user
 */
export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
      setLoading(false)
    }
    fetchUser()
  }, [])

  return { user, loading }
}



