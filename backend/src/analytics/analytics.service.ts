import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getAnalytics() {
    // TODO: Implement analytics
    return { message: 'Analytics - to be implemented' }
  }
}
