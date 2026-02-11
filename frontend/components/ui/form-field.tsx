"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

type Props = {
  id: string
  label?: string
  hint?: React.ReactNode
  error?: React.ReactNode
  required?: boolean
  className?: string
  children: (opts: { describedBy?: string; invalid?: boolean }) => React.ReactNode
}

export function FormField({ id, label, hint, error, required, className, children }: Props) {
  const hintId = hint ? `${id}-hint` : undefined
  const errId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errId].filter(Boolean).join(" ") || undefined
  const invalid = !!error

  return (
    <div className={cn("grid gap-1.5", className)}>
      {label ? (
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor={id} className="text-slate-600 dark:text-slate-300">
            {label} {required ? <span className="text-rose-300/90">*</span> : null}
          </Label>
        </div>
      ) : null}

      {children({ describedBy, invalid })}

      {hint ? (
        <div id={hintId} className="text-[11px] leading-snug text-slate-500 dark:text-slate-400">
          {hint}
        </div>
      ) : null}

      {error ? (
        <div id={errId} className="text-[11px] leading-snug text-rose-200">
          {error}
        </div>
      ) : null}
    </div>
  )
}

