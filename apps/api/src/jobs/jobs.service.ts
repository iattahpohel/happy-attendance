import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { AttendanceService } from '../attendance/attendance.service';
import { CommunityEventsService } from '../community-events/community-events.service';
import { MonthlySummaryService } from '../monthly-summary/monthly-summary.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ScheduleService } from '../schedule/schedule.service';
import { APP_TZ, dateOnly, localParts, prevMonth } from '../common/time';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly attendance: AttendanceService,
    private readonly events: CommunityEventsService,
    private readonly summary: MonthlySummaryService,
    private readonly notifications: NotificationsService,
    private readonly schedule: ScheduleService,
  ) {}

  /** 23:50 — tự động check-out cho những ai quên */
  @Cron('50 23 * * *', { timeZone: APP_TZ })
  async autoCheckout() {
    const n = await this.attendance.autoCheckOutOpenRecords();
    if (n) this.logger.log(`Auto checked-out ${n} records`);
  }

  /** 00:05 — chuẩn bị ngày mới; ngày 1 thì chốt tháng trước và mở sự kiện mới */
  @Cron('5 0 * * *', { timeZone: APP_TZ })
  async daily() {
    const now = localParts();
    await this.schedule.ensureMonthForAll(now.year, now.month);
    if (now.day === 1) {
      const pm = prevMonth(now.year, now.month);
      await this.events.closeMonth(pm.year, pm.month);
      const res = await this.summary.finalizeMonth(pm.year, pm.month);
      this.logger.log(`Finalized ${pm.year}-${pm.month}: ${res.finalized} users`);
    }
    await this.events.current();
  }

  /** 09:15 ngày thường — nhắc nhẹ nhàng, chỉ với người bật nhắc nhở và có lịch làm hôm nay */
  @Cron('15 9 * * 1-6', { timeZone: APP_TZ })
  async gentleReminder() {
    const now = localParts();
    const users = await this.prisma.user.findMany({ where: { isActive: true, reminderEnabled: true } });
    const checked = await this.prisma.attendanceRecord.findMany({
      where: { workDate: dateOnly(now.dateStr) },
      select: { userId: true },
    });
    const done = new Set(checked.map((c) => c.userId));
    const targets: string[] = [];
    for (const u of users) {
      if (done.has(u.id)) continue;
      const plan = await this.schedule.dayPlan(u.id, now.dateStr);
      if (plan.scheduled) targets.push(u.id);
    }
    await this.notifications.notifyMany(
      targets,
      'REMINDER',
      'Chào buổi sáng 🌤️',
      'Khi bạn sẵn sàng, đừng quên check-in để chăm sóc khu vườn của mình nhé.',
    );
  }
}
