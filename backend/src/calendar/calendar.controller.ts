import { Controller, Get, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { CalendarService } from './calendar.service'

@ApiTags('calendar')
@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get()
  getCalendarItems(@Query('year') year: number, @Query('month') month?: number) {
    return this.calendarService.getCalendarItems(year, month)
  }
}
