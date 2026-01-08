import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { ThrottlerModule } from '@nestjs/throttler'
import { APP_GUARD } from '@nestjs/core'
import { ThrottlerGuard } from '@nestjs/throttler'
import { PrismaModule } from './prisma/prisma.module'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'
import { CacheModule } from './common/cache/cache.module'

import { CalendarModule } from './calendar/calendar.module'
import { BudgetModule } from './budget/budget.module'
import { ContentModule } from './content/content.module'
import { CrmModule } from './crm/crm.module'
import { MarketingDataModule } from './marketing-data/marketing-data.module'
import { ReportsModule } from './reports/reports.module'
import { ExportModule } from './export/export.module'
import { AnalyticsModule } from './analytics/analytics.module'
import { HealthModule } from './health/health.module'
import { TestErrorsModule } from './test-errors/test-errors.module'
@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    
    // Rate limiting
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          name: 'default',
          ttl: config.get('RATE_LIMIT_TTL', 900) * 1000, // Convert to milliseconds
          limit: config.get('RATE_LIMIT_MAX', 100),
        },
        {
          name: 'strict',
          ttl: 60 * 1000, // 1 minute
          limit: 10,
        },
      ],
    }),

    // Core modules
    PrismaModule,
    CacheModule,
    AuthModule,
    UsersModule,
    
    // Feature modules
    CalendarModule,
    BudgetModule,
    ContentModule,
    CrmModule,
    MarketingDataModule,
    ReportsModule,
    ExportModule,
    AnalyticsModule,
    HealthModule,
    TestErrorsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
