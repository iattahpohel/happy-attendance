import { Injectable } from '@nestjs/common';
import { LeaveStatus, LeaveType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { dateOnly, eachDayOfMonth, localParts, monthRange, toDateStr, weekdayOf } from '../common/time';

export type DayKind = 'WORK' | 'OFF' | 'HOLIDAY' | 'LEAVE';

export interface DayPlan {
  date: string;
  kind: DayKind;
  /** true = ngày được tính vào mục tiêu tháng của người này */
  scheduled: boolean;
  startTime: string;
  endTime: string;
  holidayName?: string;
  leave?: { id: string; type: LeaveType; status: LeaveStatus };
  note?: string | null;
}

@Injectable()
export class ScheduleService {
  constructor(private readonly prisma: PrismaService) {}

  /** Sinh lịch làm việc của tháng từ mẫu tuần mặc định của nhân viên nếu chưa có. */
  async ensureMonth(userId: string, year: number, month: number) {
    const { start, end } = monthRange(year, month);
    const existing = await this.prisma.workSchedule.count({
      where: { userId, workDate: { gte: start, lte: end } },
    });
    if (existing > 0) return;
    await this.generateMonth([userId], year, month, false);
  }

  async ensureMonthForAll(year: number, month: number) {
    const users = await this.prisma.user.findMany({ where: { isActive: true }, select: { id: true } });
    for (const u of users) await this.ensureMonth(u.id, year, month);
  }

  /** overwrite = true: ghi đè lịch đã có (admin tái tạo lịch). */
  async generateMonth(userIds: string[], year: number, month: number, overwrite: boolean) {
    const users = await this.prisma.user.findMany({ where: { id: { in: userIds } } });
    const days = eachDayOfMonth(year, month);
    for (const user of users) {
      const rows = days.map((d) => ({
        userId: user.id,
        workDate: dateOnly(d),
        isWorkday: user.workWeekdays.includes(weekdayOf(d)),
        startTime: user.defaultStartTime,
        endTime: user.defaultEndTime,
      }));
      if (overwrite) {
        const { start, end } = monthRange(year, month);
        await this.prisma.$transaction([
          this.prisma.workSchedule.deleteMany({ where: { userId: user.id, workDate: { gte: start, lte: end } } }),
          this.prisma.workSchedule.createMany({ data: rows }),
        ]);
      } else {
        await this.prisma.workSchedule.createMany({ data: rows, skipDuplicates: true });
      }
    }
  }

  async monthPlan(userId: string, year: number, month: number): Promise<DayPlan[]> {
    await this.ensureMonth(userId, year, month);
    const { start, end } = monthRange(year, month);
    const [schedules, holidays, leaves, user] = await Promise.all([
      this.prisma.workSchedule.findMany({ where: { userId, workDate: { gte: start, lte: end } } }),
      this.prisma.holiday.findMany({ where: { date: { gte: start, lte: end } } }),
      this.prisma.leaveRecord.findMany({
        where: {
          userId,
          status: { in: ['APPROVED', 'PENDING'] },
          startDate: { lte: end },
          endDate: { gte: start },
        },
      }),
      this.prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    ]);
    const schedMap = new Map(schedules.map((s) => [toDateStr(s.workDate), s]));
    const holidayMap = new Map(holidays.map((h) => [toDateStr(h.date), h.name]));
    // Những ngày trước khi gia nhập không tính vào lịch — người mới không bị "thiếu ngày"
    const joinDate = localParts(user.createdAt).dateStr;

    return eachDayOfMonth(year, month).map((date) => {
      const s = schedMap.get(date);
      const isWorkday = s ? s.isWorkday : user.workWeekdays.includes(weekdayOf(date));
      const startTime = s?.startTime ?? user.defaultStartTime;
      const endTime = s?.endTime ?? user.defaultEndTime;
      const leave = leaves.find((l) => toDateStr(l.startDate) <= date && toDateStr(l.endDate) >= date);
      const holidayName = holidayMap.get(date);
      const base = { date, startTime, endTime, note: s?.note ?? null };

      if (date < joinDate) return { ...base, kind: 'OFF' as const, scheduled: false, note: 'Chưa gia nhập' };
      if (!isWorkday) return { ...base, kind: 'OFF' as const, scheduled: false, holidayName };
      if (holidayName) return { ...base, kind: 'HOLIDAY' as const, scheduled: false, holidayName };
      if (leave?.status === 'APPROVED') {
        return { ...base, kind: 'LEAVE' as const, scheduled: false, leave: { id: leave.id, type: leave.type, status: leave.status } };
      }
      return {
        ...base,
        kind: 'WORK' as const,
        scheduled: true,
        leave: leave ? { id: leave.id, type: leave.type, status: leave.status } : undefined,
      };
    });
  }

  async dayPlan(userId: string, dateStr: string): Promise<DayPlan> {
    const [y, m] = dateStr.split('-').map(Number);
    const plan = await this.monthPlan(userId, y, m);
    return plan.find((p) => p.date === dateStr)!;
  }

  /** Danh sách ngày làm việc thực tế (đã trừ lễ và nghỉ phép được duyệt) */
  async scheduledDates(userId: string, year: number, month: number): Promise<string[]> {
    const plan = await this.monthPlan(userId, year, month);
    return plan.filter((p) => p.scheduled).map((p) => p.date);
  }

  async upsertDay(userId: string, dateStr: string, data: { isWorkday: boolean; startTime?: string; endTime?: string; note?: string }) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return this.prisma.workSchedule.upsert({
      where: { userId_workDate: { userId, workDate: dateOnly(dateStr) } },
      create: {
        userId,
        workDate: dateOnly(dateStr),
        isWorkday: data.isWorkday,
        startTime: data.startTime ?? user.defaultStartTime,
        endTime: data.endTime ?? user.defaultEndTime,
        note: data.note,
      },
      update: {
        isWorkday: data.isWorkday,
        ...(data.startTime && { startTime: data.startTime }),
        ...(data.endTime && { endTime: data.endTime }),
        note: data.note,
      },
    });
  }

  listHolidays(year?: number) {
    return this.prisma.holiday.findMany({
      where: year ? { date: { gte: dateOnly(`${year}-01-01`), lte: dateOnly(`${year}-12-31`) } } : undefined,
      orderBy: { date: 'asc' },
    });
  }

  addHoliday(dateStr: string, name: string) {
    return this.prisma.holiday.upsert({
      where: { date: dateOnly(dateStr) },
      create: { date: dateOnly(dateStr), name },
      update: { name },
    });
  }

  removeHoliday(id: string) {
    return this.prisma.holiday.delete({ where: { id } });
  }
}
