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

// KA BOOM brand-aligned categorical palette.
// Anchored on brand red, extended with warm + neutral hues so the platform
// reads as one corporate family across charts, badges and Marketing Circle.
export const CATEGORY_COLORS: Record<CategoryType, string> = {
  VERKAUFSFOERDERUNG: '#E62E3E', // kaboom red — primary brand
  IMAGE: '#1A1A1A',              // kaboom black
  EMPLOYER_BRANDING: '#A8202D',  // deep brand red
  KUNDENPFLEGE: '#F2A65A',       // warm sand
  DIGITAL_MARKETING: '#5A5A5A',  // graphite
  EVENTS: '#F26E5A',             // coral
  CONTENT: '#8C8C8C',            // mid grey
  SEO: '#D9544A',                // tomato
  PR: '#3B3B3B',                 // charcoal
}

// Default palette for performance charts and other visualizations.
// Order chosen so adjacent series have strong contrast.
export const chartColors: string[] = [
  CATEGORY_COLORS.VERKAUFSFOERDERUNG,
  CATEGORY_COLORS.IMAGE,
  CATEGORY_COLORS.KUNDENPFLEGE,
  CATEGORY_COLORS.EMPLOYER_BRANDING,
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
