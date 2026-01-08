import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class BudgetService {
  constructor(private prisma: PrismaService) {}

  async getBudgetPlans() {
    return this.prisma.budgetPlan.findMany()
  }
}
