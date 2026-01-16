"use client"

import * as React from "react"

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
}

export function GlassSelect({ value, onChange, placeholder, options, className = "", disabled }: GlassSelectProps) {
  return (
    <div className={`relative group rounded-xl h-11 sm:h-10 flex items-center px-3 border transition-colors backdrop-blur-md bg-white/10 dark:bg-slate-900/50 border-white/20 dark:border-slate-700 focus-within:border-blue-400/50 focus-within:ring-1 focus-within:ring-blue-500/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ${className}`}>
      <select
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        className="appearance-none bg-transparent border-none outline-none w-full text-base sm:text-sm text-slate-900 dark:text-slate-200 pr-6"
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


