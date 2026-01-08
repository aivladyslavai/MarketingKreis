import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class CrmService {
  constructor(private prisma: PrismaService) {}

  async getCompanies() {
    return this.prisma.company.findMany()
  }

  async getContacts() {
    return this.prisma.contact.findMany()
  }

  async getDeals() {
    return this.prisma.deal.findMany()
  }
}
