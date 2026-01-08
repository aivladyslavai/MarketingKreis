"use client"

import React, { useState, type ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

let browserQueryClient: QueryClient | null = null

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000, // 1 minute
        retry: 1,
      },
    },
  })
}

function getQueryClient() {
  if (typeof window === "undefined") {
    // Always create a new client for SSR to avoid cross-request state sharing
    return createQueryClient()
  }
  if (!browserQueryClient) {
    browserQueryClient = createQueryClient()
  }
  return browserQueryClient
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(() => getQueryClient())
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

