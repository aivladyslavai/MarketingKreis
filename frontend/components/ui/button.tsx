"use client"

import * as React from "react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive" | "secondary"
  size?: "sm" | "md" | "lg" | "icon"
}

const BASE_CLASSES =
  "inline-flex items-center justify-center rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"

const VARIANT_CLASSES: Record<NonNullable<ButtonProps["variant"]>, string> = {
  default: "bg-blue-600 text-white hover:bg-blue-500 focus:ring-blue-600",
  outline:
    "border border-slate-300 text-slate-700 hover:bg-slate-100 focus:ring-blue-600 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800",
  ghost: "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800/60",
  destructive: "bg-red-600 text-white hover:bg-red-500 focus:ring-red-600",
  secondary:
    "bg-slate-900 text-slate-50 hover:bg-slate-800 focus:ring-slate-900 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200",
}

const SIZE_CLASSES: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6",
  icon: "h-10 w-10",
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "md", ...props }, ref) => {
    const variantKey = variant || "default"
    const sizeKey = size || "md"
    return (
      <button
        ref={ref}
        className={`${BASE_CLASSES} ${VARIANT_CLASSES[variantKey]} ${SIZE_CLASSES[sizeKey]} ${className}`}
        {...props}
      />
    )
  },
)
Button.displayName = "Button"

export function buttonVariants({ variant = "default" }: { variant?: ButtonProps["variant"] } = {}) {
  const key = variant || "default"
  return VARIANT_CLASSES[key]
}


