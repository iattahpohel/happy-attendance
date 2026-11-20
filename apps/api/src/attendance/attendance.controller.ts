import { Controller, Get, Post, Query } from '@nestjs/common';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { localParts } from '../common/time';
import { AttendanceService } from './attendance.service';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendance: AttendanceService) {}

  @Post('check-in')
  checkIn(@CurrentUser() user: AuthUser) {
    return this.attendance.checkIn(user.id);
  }

  @Post('check-out')
  checkOut(@CurrentUser() user: AuthUser) {
    return this.attendance.checkOut(user.id);
  }

  @Get('today')
  today(@CurrentUser() user: AuthUser) {
    return this.attendance.today(user.id);
  }

  @Get('month')
  month(@CurrentUser() user: AuthUser, @Query('year') year?: string, @Query('month') month?: string) {
    const now = localParts();
    return this.attendance.monthCalendar(user.id, Number(year) || now.year, Number(month) || now.month);
  }
}
