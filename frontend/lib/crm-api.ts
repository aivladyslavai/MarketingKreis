// CRM API wrapper для работы с данными CRM
import { companiesAPI, contactsAPI, dealsAPI, projectsAPI } from "./api"

export interface Company {
  id: string
  name: string
  industry?: string
  size?: string
  revenue?: number
  status?: string
}

export interface Project {
  id: string
  title: string
  value: number
  stage: "LEAD" | "QUALIFIED" | "PROPOSAL" | "NEGOTIATION" | "WON" | "LOST"
  probability: number
  company?: Company
  closeDate?: string
}

export type Deal = Project

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

export type CreateProjectData = {
  title: string
  value: number
  stage?: Project["stage"]
  probability?: number
  companyId?: string
  closeDate?: string
}

export type CreateDealData = CreateProjectData

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

  async getProjects(): Promise<Project[]> {
    try {
      const response = await projectsAPI.getAll()
      return response || []
    } catch (error) {
      console.warn("Failed to fetch projects:", error)
      return []
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

  async createProject(data: CreateProjectData): Promise<Project> {
    return (await projectsAPI.create(data)) as Project
  }

  async updateDeal(id: string, data: Partial<CreateDealData>): Promise<Deal> {
    return (await dealsAPI.update(id, data)) as Deal
  }

  async updateProject(id: string, data: Partial<CreateProjectData>): Promise<Project> {
    return (await projectsAPI.update(id, data)) as Project
  }

  async deleteDeal(id: string): Promise<void> {
    await dealsAPI.delete(id)
  }

  async deleteProject(id: string): Promise<void> {
    await projectsAPI.delete(id)
  }
}

export const crmApi = new CRMApi()