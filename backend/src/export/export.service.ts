import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class ExportService {
  constructor(private prisma: PrismaService) {}

  async exportData(format: string) {
    // TODO: Implement data export
    return { message: `Export in ${format} format - to be implemented` }
  }
}
