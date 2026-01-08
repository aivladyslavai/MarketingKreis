import { Controller, Get, UseInterceptors } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { AnalyticsService } from './analytics.service'
import { Cache } from '../common/decorators/cache.decorator'
import { CacheInterceptor } from '../common/interceptors/cache.interceptor'

@ApiTags('analytics')
@Controller('analytics')
@UseInterceptors(CacheInterceptor)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  @ApiOperation({ summary: 'Get analytics data' })
  @ApiResponse({ status: 200, description: 'Returns analytics data' })
  @Cache({ key: 'analytics:main', ttl: 120 }) // Cache for 2 minutes (analytics data changes frequently)
  getAnalytics() {
    return this.analyticsService.getAnalytics()
  }
}
