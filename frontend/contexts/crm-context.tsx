"use client"

import React, { createContext, useContext, useMemo } from "react"
import { useUnifiedCrm, type UnifiedCrmData } from "@/hooks/use-unified-crm"

// Extend UnifiedCrmData with a convenient aggregate loading flag
export type CrmContextValue = UnifiedCrmData & { isAnyLoading: boolean }

const CrmContext = createContext<CrmContextValue | null>(null)

export function CrmProvider({ children }: { children: React.ReactNode }) {
  const crm = useUnifiedCrm()
  const isAnyLoading = crm.marketingLoading || crm.crmLoading

  const value = useMemo(
    () => ({
      ...crm,
      isAnyLoading,
    }),
    [crm, isAnyLoading],
  )

  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>
}

export function useCrmContext(): CrmContextValue {
  const ctx = useContext(CrmContext)
  if (!ctx) {
    throw new Error("useCrmContext must be used within a CrmProvider")
  }
  return ctx
}

