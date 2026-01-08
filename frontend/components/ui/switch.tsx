"use client"

import * as React from "react"

interface SwitchProps extends React.HTMLAttributes<HTMLInputElement> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

export function Switch({ checked, onCheckedChange, ...rest }: SwitchProps) {
  return (
    <label className="inline-flex items-center cursor-pointer select-none">
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        {...rest}
      />
      <span
        className={
          "w-10 h-6 flex items-center rounded-full p-1 transition-colors " +
          (checked ? "bg-blue-600" : "bg-slate-500/50")
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


