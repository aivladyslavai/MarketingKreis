"use client"

import * as React from "react"

export function Popover({ children }: { children: React.ReactNode }) {
  return <div className="relative inline-block">{children}</div>
}

export function PopoverTrigger({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) {
  return <div>{children}</div>
}

export function PopoverContent({ children, className = "", align, sideOffset }: { children: React.ReactNode; className?: string; align?: string; sideOffset?: number }) {
  return (
    <div className={`absolute z-50 mt-2 rounded-md border border-slate-700 bg-slate-900 p-3 shadow-xl ${className}`}>{children}</div>
  )
}


