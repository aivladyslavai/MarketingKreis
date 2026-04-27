"use client"

import * as React from "react"
import { FormField } from "@/components/ui/form-field"
import { GlassSelect } from "@/components/ui/glass-select"
import { useUserCategories } from "@/hooks/use-user-categories"

const DEFAULT_CATEGORIES = [
  { name: "Verkaufsförderung", color: "#3b82f6" },
  { name: "Image", color: "#a78bfa" },
  { name: "Employer Branding", color: "#10b981" },
  { name: "Kundenpflege", color: "#f59e0b" },
]

export function useFixedCategories() {
  const { categories, isLoading, error, save, reset, mutate } = useUserCategories()
  const fixed = React.useMemo(() => {
    const source = categories && categories.length > 0 ? categories : DEFAULT_CATEGORIES
    return source.slice(0, 5).map((category, index) => ({
      id: category.id,
      name: String(category.name || "").trim(),
      color: String(category.color || DEFAULT_CATEGORIES[index % DEFAULT_CATEGORIES.length]?.color || "#64748b"),
      position: category.position ?? index,
    })).filter((category) => category.name.length > 0)
  }, [categories])

  return { categories: fixed, isLoading, error, save, reset, mutate }
}

export function getCategoryColor(categories: Array<{ name: string; color: string }>, value?: string | null) {
  const found = categories.find((category) => category.name.toLowerCase() === String(value || "").trim().toLowerCase())
  return found?.color || "#64748b"
}

type CategoryPickerProps = {
  id: string
  label?: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  hint?: React.ReactNode
  className?: string
}

export function CategoryPicker({ id, label = "Kategorie", value, onChange, required, hint, className }: CategoryPickerProps) {
  const { categories } = useFixedCategories()

  React.useEffect(() => {
    if (value || categories.length === 0) return
    onChange(categories[0].name)
  }, [categories, onChange, value])

  const color = getCategoryColor(categories, value)

  return (
    <FormField id={id} label={label} required={required} hint={hint} className={className}>
      {({ describedBy, invalid }) => (
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
          <GlassSelect
            className="flex-1"
            value={value || categories[0]?.name || ""}
            onChange={(next) => onChange(String(next))}
            options={categories.map((category) => ({ value: category.name, label: category.name }))}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
          />
        </div>
      )}
    </FormField>
  )
}
