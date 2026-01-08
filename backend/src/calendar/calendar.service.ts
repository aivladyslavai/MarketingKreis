import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class CalendarService {
  constructor(private prisma: PrismaService) {}

  async getCalendarItems(year: number, month?: number) {
    // TODO: Implement calendar functionality
    return []
  }
}
