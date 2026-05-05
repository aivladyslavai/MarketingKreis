"use client"

import * as React from "react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive" | "secondary"
  size?: "sm" | "md" | "lg" | "icon"
}

const BASE_CLASSES =
  // Mobile UX: enforce comfortable tap targets (44px) on small screens.
  // On >=sm we allow compact heights again.
  "inline-flex items-center justify-center rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none min-h-11 min-w-11 sm:min-h-0 sm:min-w-0"

const VARIANT_CLASSES: Record<NonNullable<ButtonProps["variant"]>, string> = {
  default:
    "bg-primary text-primary-foreground hover:bg-kaboom-red-dark focus:ring-primary shadow-sm",
  outline:
    "border border-border text-foreground hover:bg-secondary focus:ring-primary",
  ghost:
    "text-foreground hover:bg-secondary focus:ring-primary",
  destructive:
    "bg-destructive text-destructive-foreground hover:bg-kaboom-red-dark focus:ring-destructive",
  secondary:
    "bg-kaboom-black text-kaboom-white hover:bg-kaboom-black/90 focus:ring-kaboom-black dark:bg-white dark:text-kaboom-black dark:hover:bg-white/90",
}

const SIZE_CLASSES: Record<NonNullable<ButtonProps["size"]>, string> = {
  // Mobile first: slightly larger, prevents “tiny buttons” on phones.
  // Desktop keeps previous compact sizes.
  sm: "h-11 sm:h-8 px-3 text-sm",
  md: "h-11 sm:h-10 px-4 text-sm",
  lg: "h-12 px-6",
  icon: "h-11 w-11 sm:h-10 sm:w-10",
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


