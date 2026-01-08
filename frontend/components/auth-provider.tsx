"use client"

import * as React from "react"
// import { SessionProvider } from "next-auth/react" // Disabled for demo
import { Session } from "next-auth"

interface AuthProviderProps {
  children: React.ReactNode
  session?: Session | null
}

export function AuthProvider({ children, session }: AuthProviderProps) {
  // Temporary: Just pass through children without session provider
  return <>{children}</>
}
