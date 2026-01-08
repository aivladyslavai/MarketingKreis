import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, getWeek, getYear, parseISO, isValid } from 'date-fns'
import { de } from 'date-fns/locale'

export interface ISOWeek {
  week: number
  year: number
  label: string
  startDate: Date
  endDate: Date
}

export function getISOWeek(date: Date): ISOWeek {
  const week = getWeek(date, { weekStartsOn: 1 }) // ISO week starts on Monday
  const year = getYear(date)
  const startDate = startOfWeek(date, { weekStartsOn: 1 })
  const endDate = endOfWeek(date, { weekStartsOn: 1 })
  
  return {
    week,
    year,
    label: `KW${week.toString().padStart(2, '0')}`,
    startDate,
    endDate,
  }
}

export function getISOWeekFromWeekNumber(weekNumber: number, year: number): ISOWeek {
  // Start with January 4th, which is always in week 1 of the ISO year
  const jan4 = new Date(year, 0, 4)
  const startOfYear = startOfWeek(jan4, { weekStartsOn: 1 })
  const targetWeekStart = addWeeks(startOfYear, weekNumber - 1)
  
  return getISOWeek(targetWeekStart)
}

export function getCurrentISOWeek(): ISOWeek {
  return getISOWeek(new Date())
}

export function getWeeksInYear(year: number): ISOWeek[] {
  const weeks: ISOWeek[] = []
  
  // ISO 8601 defines that a year has 52 or 53 weeks
  // December 28th is always in the last week of the year
  const dec28 = new Date(year, 11, 28)
  const lastWeek = getWeek(dec28, { weekStartsOn: 1 })
  
  for (let weekNum = 1; weekNum <= lastWeek; weekNum++) {
    weeks.push(getISOWeekFromWeekNumber(weekNum, year))
  }
  
  return weeks
}

export function formatWeekRange(isoWeek: ISOWeek): string {
  if (isoWeek.startDate.getMonth() === isoWeek.endDate.getMonth()) {
    // Same month
    return `${format(isoWeek.startDate, 'd', { locale: de })}–${format(isoWeek.endDate, 'd. MMM yyyy', { locale: de })}`
  } else {
    // Different months
    return `${format(isoWeek.startDate, 'd. MMM', { locale: de })} – ${format(isoWeek.endDate, 'd. MMM yyyy', { locale: de })}`
  }
}

export function getWeekLabel(weekNumber: number): string {
  return `KW${weekNumber.toString().padStart(2, '0')}`
}

export function dateToAngle(date: Date): number {
  const isoWeek = getISOWeek(date)
  const weeksInYear = getWeeksInYear(isoWeek.year).length
  
  // Convert week to angle (0° at top, clockwise)
  // Week 1 starts at the top (270° or -90°)
  const weekProgress = (isoWeek.week - 1) / weeksInYear
  const angle = (weekProgress * 360 - 90) % 360
  
  return angle < 0 ? angle + 360 : angle
}

export function angleToDate(angle: number, year: number): Date {
  // Convert angle back to week
  // Normalize angle to 0-360
  const normalizedAngle = ((angle + 90) % 360 + 360) % 360
  const weeksInYear = getWeeksInYear(year).length
  const weekProgress = normalizedAngle / 360
  const weekNumber = Math.round(weekProgress * weeksInYear) + 1
  
  // Clamp to valid week range
  const clampedWeek = Math.max(1, Math.min(weeksInYear, weekNumber))
  
  return getISOWeekFromWeekNumber(clampedWeek, year).startDate
}

export function getQuarterFromDate(date: Date): number {
  const month = date.getMonth()
  return Math.floor(month / 3) + 1
}

export function getQuarterLabel(quarter: number, year: number): string {
  return `Q${quarter} ${year}`
}

export function getMonthLabel(date: Date): string {
  return format(date, 'MMMM yyyy', { locale: de })
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(d)) return '--'
  return format(d, 'dd.MM.yyyy')
}

export function formatDateMedium(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(d)) return '--'
  return format(d, 'd. MMM yyyy', { locale: de })
}

export function formatDateLong(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(d)) return '--'
  return format(d, 'EEEE, d. MMMM yyyy', { locale: de })
}

export function getWeekdayName(date: Date): string {
  return format(date, 'EEEE', { locale: de })
}

export function getMonthName(date: Date): string {
  return format(date, 'MMMM', { locale: de })
}

// Calendar utilities
export function getCalendarWeeks(year: number, month: number): Date[][] {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  
  const startDate = startOfWeek(firstDay, { weekStartsOn: 1 })
  const endDate = endOfWeek(lastDay, { weekStartsOn: 1 })
  
  const weeks: Date[][] = []
  let currentDate = new Date(startDate)
  
  while (currentDate <= endDate) {
    const week: Date[] = []
    for (let i = 0; i < 7; i++) {
      week.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }
    weeks.push(week)
  }
  
  return weeks
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return date1.toDateString() === date2.toDateString()
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date())
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
}
