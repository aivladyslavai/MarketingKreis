// CRM API wrapper для работы с данными CRM
import { companiesAPI, contactsAPI, dealsAPI } from "./api"

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
  stage: "LEAD" | "QUALIFIED" | "PROPOSAL" | "NEGOTIATION" | "WON" | "LOST"
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

// Simple input DTOs for creating/updating CRM entities from the UI.
export type CreateCompanyData = {
  name: string
  industry?: string
  size?: string
  revenue?: number
  status?: string
}

export type CreateContactData = {
  name: string
  email: string
  phone?: string
  companyId?: string
  position?: string
}

export type CreateDealData = {
  title: string
  value: number
  stage?: Deal["stage"]
  probability?: number
  companyId?: string
  closeDate?: string
}

class CRMApi {
  async getDeals(): Promise<Deal[]> {
    try {
      const response = await dealsAPI.getAll()
      return response || []
    } catch (error) {
      console.warn("Failed to fetch deals:", error)
      return [] // No fallback data - only real CRM data
    }
  }

  async getCompanies(): Promise<Company[]> {
    try {
      const response = await companiesAPI.getAll()
      return response || []
    } catch (error) {
      console.warn("Failed to fetch companies:", error)
      return [] // No fallback data - only real CRM data
    }
  }

  async getContacts(): Promise<Contact[]> {
    try {
      const response = await contactsAPI.getAll()
      return response || []
    } catch (error) {
      console.warn("Failed to fetch contacts:", error)
      return [] // No fallback data - only real CRM data
    }
  }

  async createCompany(data: CreateCompanyData): Promise<Company> {
    return (await companiesAPI.create(data)) as Company
  }

  async updateCompany(id: string, data: Partial<CreateCompanyData>): Promise<Company> {
    return (await companiesAPI.update(id, data)) as Company
  }

  async deleteCompany(id: string): Promise<void> {
    await companiesAPI.delete(id)
  }

  async createContact(data: CreateContactData): Promise<Contact> {
    return (await contactsAPI.create(data)) as Contact
  }

  async updateContact(id: string, data: Partial<CreateContactData>): Promise<Contact> {
    return (await contactsAPI.update(id, data)) as Contact
  }

  async deleteContact(id: string): Promise<void> {
    await contactsAPI.delete(id)
  }

  async createDeal(data: CreateDealData): Promise<Deal> {
    return (await dealsAPI.create(data)) as Deal
  }

  async updateDeal(id: string, data: Partial<CreateDealData>): Promise<Deal> {
    return (await dealsAPI.update(id, data)) as Deal
  }

  async deleteDeal(id: string): Promise<void> {
    await dealsAPI.delete(id)
  }
}

export const crmApi = new CRMApi()