"use client"

import * as React from "react"
// import { SessionProvider } from "next-auth/react" // Disabled for demo

interface AuthProviderProps {
  children: React.ReactNode
  session?: any | null
}

export function AuthProvider({ children, session }: AuthProviderProps) {
  // Temporary: Just pass through children without session provider
  return <>{children}</>
}
