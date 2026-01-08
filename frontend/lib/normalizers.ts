export type NormalizedPriority = 'HIGH' | 'MEDIUM' | 'LOW'
// Align with Activity type in radial-circle.tsx
// (single set above is canonical)

export type NormalizedStatus = 'ACTIVE' | 'DONE' | 'PLANNED' | 'PAUSED' | 'CANCELLED'

export function normalizePriority(value: unknown): NormalizedPriority {
  const v = (typeof value === 'string' ? value : '').toUpperCase()
  if (v === 'HIGH') return 'HIGH'
  if (v === 'MEDIUM') return 'MEDIUM'
  if (v === 'LOW') return 'LOW'
  return 'MEDIUM'
}

export function normalizeStatus(value: unknown): NormalizedStatus {
  const v = (typeof value === 'string' ? value : '').toUpperCase()
  if (v === 'ACTIVE') return 'ACTIVE'
  if (v === 'DONE' || v === 'COMPLETED' || v === 'FINISHED') return 'DONE'
  if (v === 'PAUSED') return 'PAUSED'
  if (v === 'CANCELLED' || v === 'CANCELED') return 'CANCELLED'
  if (v === 'PLANNED' || v === 'PENDING') return 'PLANNED'
  return 'PLANNED'
}

export function normalizeTags(value: unknown): string[] {
  if (!value) return []
  if (Array.isArray(value)) return value.map(String)
  if (typeof value === 'string') return value.split(',').map(s => s.trim()).filter(Boolean)
  return []
}

export function safeDate(value: unknown, fallback?: Date): Date {
  try {
    const d = value ? new Date(value as any) : undefined
    return isNaN(d as any) ? (fallback ?? new Date()) : (d as Date)
  } catch {
    return fallback ?? new Date()
  }
}















