// CRM API wrapper для работы с данными CRM
import { companiesAPI, contactsAPI, dealsAPI } from './api'

export interface Company {
  id: string
  name: string
  industry?: string
  size?: string
  revenue?: number
  status?: string
}

export interface Deal {
  id: string
  title: string
  value: number
  stage: 'LEAD' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'WON' | 'LOST'
  probability: number
  company?: Company
  closeDate?: string
}

export interface Contact {
  id: string
  name: string
  email: string
  phone?: string
  company?: Company
  position?: string
}

class CRMApi {
  async getDeals(): Promise<Deal[]> {
    try {
      const response = await dealsAPI.getAll()
      return response || []
    } catch (error) {
      console.warn('Failed to fetch deals:', error)
      return [] // No fallback data - only real CRM data
    }
  }

  async getCompanies(): Promise<Company[]> {
    try {
      const response = await companiesAPI.getAll()
      return response || []
    } catch (error) {
      console.warn('Failed to fetch companies:', error)
      return [] // No fallback data - only real CRM data
    }
  }

  async getContacts(): Promise<Contact[]> {
    try {
      const response = await contactsAPI.getAll()
      return response || []
    } catch (error) {
      console.warn('Failed to fetch contacts:', error)
      return [] // No fallback data - only real CRM data
    }
  }
}

export const crmApi = new CRMApi()