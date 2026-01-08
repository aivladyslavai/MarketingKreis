// Utility helpers


import { type ClassValue } from "clsx"
import clsx from "clsx"

export function cn(...inputs: ClassValue[]) {
  // Lightweight className combiner without tailwind-merge to avoid dependency
  return clsx(inputs)
}

export function formatNumber(value: number | string | null | undefined): string {
  const n = Number(value ?? 0)
  return n.toLocaleString("de-CH")
}

export function formatCurrency(
  value: number | string | null | undefined,
  currency: string = "CHF",
): string {
  const n = Number(value ?? 0)
  return new Intl.NumberFormat("de-CH", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n)
}

export function formatDateShort(value: Date | string | number | null | undefined): string {
  if (value == null) return ""
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return ""
  return d.toLocaleDateString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  })
}

