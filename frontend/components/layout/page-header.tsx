"use client"

import * as React from "react"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  description?: string
  icon?: LucideIcon
  actions?: React.ReactNode
  /** Additional small badges / counters / labels shown next to the title. */
  meta?: React.ReactNode
  /** Compact variant — smaller padding, no background flourish. */
  compact?: boolean
  className?: string
}

/**
 * Unified KA BOOM page header used across the dashboard.
 * One component → one layout → one feel. The hero uses the corporate black
 * card with a subtle red brand wash and a left-side icon plate.
 */
export function PageHeader({
  title,
  description,
  icon: Icon,
  actions,
  meta,
  compact = false,
  className,
}: PageHeaderProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border bg-card",
        "shadow-sm",
        compact ? "p-4 sm:p-5" : "p-5 sm:p-7",
        className
      )}
    >
      {/* Corporate brand wash — subtle red glow, NOT a colorful gradient */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--kaboom-red)/0.10),transparent_60%)]"
      />
      {/* Left red brand bar */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 bottom-0 w-1 bg-kaboom-red"
      />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4 min-w-0">
          {Icon ? (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-kaboom-red/10 text-kaboom-red ring-1 ring-kaboom-red/25">
              <Icon className="h-5 w-5" />
            </div>
          ) : null}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl sm:text-[26px] font-extrabold tracking-tight text-foreground leading-tight truncate">
                {title}
              </h1>
              {meta}
            </div>
            {description ? (
              <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {actions}
          </div>
        ) : null}
      </div>
    </section>
  )
}
