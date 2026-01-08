"use client"

import * as React from "react"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className = "", ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={`w-full h-10 px-3 rounded-md bg-white text-slate-900 border border-slate-300 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:bg-slate-900/60 dark:text-slate-100 dark:border-slate-700 dark:placeholder:text-slate-400 ${className}`}
      {...props}
    />
  )
})
Input.displayName = "Input"

export default Input


