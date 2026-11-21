import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { AttendanceRecord, LocationStatus } from '@prisma/client';
import { distanceMeters } from '../common/geo';
import { PunchDto } from './attendance.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ScheduleService } from '../schedule/schedule.service';
import { GamificationService, UnlockedAchievement } from '../gamification/gamification.service';
import { CommunityEventsService } from '../community-events/community-events.service';
import { EVENT_POINTS, XP } from '../common/constants';
import { checkInGreeting, checkOutGreeting } from '../common/greetings';
import { isUniqueViolation } from '../common/prisma-errors';
import { dateOnly, localParts, monthRange, prevMonth, timeToMinutes, toDateStr, zonedToUtc } from '../common/time';

export type DayStatus = 'COMPLETED' | 'IN_PROGRESS' | 'MISSED' | 'UPCOMING' | 'TODAY' | 'OFF' | 'HOLIDAY' | 'LEAVE' | 'EXTRA';

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly schedule: ScheduleService,
    private readonly gamification: GamificationService,
    private readonly events: CommunityEventsService,
  ) {}

  private get graceMinutes() {
    const g = Number(process.env.LATE_GRACE_MINUTES);
    return Number.isFinite(g) && g >= 0 ? g : 10;
  }

  async getOffice() {
    const o = await this.prisma.officeSetting.findUnique({ where: { id: 'default' } });
    return {
      name: o?.name ?? 'Công ty',
      latitude: o?.latitude ?? null,
      longitude: o?.longitude ?? null,
      maxDistanceMeters: o?.maxDistanceMeters ?? 200,
      configured: o?.latitude != null && o?.longitude != null,
    };
  }

  async updateOffice(data: { name?: string; latitude?: number | null; longitude?: number | null; maxDistanceMeters?: number }) {
    await this.prisma.officeSetting.upsert({ where: { id: 'default' }, update: data, create: { id: 'default', ...data } });
    return this.getOffice();
  }

  /** Đánh giá vị trí chấm công. Không bao giờ chặn — chỉ gắn nhãn để HR xử lý. */
  private async locate(dto: PunchDto) {
    if (dto.latitude == null || dto.longitude == null) {
      return { lat: null, lng: null, accuracy: null, distance: null, status: LocationStatus.NO_LOCATION };
    }
    const office = await this.getOffice();
    const distance = office.configured ? distanceMeters(dto.latitude, dto.longitude, office.latitude!, office.longitude!) : null;
    const status = distance != null && distance > office.maxDistanceMeters ? LocationStatus.OUT_OF_RANGE : LocationStatus.OK;
    return { lat: dto.latitude, lng: dto.longitude, accuracy: dto.accuracy ?? null, distance, status };
  }

  async checkIn(userId: string, dto: PunchDto = {}) {
    const now = new Date();
    const lp = localParts(now);
    const plan = await this.schedule.dayPlan(userId, lp.dateStr);
    const isScheduledDay = plan.scheduled;
    const startMin = timeToMinutes(plan.startTime);
    const isLate = isScheduledDay && lp.minutesOfDay > startMin + this.graceMinutes;
    const greeting = checkInGreeting({ minutesOfDay: lp.minutesOfDay, isLate, isScheduledDay });
    const loc = await this.locate(dto);

    let record: AttendanceRecord;
    try {
      record = await this.prisma.attendanceRecord.create({
        data: {
          userId,
          workDate: dateOnly(lp.dateStr),
          checkInAt: now,
          isScheduledDay,
          isLate,
          lateMinutes: isLate ? lp.minutesOfDay - startMin : 0,
          greeting,
          checkInLat: loc.lat,
          checkInLng: loc.lng,
          checkInAccuracy: loc.accuracy,
          checkInDistance: loc.distance,
          checkInLocStatus: loc.status,
        },
      });
    } catch (e) {
      if (isUniqueViolation(e)) throw new BadRequestException('Bạn đã check-in hôm nay rồi 😊');
      throw e;
    }

    // Nguyên tắc: không thưởng cho việc làm thêm ngoài lịch
    const xp = isScheduledDay ? await this.gamification.addXp(userId, XP.CHECK_IN) : null;
    const first = await this.gamification.unlock(userId, 'FIRST_STEP');
    return {
      record,
      greeting,
      isScheduledDay,
      xpGained: xp?.gained ?? 0,
      leveledUp: xp?.leveledUp ?? false,
      newAchievements: first ? [first] : [],
      effortDays: await this.gamification.completedDaysTotal(userId),
    };
  }

  async checkOut(userId: string, dto: PunchDto = {}) {
    const now = new Date();
    const lp = localParts(now);
    const record = await this.prisma.attendanceRecord.findUnique({
      where: { userId_workDate: { userId, workDate: dateOnly(lp.dateStr) } },
    });
    if (!record) throw new BadRequestException('Bạn chưa check-in hôm nay');
    if (record.checkOutAt) throw new BadRequestException('Bạn đã check-out rồi. Nghỉ ngơi thôi! 🌙');

    const workedMinutes = Math.max(0, Math.round((now.getTime() - record.checkInAt.getTime()) / 60000));
    const loc = await this.locate(dto);
    const updated = await this.prisma.attendanceRecord.update({
      where: { id: record.id },
      data: {
        checkOutAt: now,
        workedMinutes,
        completed: record.isScheduledDay,
        checkOutLat: loc.lat,
        checkOutLng: loc.lng,
        checkOutAccuracy: loc.accuracy,
        checkOutDistance: loc.distance,
        checkOutLocStatus: loc.status,
      },
    });
    const reward = updated.completed
      ? await this.completeDay(userId, lp.dateStr, now)
      : { xpGained: 0, leveledUp: false, newAchievements: [], contribution: null, questsCompleted: [] };
    const progress = await this.monthProgress(userId, lp.year, lp.month);
    return { record: updated, greeting: checkOutGreeting(), ...reward, monthProgress: progress };
  }

  /** Thưởng khi hoàn thành một ngày làm việc theo lịch. `at` cho phép seed dữ liệu quá khứ. */
  async completeDay(userId: string, dateStr: string, at: Date = new Date()) {
    const xp = await this.gamification.addXp(userId, XP.WORKDAY_COMPLETED);
    const contribution = await this.events.addContribution({
      userId,
      source: 'WORKDAY_COMPLETED',
      points: EVENT_POINTS.WORKDAY_COMPLETED,
      refKey: `day:${dateStr}`,
      at,
    });
    const questsCompleted = await this.events.trackQuest(userId, 'COMPLETE_DAY', at);
    const newAchievements: UnlockedAchievement[] = await this.gamification.evaluateJourney(userId, at);

    // Một tháng trọn vẹn: hoàn thành ngày làm việc cuối cùng và không bỏ ngày nào
    const [y, m] = dateStr.split('-').map(Number);
    const dates = await this.schedule.scheduledDates(userId, y, m);
    if (dates.length && dates[dates.length - 1] === dateStr) {
      const done = await this.completedDatesIn(userId, y, m);
      if (dates.every((d) => done.has(d))) {
        const a = await this.gamification.unlock(userId, 'FULL_MONTH', at);
        if (a) newAchievements.push(a);
      }
    }
    return {
      xpGained: xp?.gained ?? 0,
      leveledUp: xp?.leveledUp ?? false,
      newAchievements,
      contribution,
      questsCompleted,
    };
  }

  /** Tự động check-out cho những ai quên — không để người dùng bị "mất" một ngày đã đi làm */
  async autoCheckOutOpenRecords() {
    const today = localParts().dateStr;
    const open = await this.prisma.attendanceRecord.findMany({
      where: { checkOutAt: null, workDate: { lte: dateOnly(today) } },
    });
    for (const r of open) {
      const dateStr = toDateStr(r.workDate);
      const plan = await this.schedule.dayPlan(r.userId, dateStr);
      let out = zonedToUtc(dateStr, plan.endTime);
      if (out <= r.checkInAt) out = new Date(Math.min(Date.now(), r.checkInAt.getTime() + 60 * 60000));
      if (out.getTime() > Date.now()) out = new Date();
      const updated = await this.prisma.attendanceRecord.update({
        where: { id: r.id },
        data: {
          checkOutAt: out,
          autoCheckedOut: true,
          workedMinutes: Math.max(0, Math.round((out.getTime() - r.checkInAt.getTime()) / 60000)),
          completed: r.isScheduledDay,
        },
      });
      if (updated.completed) {
        try {
          await this.completeDay(r.userId, dateStr, out);
        } catch (e) {
          this.logger.warn(`auto checkout reward failed: ${(e as Error).message}`);
        }
      }
    }
    return open.length;
  }

  async completedDatesIn(userId: string, year: number, month: number) {
    const { start, end } = monthRange(year, month);
    const rows = await this.prisma.attendanceRecord.findMany({
      where: { userId, completed: true, isScheduledDay: true, workDate: { gte: start, lte: end } },
      select: { workDate: true },
    });
    return new Set(rows.map((r) => toDateStr(r.workDate)));
  }

  async today(userId: string) {
    const lp = localParts();
    const [plan, record] = await Promise.all([
      this.schedule.dayPlan(userId, lp.dateStr),
      this.prisma.attendanceRecord.findUnique({
        where: { userId_workDate: { userId, workDate: dateOnly(lp.dateStr) } },
      }),
    ]);
    const phase = !record ? 'BEFORE_CHECK_IN' : record.checkOutAt ? 'DONE' : 'WORKING';
    return { date: lp.dateStr, minutesOfDay: lp.minutesOfDay, plan, record, phase };
  }

  async monthProgress(userId: string, year: number, month: number) {
    const today = localParts().dateStr;
    const [dates, done] = await Promise.all([
      this.schedule.scheduledDates(userId, year, month),
      this.completedDatesIn(userId, year, month),
    ]);
    const completed = dates.filter((d) => done.has(d)).length;
    return {
      year,
      month,
      scheduledDays: dates.length,
      completedDays: completed,
      remainingDays: dates.filter((d) => d > today).length,
      pct: dates.length ? Math.round((completed / dates.length) * 100) : 0,
    };
  }

  async monthCalendar(userId: string, year: number, month: number) {
    const today = localParts().dateStr;
    const { start, end } = monthRange(year, month);
    const [plan, records] = await Promise.all([
      this.schedule.monthPlan(userId, year, month),
      this.prisma.attendanceRecord.findMany({ where: { userId, workDate: { gte: start, lte: end } } }),
    ]);
    const recMap = new Map(records.map((r) => [toDateStr(r.workDate), r]));
    const days = plan.map((p) => {
      const r = recMap.get(p.date);
      let status: DayStatus;
      if (p.kind === 'HOLIDAY') status = r ? 'EXTRA' : 'HOLIDAY';
      else if (p.kind === 'LEAVE') status = r ? 'EXTRA' : 'LEAVE';
      else if (p.kind === 'OFF') status = r ? 'EXTRA' : 'OFF';
      else if (r?.completed) status = 'COMPLETED';
      else if (r && !r.checkOutAt) status = 'IN_PROGRESS';
      else if (p.date > today) status = 'UPCOMING';
      else if (p.date === today) status = 'TODAY';
      else status = 'MISSED';
      return {
        ...p,
        status,
        attendance: r
          ? {
              checkInAt: r.checkInAt,
              checkOutAt: r.checkOutAt,
              isLate: r.isLate,
              lateMinutes: r.lateMinutes,
              workedMinutes: r.workedMinutes,
              autoCheckedOut: r.autoCheckedOut,
            }
          : null,
      };
    });
    const scheduled = days.filter((d) => d.scheduled);
    return {
      year,
      month,
      days,
      stats: {
        scheduledDays: scheduled.length,
        completedDays: days.filter((d) => d.status === 'COMPLETED').length,
        remainingDays: scheduled.filter((d) => d.date > today).length,
        onTimeDays: days.filter((d) => d.status === 'COMPLETED' && !d.attendance?.isLate).length,
        lateDays: days.filter((d) => d.attendance?.isLate).length,
        leaveDays: days.filter((d) => d.kind === 'LEAVE').length,
        holidays: days.filter((d) => d.kind === 'HOLIDAY').length,
        workedMinutes: records.reduce((s, r) => s + (r.workedMinutes ?? 0), 0),
      },
    };
  }

  /**
   * Chuỗi ngày đều đặn: đếm các ngày làm việc theo lịch liên tiếp đã hoàn thành.
   * Ngày nghỉ phép, lễ, cuối tuần KHÔNG làm đứt chuỗi.
   */
  async currentStreak(userId: string) {
    const lp = localParts();
    let { year, month } = lp;
    let streak = 0;
    for (let i = 0; i < 12; i++) {
      const [dates, done] = await Promise.all([
        this.schedule.scheduledDates(userId, year, month),
        this.completedDatesIn(userId, year, month),
      ]);
      const past = dates.filter((d) => d <= lp.dateStr).reverse();
      for (const d of past) {
        if (done.has(d)) streak++;
        else if (d === lp.dateStr) continue; // hôm nay chưa xong thì chưa tính là đứt chuỗi
        else return streak;
      }
      ({ year, month } = prevMonth(year, month));
    }
    return streak;
  }
}
