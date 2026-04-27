"use client"

import * as React from "react"
import { FormField } from "@/components/ui/form-field"
import { GlassSelect } from "@/components/ui/glass-select"

export type RelationOption = {
  value: string
  label: string
  description?: string
}

type RelationPickerProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  options: RelationOption[]
  placeholder?: string
  required?: boolean
  hint?: React.ReactNode
  className?: string
}

export function RelationPicker({
  id,
  label,
  value,
  onChange,
  options,
  placeholder,
  required,
  hint,
  className,
}: RelationPickerProps) {
  return (
    <FormField id={id} label={label} required={required} hint={hint} className={className}>
      {({ describedBy, invalid }) => (
        <GlassSelect
          className="w-full"
          value={value}
          onChange={(next) => onChange(String(next))}
          options={options.length > 0 ? options : [{ value: "", label: placeholder || "Keine Optionen" }]}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
        />
      )}
    </FormField>
  )
}
