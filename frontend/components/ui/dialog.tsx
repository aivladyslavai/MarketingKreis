"use client"

import * as React from "react"

type DialogProps = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}

export function Dialog({ open = false, onOpenChange, children }: DialogProps) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center"
      onClick={() => onOpenChange?.(false)}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative z-10 max-h-[90vh] overflow-auto" onClick={(e)=> e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

export function DialogContent({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <div className={"rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl p-4 "+(className||"")}>{children}</div>
  )
}

export function DialogHeader({ children }: { children?: React.ReactNode }) {
  return <div className="mb-3 space-y-1">{children}</div>
}

export function DialogTitle({ children }: { children?: React.ReactNode }) {
  return <h3 className="text-lg font-semibold">{children}</h3>
}

export function DialogDescription({ children }: { children?: React.ReactNode }) {
  return <p className="text-sm text-slate-600 dark:text-slate-400">{children}</p>
}

export function DialogFooter({ children }: { children?: React.ReactNode }) {
  return <div className="mt-4 flex items-center justify-end gap-2">{children}</div>
}


