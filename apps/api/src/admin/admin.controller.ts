import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { LeaveStatus } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { localParts } from '../common/time';
import { ScheduleService } from '../schedule/schedule.service';
import { LeavesService } from '../schedule/leaves.service';
import { CommunityEventsService } from '../community-events/community-events.service';
import { EVENT_THEMES } from '../community-events/event-themes';
import { MonthlySummaryService } from '../monthly-summary/monthly-summary.service';
import { AdminService } from './admin.service';
import {
  CorrectAttendanceDto,
  CreateEventDto,
  CreateTeamDto,
  CreateUserDto,
  FinalizeMonthDto,
  GenerateScheduleDto,
  HolidayDto,
  RecalculateEventDto,
  ReviewLeaveDto,
  UpdateAchievementDto,
  UpdateUserDto,
  UpsertScheduleDayDto,
} from './admin.dto';

@Controller('admin')
@UseGuards(RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly schedule: ScheduleService,
    private readonly leaves: LeavesService,
    private readonly events: CommunityEventsService,
    private readonly summary: MonthlySummaryService,
  ) {}

  @Get('overview')
  overview(@Query('date') date?: string) {
    return this.admin.overview(date);
  }

  // ---- Nhân viên & team ----
  @Get('users')
  users() {
    return this.admin.listUsers();
  }

  @Post('users')
  createUser(@Body() dto: CreateUserDto) {
    return this.admin.createUser(dto);
  }

  @Patch('users/:id')
  updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.admin.updateUser(id, dto);
  }

  @Get('teams')
  teams() {
    return this.admin.listTeams();
  }

  @Post('teams')
  createTeam(@Body() dto: CreateTeamDto) {
    return this.admin.createTeam(dto.name);
  }

  // ---- Lịch làm việc ----
  @Get('schedules')
  schedules(@Query('userId') userId: string, @Query('year') year?: string, @Query('month') month?: string) {
    const now = localParts();
    return this.schedule.monthPlan(userId, Number(year) || now.year, Number(month) || now.month);
  }

  @Put('schedules/:userId/:date')
  upsertDay(@Param('userId') userId: string, @Param('date') date: string, @Body() dto: UpsertScheduleDayDto) {
    return this.schedule.upsertDay(userId, date, dto);
  }

  @Post('schedules/generate')
  async generate(@Body() dto: GenerateScheduleDto) {
    const ids = dto.userIds?.length ? dto.userIds : (await this.admin.listUsers()).filter((u) => u.isActive).map((u) => u.id);
    await this.schedule.generateMonth(ids, dto.year, dto.month, dto.overwrite ?? false);
    await this.events.recalculateCurrent();
    return { ok: true, users: ids.length };
  }

  @Get('holidays')
  holidays(@Query('year') year?: string) {
    return this.schedule.listHolidays(Number(year) || undefined);
  }

  @Post('holidays')
  async addHoliday(@Body() dto: HolidayDto) {
    const h = await this.schedule.addHoliday(dto.date.slice(0, 10), dto.name);
    await this.events.recalculateCurrent();
    return h;
  }

  @Delete('holidays/:id')
  async removeHoliday(@Param('id') id: string) {
    await this.schedule.removeHoliday(id);
    await this.events.recalculateCurrent();
    return { ok: true };
  }

  // ---- Nghỉ phép ----
  @Get('leaves')
  leaveList(@Query('status') status?: LeaveStatus) {
    return this.leaves.list(status);
  }

  @Patch('leaves/:id')
  async review(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: ReviewLeaveDto) {
    const res = await this.leaves.review(user.id, id, dto.status);
    if (dto.status === 'APPROVED') await this.events.recalculateCurrent();
    return res;
  }

  // ---- Chấm công ----
  @Patch('attendance/:id')
  correct(@Param('id') id: string, @Body() dto: CorrectAttendanceDto) {
    return this.admin.correctAttendance(id, dto);
  }

  // ---- Sự kiện cộng đồng ----
  @Get('events')
  eventList() {
    return this.events.history();
  }

  @Get('events/themes')
  themes() {
    return EVENT_THEMES.map(({ code, type, title, icon, description }) => ({ code, type, title, icon, description }));
  }

  @Post('events')
  createEvent(@Body() dto: CreateEventDto) {
    return this.events.setTheme(dto.year, dto.month, dto.themeCode, dto.difficulty);
  }

  @Post('events/:id/recalculate')
  recalc(@Param('id') id: string, @Body() dto: RecalculateEventDto) {
    return this.events.recalculate(id, dto.difficulty);
  }

  // ---- Tổng kết tháng & quy tắc ----
  @Post('months/finalize')
  async finalize(@Body() dto: FinalizeMonthDto) {
    await this.events.closeMonth(dto.year, dto.month);
    return this.summary.finalizeMonth(dto.year, dto.month);
  }

  @Get('achievements')
  achievements() {
    return this.admin.listAchievements();
  }

  @Patch('achievements/:id')
  updateAchievement(@Param('id') id: string, @Body() dto: UpdateAchievementDto) {
    return this.admin.updateAchievement(id, dto);
  }
}
