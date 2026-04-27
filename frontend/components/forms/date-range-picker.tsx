"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { FormField } from "@/components/ui/form-field"

type DateRangePickerProps = {
  start: string
  end?: string
  onStartChange: (value: string) => void
  onEndChange: (value: string) => void
  startLabel?: string
  endLabel?: string
  requiredStart?: boolean
  className?: string
}

export function DateRangePicker({
  start,
  end,
  onStartChange,
  onEndChange,
  startLabel = "Start",
  endLabel = "Ende",
  requiredStart = true,
  className,
}: DateRangePickerProps) {
  return (
    <div className={className || "grid grid-cols-1 gap-3 sm:grid-cols-2"}>
      <FormField id="date_start" label={startLabel} required={requiredStart}>
        {({ describedBy, invalid }) => (
          <Input
            id="date_start"
            type="date"
            value={start}
            onChange={(event) => onStartChange(event.target.value)}
            required={requiredStart}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
          />
        )}
      </FormField>
      <FormField id="date_end" label={endLabel}>
        {({ describedBy, invalid }) => (
          <Input
            id="date_end"
            type="date"
            value={end || ""}
            min={start || undefined}
            onChange={(event) => onEndChange(event.target.value)}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
          />
        )}
      </FormField>
    </div>
  )
}
