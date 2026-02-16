"use client"

import * as React from "react"
import { createPortal } from "react-dom"

type DialogProps = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}

export function Dialog({ open = false, onOpenChange, children }: DialogProps) {
  if (!open) return null
  // Render in a portal to avoid clipping by parent containers (overflow/transform)
  // e.g. account drawers / side panels.
  if (typeof document === "undefined") return null

  const node = (
    <div
      // Centered modal on all screen sizes (user-requested).
      className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6 overscroll-contain"
      onClick={() => onOpenChange?.(false)}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div
        className={[
          "relative z-10 w-full sm:w-auto",
          // Use dynamic viewport units for iOS to avoid “cut off” bottoms.
          "max-h-[calc(100dvh-1.25rem)] sm:max-h-[calc(100dvh-3rem)]",
          // Scrolling container for long forms
          "overflow-y-auto overscroll-contain mk-no-scrollbar",
        ].join(" ")}
        style={{
          paddingBottom: "max(env(safe-area-inset-bottom), 12px)",
          paddingTop: "max(env(safe-area-inset-top), 0px)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )

  return createPortal(node, document.body)
}

export function DialogContent({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <div
      className={
        "rounded-2xl sm:rounded-2xl border border-slate-200 dark:border-white/10 bg-white/85 dark:bg-slate-950/55 text-slate-900 dark:text-slate-100 shadow-2xl backdrop-blur-xl p-4 sm:p-5 " +
        // Extra safe-area so the last field + buttons never sit under iPhone home indicator.
        "pb-[max(env(safe-area-inset-bottom),16px)] " +
        (className || "")
      }
    >
      {children}
    </div>
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


