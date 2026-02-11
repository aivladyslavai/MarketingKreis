"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className = "", ...props }, ref) => {
  const invalid = props["aria-invalid"] === true || props["aria-invalid"] === "true"
  return (
    <textarea
      ref={ref}
      // Mobile UX: use >=16px font to prevent iOS Safari auto-zoom.
      className={cn(
        "w-full px-3 py-2 rounded-xl border transition-colors",
        // background / text
        "bg-white text-slate-900 border-slate-200",
        "dark:bg-slate-950/30 dark:text-slate-100 dark:border-white/10",
        // placeholder
        "placeholder:text-slate-500 dark:placeholder:text-slate-500",
        // focus
        "focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500/40",
        "dark:focus:ring-blue-500/30 dark:focus:border-blue-400/40",
        // disabled
        "disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100/80",
        "dark:disabled:bg-slate-950/20",
        // invalid
        invalid &&
          "border-rose-500/50 focus:ring-rose-500/25 focus:border-rose-500/60 dark:border-rose-500/40 dark:focus:ring-rose-500/25 dark:focus:border-rose-400/50",
        // typography
        "text-base sm:text-sm",
        className
      )}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export default Textarea



