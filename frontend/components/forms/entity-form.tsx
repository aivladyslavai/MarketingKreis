"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export function EntityForm({
  children,
  onSubmit,
  className,
}: {
  children: React.ReactNode
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  className?: string
}) {
  return (
    <form onSubmit={onSubmit} className={cn("space-y-5", className)}>
      {children}
    </form>
  )
}

export function EntityFormSection({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-slate-200/60 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5 sm:p-5", className)}>
      {children}
    </div>
  )
}
