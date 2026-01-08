import { Module } from '@nestjs/common';
import { MarketingDataController } from '../controllers/marketing-data.controller';
import { MarketingDataService } from '../services/marketing-data.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MarketingDataController],
  providers: [MarketingDataService],
  exports: [MarketingDataService],
})
export class MarketingDataModule {}





import { MarketingDataService } from '../services/marketing-data.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MarketingDataController],
  providers: [MarketingDataService],
  exports: [MarketingDataService],
})
export class MarketingDataModule {}













