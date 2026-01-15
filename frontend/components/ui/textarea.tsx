"use client"

import * as React from "react"

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className = "", ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      // Mobile UX: use >=16px font to prevent iOS Safari auto-zoom.
      className={`w-full px-3 py-2 rounded-md bg-white text-base sm:text-sm text-slate-900 border border-slate-300 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:bg-slate-900/60 dark:text-slate-100 dark:border-slate-700 dark:placeholder:text-slate-400 ${className}`}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export default Textarea



