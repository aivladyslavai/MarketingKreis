import { Controller, Get, UseInterceptors } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { CrmService } from './crm.service'
import { Cache } from '../common/decorators/cache.decorator'
import { CacheInterceptor } from '../common/interceptors/cache.interceptor'

@ApiTags('crm')
@Controller('crm')
@UseInterceptors(CacheInterceptor)
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  @Get('companies')
  @ApiOperation({ summary: 'Get all companies' })
  @ApiResponse({ status: 200, description: 'Returns list of companies' })
  @Cache({ key: 'crm:companies', ttl: 300 }) // Cache for 5 minutes
  getCompanies() {
    return this.crmService.getCompanies()
  }

  @Get('contacts')
  @ApiOperation({ summary: 'Get all contacts' })
  @ApiResponse({ status: 200, description: 'Returns list of contacts' })
  @Cache({ key: 'crm:contacts', ttl: 300 }) // Cache for 5 minutes
  getContacts() {
    return this.crmService.getContacts()
  }

  @Get('deals')
  @ApiOperation({ summary: 'Get all deals' })
  @ApiResponse({ status: 200, description: 'Returns list of deals' })
  @Cache({ key: 'crm:deals', ttl: 180 }) // Cache for 3 minutes (more dynamic data)
  getDeals() {
    return this.crmService.getDeals()
  }
}
