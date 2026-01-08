import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export interface ExportData {
  activities?: any[]
  budget?: any[]
  leads?: any[]
  content?: any[]
  companies?: any[]
  contacts?: any[]
  deals?: any[]
}

export type ExportFormat = 'csv' | 'xlsx' | 'pdf' | 'json'

export class ExportService {
  // Export to CSV
  static async exportToCSV(data: any[], filename: string) {
    if (!data || data.length === 0) {
      throw new Error('No data to export')
    }

    // Convert objects to CSV
    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header]
          // Handle nested objects and arrays
          if (typeof value === 'object' && value !== null) {
            return `"${JSON.stringify(value).replace(/"/g, '""')}"`
          }
          // Escape quotes and wrap in quotes if contains comma
          const stringValue = String(value || '')
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`
          }
          return stringValue
        }).join(',')
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    saveAs(blob, `${filename}.csv`)
  }

  // Export to Excel
  static async exportToExcel(data: ExportData, filename: string) {
    const workbook = XLSX.utils.book_new()

    // Add sheets for each data type
    if (data.activities && data.activities.length > 0) {
      const activitiesSheet = XLSX.utils.json_to_sheet(data.activities.map(activity => ({
        'ID': activity.id,
        'Titel': activity.title,
        'Kategorie': activity.category,
        'Status': activity.status,
        'Budget CHF': activity.budgetCHF,
        'Erwartete Leads': activity.expectedLeads,
        'Tatsächliche Leads': activity.actualLeads || 0,
        'Gewichtung %': activity.weight,
        'Startdatum': activity.start ? new Date(activity.start).toLocaleDateString('de-CH') : '',
        'Enddatum': activity.end ? new Date(activity.end).toLocaleDateString('de-CH') : '',
        'Verantwortlicher': activity.owner?.name || '',
        'Unternehmen': activity.company?.name || '',
        'Notizen': activity.notes || '',
        'Erstellt': new Date(activity.createdAt).toLocaleDateString('de-CH'),
        'Aktualisiert': new Date(activity.updatedAt).toLocaleDateString('de-CH'),
      })))
      XLSX.utils.book_append_sheet(workbook, activitiesSheet, 'Aktivitäten')
    }

    if (data.budget && data.budget.length > 0) {
      const budgetSheet = XLSX.utils.json_to_sheet(data.budget.map(item => ({
        'Periode': item.period,
        'Kategorie': item.category,
        'Geplant CHF': item.planned,
        'Ist CHF': item.actual,
        'Abweichung CHF': item.actual - item.planned,
        'Abweichung %': ((item.actual - item.planned) / item.planned * 100).toFixed(2) + '%',
      })))
      XLSX.utils.book_append_sheet(workbook, budgetSheet, 'Budget')
    }

    if (data.leads && data.leads.length > 0) {
      const leadsSheet = XLSX.utils.json_to_sheet(data.leads.map(lead => ({
        'Datum': new Date(lead.date).toLocaleDateString('de-CH'),
        'Leads': lead.leads,
        'Quelle': lead.source || '',
        'Kosten CHF': lead.cost || 0,
        'CPL CHF': lead.cost && lead.leads ? (lead.cost / lead.leads).toFixed(2) : '',
        'Aktivität': lead.activity?.title || '',
      })))
      XLSX.utils.book_append_sheet(workbook, leadsSheet, 'Leads')
    }

    if (data.content && data.content.length > 0) {
      const contentSheet = XLSX.utils.json_to_sheet(data.content.map(task => ({
        'ID': task.id,
        'Titel': task.title,
        'Kanal': task.channel,
        'Format': task.format || '',
        'Status': task.status,
        'Priorität': task.priority,
        'Deadline': task.deadline ? new Date(task.deadline).toLocaleDateString('de-CH') : '',
        'Verantwortlicher': task.owner?.name || '',
        'Aktivität': task.activity?.title || '',
        'Assets': task.assets ? task.assets.length : 0,
        'Notizen': task.notes || '',
        'Erstellt': new Date(task.createdAt).toLocaleDateString('de-CH'),
      })))
      XLSX.utils.book_append_sheet(workbook, contentSheet, 'Content')
    }

    if (data.companies && data.companies.length > 0) {
      const companiesSheet = XLSX.utils.json_to_sheet(data.companies.map(company => ({
        'ID': company.id,
        'Name': company.name,
        'Domain': company.domain || '',
        'Branche': company.industry || '',
        'Größe': company.size || '',
        'Notizen': company.notes || '',
        'Erstellt': new Date(company.createdAt).toLocaleDateString('de-CH'),
      })))
      XLSX.utils.book_append_sheet(workbook, companiesSheet, 'Unternehmen')
    }

    if (data.contacts && data.contacts.length > 0) {
      const contactsSheet = XLSX.utils.json_to_sheet(data.contacts.map(contact => ({
        'ID': contact.id,
        'Name': contact.name,
        'E-Mail': contact.email || '',
        'Telefon': contact.phone || '',
        'Position': contact.position || '',
        'Unternehmen': contact.company?.name || '',
        'Notizen': contact.notes || '',
        'Erstellt': new Date(contact.createdAt).toLocaleDateString('de-CH'),
      })))
      XLSX.utils.book_append_sheet(workbook, contactsSheet, 'Kontakte')
    }

    if (data.deals && data.deals.length > 0) {
      const dealsSheet = XLSX.utils.json_to_sheet(data.deals.map(deal => ({
        'ID': deal.id,
        'Titel': deal.title,
        'Status': deal.stage,
        'Wert CHF': deal.value || 0,
        'Wahrscheinlichkeit %': deal.probability || 0,
        'Abschlussdatum': deal.closeDate ? new Date(deal.closeDate).toLocaleDateString('de-CH') : '',
        'Unternehmen': deal.company?.name || '',
        'Notizen': deal.notes || '',
        'Erstellt': new Date(deal.createdAt).toLocaleDateString('de-CH'),
      })))
      XLSX.utils.book_append_sheet(workbook, dealsSheet, 'Deals')
    }

    // Write file
    XLSX.writeFile(workbook, `${filename}.xlsx`)
  }

  // Export to PDF
  static async exportToPDF(elementId: string, filename: string, options?: {
    format?: 'a4' | 'a3' | 'letter'
    orientation?: 'portrait' | 'landscape'
    includeCharts?: boolean
  }) {
    const element = document.getElementById(elementId)
    if (!element) {
      throw new Error(`Element with ID '${elementId}' not found`)
    }

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
    })

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({
      orientation: options?.orientation || 'portrait',
      unit: 'mm',
      format: options?.format || 'a4',
    })

    const imgWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight

    let position = 0

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    pdf.save(`${filename}.pdf`)
  }

  // Export Marketing Circle as SVG
  static async exportCircleAsSVG(filename: string) {
    const svgElement = document.querySelector('.circle-svg')
    if (!svgElement) {
      throw new Error('Marketing Circle SVG not found')
    }

    // Clone the SVG to avoid modifying the original
    const clonedSvg = svgElement.cloneNode(true) as SVGElement
    
    // Add proper SVG namespace and styling
    clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    clonedSvg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink')
    
    // Add styles inline
    const styles = `
      <style>
        .circle-point { cursor: pointer; transition: all 0.2s ease-out; }
        .circle-connector { stroke: #d1d5db; transition: all 0.2s ease-out; }
        .circle-label { font-family: Inter, sans-serif; font-size: 14px; font-weight: 500; }
      </style>
    `
    clonedSvg.insertAdjacentHTML('afterbegin', styles)

    const serializer = new XMLSerializer()
    const svgString = serializer.serializeToString(clonedSvg)
    
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
    saveAs(blob, `${filename}.svg`)
  }

  // Export to JSON
  static async exportToJSON(data: any, filename: string) {
    const jsonString = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' })
    saveAs(blob, `${filename}.json`)
  }

  // Generate comprehensive report
  static async generateReport(data: ExportData, filename: string = 'marketing-report') {
    const reportData = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalActivities: data.activities?.length || 0,
        totalBudget: data.budget?.reduce((sum, item) => sum + item.planned, 0) || 0,
        totalSpent: data.budget?.reduce((sum, item) => sum + item.actual, 0) || 0,
        totalLeads: data.leads?.reduce((sum, item) => sum + item.leads, 0) || 0,
        totalContentTasks: data.content?.length || 0,
        totalCompanies: data.companies?.length || 0,
        totalDeals: data.deals?.length || 0,
      },
      ...data
    }

    return this.exportToJSON(reportData, filename)
  }
}

// Helper function to download any file
export function downloadFile(data: Blob | string, filename: string, type?: string) {
  const blob = typeof data === 'string' 
    ? new Blob([data], { type: type || 'text/plain' })
    : data
  
  saveAs(blob, filename)
}

// Export hook for React components
export function useExport() {
  return {
    exportCSV: ExportService.exportToCSV,
    exportExcel: ExportService.exportToExcel,
    exportPDF: ExportService.exportToPDF,
    exportSVG: ExportService.exportCircleAsSVG,
    exportJSON: ExportService.exportToJSON,
    generateReport: ExportService.generateReport,
  }
}
