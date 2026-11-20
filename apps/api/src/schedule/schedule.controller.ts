import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { LeaveType } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { localParts } from '../common/time';
import { LeavesService } from './leaves.service';
import { ScheduleService } from './schedule.service';

class LeaveRequestDto {
  @IsDateString() startDate: string;
  @IsDateString() endDate: string;
  @IsEnum(LeaveType) type: LeaveType;
  @IsOptional() @IsString() @MaxLength(500) reason?: string;
}

@Controller()
export class ScheduleController {
  constructor(
    private readonly schedule: ScheduleService,
    private readonly leaves: LeavesService,
  ) {}

  @Get('schedule/month')
  month(@CurrentUser() user: AuthUser, @Query('year') year?: string, @Query('month') month?: string) {
    const now = localParts();
    return this.schedule.monthPlan(user.id, Number(year) || now.year, Number(month) || now.month);
  }

  @Get('holidays')
  holidays(@Query('year') year?: string) {
    return this.schedule.listHolidays(Number(year) || localParts().year);
  }

  @Get('leaves/mine')
  myLeaves(@CurrentUser() user: AuthUser) {
    return this.leaves.mine(user.id);
  }

  @Post('leaves')
  requestLeave(@CurrentUser() user: AuthUser, @Body() dto: LeaveRequestDto) {
    return this.leaves.request(user.id, {
      ...dto,
      startDate: dto.startDate.slice(0, 10),
      endDate: dto.endDate.slice(0, 10),
    });
  }

  @Patch('leaves/:id/cancel')
  cancelLeave(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.leaves.cancel(user.id, id);
  }
}
