export type CategoryType = 
  | 'VERKAUFSFOERDERUNG' 
  | 'IMAGE' 
  | 'EMPLOYER_BRANDING' 
  | 'KUNDENPFLEGE'
  | 'DIGITAL_MARKETING'
  | 'EVENTS'
  | 'CONTENT'
  | 'SEO'
  | 'PR'

export const CATEGORY_COLORS: Record<CategoryType, string> = {
  VERKAUFSFOERDERUNG: '#3b82f6', // blue
  IMAGE: '#8b5cf6', // purple
  EMPLOYER_BRANDING: '#10b981', // green
  KUNDENPFLEGE: '#f59e0b', // orange
  DIGITAL_MARKETING: '#06b6d4', // cyan
  EVENTS: '#ec4899', // pink
  CONTENT: '#14b8a6', // teal
  SEO: '#f97316', // orange
  PR: '#6366f1', // indigo
}

// Default palette for performance charts and other visualizations
export const chartColors: string[] = [
  CATEGORY_COLORS.VERKAUFSFOERDERUNG,
  CATEGORY_COLORS.IMAGE,
  CATEGORY_COLORS.EMPLOYER_BRANDING,
  CATEGORY_COLORS.KUNDENPFLEGE,
  CATEGORY_COLORS.DIGITAL_MARKETING,
]

export function getCategoryColor(category: CategoryType | string): string {
  const normalizedCategory = category.toUpperCase().replace(/\s+/g, '_') as CategoryType
  return CATEGORY_COLORS[normalizedCategory] || '#6b7280' // default gray
}

export function getCategoryLabel(category: CategoryType): string {
  const labels: Record<CategoryType, string> = {
    VERKAUFSFOERDERUNG: 'Verkaufsförderung',
    IMAGE: 'Image',
    EMPLOYER_BRANDING: 'Employer Branding',
    KUNDENPFLEGE: 'Kundenpflege',
    DIGITAL_MARKETING: 'Digital Marketing',
    EVENTS: 'Events',
    CONTENT: 'Content',
    SEO: 'SEO',
    PR: 'PR & Media',
  }
  return labels[category] || category
}
