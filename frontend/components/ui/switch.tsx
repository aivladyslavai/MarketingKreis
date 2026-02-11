"use client"

import * as React from "react"

interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

export function Switch({ checked, onCheckedChange, disabled, className, ...rest }: SwitchProps) {
  return (
    <label
      className={
        "inline-flex items-center select-none " +
        (disabled ? "cursor-not-allowed opacity-60 " : "cursor-pointer ") +
        (className ? className : "")
      }
    >
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        {...rest}
      />
      <span
        className={
          "w-10 h-6 flex items-center rounded-full p-1 transition-colors " +
          (checked ? "bg-blue-600" : "bg-slate-500/50") +
          (disabled ? " saturate-50" : "")
        }
      >
        <span
          className={
            "bg-white w-4 h-4 rounded-full shadow-md transform transition-transform " +
            (checked ? "translate-x-4" : "translate-x-0")
          }
        />
      </span>
    </label>
  )
}

export default Switch


