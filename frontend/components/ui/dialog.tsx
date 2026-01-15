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
      // Mobile UX: bottom-sheet style on small screens, centered on >=sm.
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-6"
      onClick={() => onOpenChange?.(false)}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative z-10 w-full sm:w-auto max-h-[85vh] overflow-auto"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0px)" }}
        onClick={(e)=> e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

export function DialogContent({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <div className={"rounded-2xl sm:rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl p-4 "+(className||"")}>{children}</div>
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
  // Mobile UX: stack actions and make them full-width.
  return (
    <div className="mt-4 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 [&>*]:w-full sm:[&>*]:w-auto">
      {children}
    </div>
  )
}


