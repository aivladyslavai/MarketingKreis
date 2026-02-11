"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface GlassOption {
  value: string
  label: string
}

interface GlassSelectProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  options: GlassOption[]
  className?: string
  disabled?: boolean
  "aria-invalid"?: boolean | "true" | "false"
  "aria-describedby"?: string
  name?: string
  required?: boolean
}

export function GlassSelect({ value, onChange, placeholder, options, className = "", disabled, ...rest }: GlassSelectProps) {
  const invalid = rest["aria-invalid"] === true || rest["aria-invalid"] === "true"
  return (
    <div
      className={cn(
        "relative group rounded-xl h-11 sm:h-10 flex items-center px-3 border transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
        "bg-white dark:bg-slate-950/30",
        "border-slate-200 dark:border-white/10",
        "focus-within:border-blue-500/40 focus-within:ring-2 focus-within:ring-blue-500/25",
        "dark:focus-within:border-blue-400/40 dark:focus-within:ring-blue-500/30",
        disabled && "opacity-60 cursor-not-allowed",
        invalid && "border-rose-500/50 focus-within:ring-rose-500/25 focus-within:border-rose-500/60 dark:border-rose-500/40",
        className
      )}
    >
      <select
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        aria-invalid={rest["aria-invalid"]}
        aria-describedby={rest["aria-describedby"]}
        name={rest.name}
        required={rest.required}
        className={cn(
          "appearance-none bg-transparent border-none outline-none w-full pr-6",
          "text-base sm:text-sm",
          "text-slate-900 dark:text-slate-200",
          disabled && "cursor-not-allowed"
        )}
      >
        <option value="" disabled>{placeholder || "Auswählen"}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </div>
  )
}

export default GlassSelect


