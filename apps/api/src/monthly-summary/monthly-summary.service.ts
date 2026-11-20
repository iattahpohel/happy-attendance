import { Injectable, Logger } from '@nestjs/common';
import { TitleCode } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AttendanceService } from '../attendance/attendance.service';
import { GamificationService } from '../gamification/gamification.service';
import { NotificationsService } from '../notifications/notifications.service';
import { daysInMonth, localParts, prevMonth, ymd, zonedToUtc } from '../common/time';

export const TITLE_INFO: Record<TitleCode, { name: string; icon: string; meaning: string }> = {
  STEADY_STAR: {
    name: 'Steady Star',
    icon: '🌻',
    meaning: 'Luôn duy trì sự đều đặn',
  },
  GROWTH_MINDSET: {
    name: 'Growth Mindset',
    icon: '🌱',
    meaning: 'Có sự tiến bộ so với chính mình',
  },
  POSITIVE_ENERGY: {
    name: 'Positive Energy',
    icon: '☀️',
    meaning: 'Mang năng lượng tích cực',
  },
  RELIABLE_PARTNER: {
    name: 'Reliable Partner',
    icon: '💚',
    meaning: 'Luôn là người đáng tin cậy',
  },
  COMEBACK_STAR: {
    name: 'Comeback Star',
    icon: '🌈',
    meaning: 'Nỗ lực quay lại sau giai đoạn khó khăn',
  },
  PERFECT_MONTH: {
    name: 'Perfect Month',
    icon: '🏆',
    meaning: 'Hoàn thành lịch làm việc tháng',
  },
};

export interface MonthStats {
  year: number;
  month: number;
  scheduledDays: number;
  completedDays: number;
  attendanceDays: number;
  onTimeDays: number;
  lateDays: number;
  leaveDays: number;
  workedMinutes: number;
  achievementsUnlocked: number;
  appreciationsReceived: number;
  appreciationsSent: number;
  eventPoints: number;
  longestStreak: number;
  completionRate: number;
}

@Injectable()
export class MonthlySummaryService {
  private readonly logger = new Logger(MonthlySummaryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly attendance: AttendanceService,
    private readonly gamification: GamificationService,
    private readonly notifications: NotificationsService,
  ) {}

  private monthBounds(year: number, month: number) {
    const next = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
    return {
      from: zonedToUtc(ymd(year, month, 1), '00:00'),
      to: zonedToUtc(ymd(next.year, next.month, 1), '00:00'),
    };
  }

  async computeStats(userId: string, year: number, month: number): Promise<MonthStats> {
    const cal = await this.attendance.monthCalendar(userId, year, month);
    const { from, to } = this.monthBounds(year, month);
    const [achievements, received, sent, eventPoints] = await Promise.all([
      this.prisma.userAchievement.count({
        where: { userId, unlockedAt: { gte: from, lt: to } },
      }),
      this.prisma.appreciationMessage.count({
        where: { receiverId: userId, createdAt: { gte: from, lt: to } },
      }),
      this.prisma.appreciationMessage.count({
        where: { senderId: userId, createdAt: { gte: from, lt: to } },
      }),
      this.prisma.eventContribution.aggregate({
        where: { userId, event: { year, month } },
        _sum: { points: true },
      }),
    ]);
    let longest = 0;
    let run = 0;
    for (const d of cal.days.filter((x) => x.scheduled)) {
      if (d.status === 'COMPLETED') longest = Math.max(longest, ++run);
      else if (d.status !== 'UPCOMING' && d.status !== 'TODAY') run = 0;
    }
    const s = cal.stats;
    return {
      year,
      month,
      scheduledDays: s.scheduledDays,
      completedDays: s.completedDays,
      attendanceDays: cal.days.filter((d) => d.attendance).length,
      onTimeDays: s.onTimeDays,
      lateDays: s.lateDays,
      leaveDays: s.leaveDays,
      workedMinutes: s.workedMinutes,
      achievementsUnlocked: achievements,
      appreciationsReceived: received,
      appreciationsSent: sent,
      eventPoints: eventPoints._sum.points ?? 0,
      longestStreak: longest,
      completionRate: s.scheduledDays ? s.completedDays / s.scheduledDays : 0,
    };
  }

  computeTitles(s: MonthStats, prev: MonthStats | null): { code: TitleCode; reason: string }[] {
    const out: { code: TitleCode; reason: string }[] = [];
    const has = s.scheduledDays > 0;
    if (has && s.completedDays >= s.scheduledDays) {
      out.push({
        code: 'PERFECT_MONTH',
        reason: `Hoàn thành trọn vẹn ${s.scheduledDays}/${s.scheduledDays} ngày theo lịch`,
      });
    }
    if (has && s.completionRate >= 0.9 && s.lateDays <= 2) {
      out.push({
        code: 'STEADY_STAR',
        reason: `Duy trì nhịp làm việc đều đặn với chuỗi ${s.longestStreak} ngày liên tiếp`,
      });
    }
    if (prev && prev.scheduledDays > 0 && has) {
      const delta = s.completionRate - prev.completionRate;
      if (delta >= 0.1 || (prev.lateDays - s.lateDays >= 2 && delta >= 0)) {
        out.push({
          code: 'GROWTH_MINDSET',
          reason: 'Tiến bộ rõ rệt so với chính mình tháng trước',
        });
      }
      const hardMonth = prev.completionRate < 0.7 || prev.leaveDays >= 5;
      if (hardMonth && s.completionRate >= 0.85) {
        out.push({
          code: 'COMEBACK_STAR',
          reason: 'Quay trở lại mạnh mẽ sau một giai đoạn khó khăn',
        });
      }
    }
    if (s.appreciationsSent >= 3) {
      out.push({
        code: 'POSITIVE_ENERGY',
        reason: `Lan tỏa ${s.appreciationsSent} lời cảm ơn tới đồng nghiệp`,
      });
    }
    if (s.appreciationsReceived >= 3) {
      out.push({
        code: 'RELIABLE_PARTNER',
        reason: `Được đồng nghiệp gửi ${s.appreciationsReceived} lời cảm ơn`,
      });
    }
    return out;
  }

  composeMessage(s: MonthStats, firstName: string): string {
    if (!s.scheduledDays) {
      return `${firstName} ơi, tháng này bạn chủ yếu dành thời gian cho bản thân. Nghỉ ngơi cũng là một phần quan trọng của hành trình 💚`;
    }
    if (s.completedDays >= s.scheduledDays) {
      return `Bạn đã dành ${s.completedDays} ngày để xây dựng những điều tốt đẹp. Không phải ngày nào cũng dễ dàng, nhưng bạn đã luôn cố gắng. Cảm ơn vì đã không bỏ cuộc! ❤️`;
    }
    if (s.completionRate >= 0.8) {
      return `${s.completedDays} ngày nỗ lực, ${s.longestStreak} ngày liên tiếp không ngừng nghỉ. ${firstName} ơi, bạn đang làm rất tốt — cứ giữ nhịp này nhé 🌻`;
    }
    if (s.completionRate >= 0.5) {
      return `Tháng này có những ngày bận rộn và cả những ngày khó khăn, nhưng bạn vẫn có mặt ${s.completedDays} ngày. Mỗi ngày như thế đều đáng trân trọng 🌱`;
    }
    return `Có thể tháng này không dễ dàng với bạn. Không sao cả — hành trình nào cũng có những đoạn chậm lại. Chúng mình luôn ở đây khi bạn sẵn sàng 🌈`;
  }

  /** Dữ liệu cho Monthly Wrapped — tháng chưa chốt sẽ tính trực tiếp */
  async wrapped(userId: string, year: number, month: number) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    const firstName = user.fullName.split(' ').slice(-1)[0];
    const pm = prevMonth(year, month);
    const [stats, prev, titles, saved, cal, received, event, achievements] = await Promise.all([
      this.computeStats(userId, year, month),
      this.prisma.monthlySummary.findUnique({
        where: { userId_year_month: { userId, ...pm } },
      }),
      this.prisma.monthlyTitle.findMany({ where: { userId, year, month } }),
      this.prisma.monthlySummary.findUnique({
        where: { userId_year_month: { userId, year, month } },
      }),
      this.attendance.monthCalendar(userId, year, month),
      this.prisma.appreciationMessage.findMany({
        where: {
          receiverId: userId,
          createdAt: {
            gte: this.monthBounds(year, month).from,
            lt: this.monthBounds(year, month).to,
          },
        },
        include: { sender: { select: { fullName: true, character: true } } },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.communityEvent.findUnique({
        where: { year_month: { year, month } },
      }),
      this.prisma.userAchievement.findMany({
        where: {
          userId,
          unlockedAt: {
            gte: this.monthBounds(year, month).from,
            lt: this.monthBounds(year, month).to,
          },
        },
        include: { achievement: true },
      }),
    ]);
    const finalized = !!saved;
    const titleList = finalized
      ? titles.map((t) => ({
          code: t.code,
          reason: t.reason,
          ...TITLE_INFO[t.code],
        }))
      : this.computeTitles(stats, prev).map((t) => ({
          ...t,
          ...TITLE_INFO[t.code],
        }));

    const checkIns = cal.days
      .filter((d) => d.attendance && d.scheduled)
      .map((d) => {
        const lp = localParts(new Date(d.attendance!.checkInAt));
        return lp.minutesOfDay;
      });
    const avgMin = checkIns.length ? Math.round(checkIns.reduce((a, b) => a + b, 0) / checkIns.length) : null;
    const weekdayCount = [0, 0, 0, 0, 0, 0, 0];
    cal.days.filter((d) => d.status === 'COMPLETED').forEach((d) => weekdayCount[new Date(`${d.date}T00:00:00Z`).getUTCDay()]++);
    const favWeekday = weekdayCount.some((c) => c > 0) ? weekdayCount.indexOf(Math.max(...weekdayCount)) : null;

    const now = localParts();
    const isCurrentMonth = now.year === year && now.month === month;
    return {
      year,
      month,
      finalized,
      isCurrentMonth,
      daysLeftInMonth: isCurrentMonth ? daysInMonth(year, month) - now.day : 0,
      user: { fullName: user.fullName, firstName, character: user.character },
      stats,
      message: saved?.message ?? this.composeMessage(stats, firstName),
      titles: titleList,
      achievements: achievements.map((a) => ({
        code: a.achievement.code,
        name: a.achievement.name,
        icon: a.achievement.icon,
        unlockedAt: a.unlockedAt,
      })),
      avgCheckInTime: avgMin != null ? `${String(Math.floor(avgMin / 60)).padStart(2, '0')}:${String(avgMin % 60).padStart(2, '0')}` : null,
      favoriteWeekday: favWeekday,
      comparison: prev
        ? {
            year: pm.year,
            month: pm.month,
            completedDays: prev.completedDays,
            scheduledDays: prev.scheduledDays,
            completionRate: prev.completionRate,
            lateDays: prev.lateDays,
            workedMinutes: prev.workedMinutes,
            appreciationsReceived: prev.appreciationsReceived,
          }
        : null,
      appreciationCard: received.map((r) => ({
        id: r.id,
        from: r.sender.fullName,
        character: r.sender.character,
        message: r.message,
        emoji: r.emoji,
      })),
      communityEvent: event
        ? {
            title: event.title,
            icon: event.icon,
            status: event.status,
            progressPct: Math.min(100, Math.round((event.currentPoints / event.targetPoints) * 100)),
          }
        : null,
    };
  }

  history(userId: string) {
    return this.prisma.monthlySummary.findMany({
      where: { userId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      take: 24,
    });
  }

  myTitles(userId: string) {
    return this.prisma.monthlyTitle
      .findMany({
        where: { userId },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
      })
      .then((rows) => rows.map((t) => ({ ...t, ...TITLE_INFO[t.code] })));
  }

  /** Chốt tháng: lưu tổng kết, trao danh hiệu, xét thành tựu theo tháng */
  async finalizeMonth(year: number, month: number, at?: Date) {
    // Bỏ qua người gia nhập sau khi tháng đã kết thúc
    const users = await this.prisma.user.findMany({
      where: {
        isActive: true,
        createdAt: { lt: this.monthBounds(year, month).to },
      },
    });
    const pm = prevMonth(year, month);
    let count = 0;
    for (const user of users) {
      try {
        const stats = await this.computeStats(user.id, year, month);
        const prev = await this.prisma.monthlySummary.findUnique({
          where: { userId_year_month: { userId: user.id, ...pm } },
        });
        const firstName = user.fullName.split(' ').slice(-1)[0];
        const { year: _y, month: _m, ...data } = stats;
        void _y;
        void _m;
        const message = this.composeMessage(stats, firstName);
        const alreadyFinalized = await this.prisma.monthlySummary.findUnique({
          where: { userId_year_month: { userId: user.id, year, month } },
          select: { id: true },
        });
        await this.prisma.monthlySummary.upsert({
          where: { userId_year_month: { userId: user.id, year, month } },
          create: { userId: user.id, year, month, ...data, message },
          update: { ...data, message, finalizedAt: new Date() },
        });
        const titles = this.computeTitles(stats, prev);
        if (titles.length) {
          await this.prisma.monthlyTitle.createMany({
            data: titles.map((t) => ({
              userId: user.id,
              year,
              month,
              code: t.code,
              reason: t.reason,
            })),
            skipDuplicates: true,
          });
        }
        if (stats.scheduledDays > 0 && stats.completedDays >= stats.scheduledDays) {
          await this.gamification.unlock(user.id, 'FULL_MONTH', at);
        }
        const last3 = await this.prisma.monthlySummary.findMany({
          where: { userId: user.id },
          orderBy: [{ year: 'desc' }, { month: 'desc' }],
          take: 3,
        });
        if (last3.length === 3 && last3.every((s) => s.scheduledDays > 0 && s.completionRate >= 0.9)) {
          await this.gamification.unlock(user.id, 'PERSISTENT_3M', at);
        }
        // Chốt lại thủ công phải idempotent: chỉ báo lần đầu, không gửi trùng
        if (!alreadyFinalized)
          await this.notifications.notify(
            user.id,
            'TITLE',
            `Tháng ${month} của bạn đã sẵn sàng 🎁`,
            titles.length
              ? `Bạn nhận được ${titles.map((t) => TITLE_INFO[t.code].icon + ' ' + TITLE_INFO[t.code].name).join(', ')}. Mở Monthly Wrapped để xem nhé!`
              : 'Cùng nhìn lại hành trình tháng vừa qua trong Monthly Wrapped nhé!',
            { year, month },
          );
        count++;
      } catch (e) {
        this.logger.error(`finalize ${user.email} ${year}-${month} failed: ${(e as Error).message}`);
      }
    }
    return { finalized: count };
  }
}
