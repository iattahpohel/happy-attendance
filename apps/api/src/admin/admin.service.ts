import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { ScheduleService } from '../schedule/schedule.service';
import { AttendanceService } from '../attendance/attendance.service';
import { CommunityEventsService } from '../community-events/community-events.service';
import { isUniqueViolation } from '../common/prisma-errors';
import { dateOnly, localParts, toDateStr } from '../common/time';
import { publicUserSelect } from '../users/users.service';
import { CorrectAttendanceDto, CreateUserDto, UpdateUserDto } from './admin.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly schedule: ScheduleService,
    private readonly attendance: AttendanceService,
    private readonly events: CommunityEventsService,
  ) {}

  listUsers() {
    return this.prisma.user.findMany({ select: { ...publicUserSelect, createdAt: true }, orderBy: { fullName: 'asc' } });
  }

  async createUser(dto: CreateUserDto) {
    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email.toLowerCase().trim(),
          fullName: dto.fullName,
          passwordHash: await bcrypt.hash(dto.password, 10),
          role: dto.role,
          teamId: dto.teamId,
          workWeekdays: dto.workWeekdays,
          defaultStartTime: dto.defaultStartTime,
          defaultEndTime: dto.defaultEndTime,
        },
        select: publicUserSelect,
      });
      // Quy mô công ty thay đổi -> mục tiêu sự kiện cộng đồng co giãn theo
      await this.events.recalculateCurrent();
      return user;
    } catch (e) {
      if (isUniqueViolation(e)) throw new BadRequestException('Email đã tồn tại');
      throw e;
    }
  }

  async updateUser(id: string, dto: UpdateUserDto) {
    const { password, ...rest } = dto;
    const before = await this.prisma.user.findUnique({ where: { id } });
    if (!before) throw new NotFoundException();
    const user = await this.prisma.user.update({
      where: { id },
      data: { ...rest, ...(password && { passwordHash: await bcrypt.hash(password, 10) }) },
      select: publicUserSelect,
    });
    const scheduleChanged =
      (dto.workWeekdays && dto.workWeekdays.join() !== before.workWeekdays.join()) ||
      (dto.defaultStartTime && dto.defaultStartTime !== before.defaultStartTime) ||
      (dto.defaultEndTime && dto.defaultEndTime !== before.defaultEndTime);
    if (scheduleChanged) {
      // Áp dụng lịch mới cho tháng hiện tại, giữ nguyên các ngày đã qua
      const now = localParts();
      const plan = await this.schedule.monthPlan(id, now.year, now.month);
      for (const p of plan.filter((d) => d.date > now.dateStr)) {
        const weekday = new Date(`${p.date}T00:00:00Z`).getUTCDay();
        await this.schedule.upsertDay(id, p.date, {
          isWorkday: user.workWeekdays.includes(weekday),
          startTime: user.defaultStartTime,
          endTime: user.defaultEndTime,
        });
      }
    }
    if (dto.isActive !== undefined || scheduleChanged) await this.events.recalculateCurrent();
    return user;
  }

  listTeams() {
    return this.prisma.team.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { users: true } } } });
  }

  createTeam(name: string) {
    return this.prisma.team.create({ data: { name } });
  }

  /** Tổng quan chấm công trong ngày cho HR — danh sách theo tên, không xếp hạng */
  async overview(dateStr?: string) {
    const date = dateStr || localParts().dateStr;
    const users = await this.prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, fullName: true, team: { select: { name: true } } },
      orderBy: { fullName: 'asc' },
    });
    const records = await this.prisma.attendanceRecord.findMany({ where: { workDate: dateOnly(date) } });
    const recMap = new Map(records.map((r) => [r.userId, r]));
    const rows = [];
    for (const u of users) {
      const plan = await this.schedule.dayPlan(u.id, date);
      const r = recMap.get(u.id);
      rows.push({
        user: u,
        kind: plan.kind,
        scheduled: plan.scheduled,
        startTime: plan.startTime,
        endTime: plan.endTime,
        record: r ?? null,
      });
    }
    return {
      date,
      totals: {
        scheduled: rows.filter((r) => r.scheduled).length,
        checkedIn: rows.filter((r) => r.record).length,
        completed: rows.filter((r) => r.record?.completed).length,
        onLeave: rows.filter((r) => r.kind === 'LEAVE').length,
        notYet: rows.filter((r) => r.scheduled && !r.record).length,
      },
      rows,
    };
  }

  async correctAttendance(id: string, dto: CorrectAttendanceDto) {
    const r = await this.prisma.attendanceRecord.findUnique({ where: { id } });
    if (!r) throw new NotFoundException();
    const checkInAt = dto.checkInAt ? new Date(dto.checkInAt) : r.checkInAt;
    const checkOutAt = dto.checkOutAt ? new Date(dto.checkOutAt) : r.checkOutAt;
    if (checkOutAt && checkOutAt <= checkInAt) throw new BadRequestException('Giờ ra phải sau giờ vào');
    const wasCompleted = r.completed;
    const updated = await this.prisma.attendanceRecord.update({
      where: { id },
      data: {
        checkInAt,
        checkOutAt,
        note: dto.note ?? r.note,
        workedMinutes: checkOutAt ? Math.round((checkOutAt.getTime() - checkInAt.getTime()) / 60000) : null,
        completed: !!checkOutAt && r.isScheduledDay,
      },
    });
    if (!wasCompleted && updated.completed) {
      await this.attendance.completeDay(r.userId, toDateStr(r.workDate), checkOutAt!);
    }
    return updated;
  }

  listAchievements() {
    return this.prisma.achievement.findMany({ orderBy: { sortOrder: 'asc' }, include: { _count: { select: { users: true } } } });
  }

  updateAchievement(id: string, data: { isActive?: boolean; threshold?: number; xpReward?: number }) {
    return this.prisma.achievement.update({ where: { id }, data });
  }
}
