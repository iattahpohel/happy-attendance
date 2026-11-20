import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CommunityEvent, ContributionSource, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ScheduleService } from '../schedule/schedule.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ItemsService } from '../items/items.service';
import { EVENT_MILESTONES, EVENT_POINTS } from '../common/constants';
import { CommunityEventCompletedPayload, DomainEvents, QuestCompletedPayload } from '../common/domain-events';
import { daysInMonth, localParts, ymd, zonedToUtc } from '../common/time';
import { DEFAULT_QUESTS, EventTheme, themeByCode, themeForMonth } from './event-themes';

/** Giả định dùng để ước tính mục tiêu (mỗi người / tháng) */
const EXPECTED_APPRECIATIONS_PER_USER = 4;
const EXPECTED_ACHIEVEMENTS_PER_USER = 1;
const EXPECTED_QUEST_COMPLETION = 0.5;

export interface TargetFormula {
  activeUsers: number;
  totalScheduledDays: number;
  avgScheduledDays: number;
  workdayPoints: number;
  socialPoints: number;
  questPoints: number;
  achievementPoints: number;
  expectedPoints: number;
  difficulty: number;
  targetPoints: number;
  computedAt: string;
}

@Injectable()
export class CommunityEventsService {
  private readonly logger = new Logger(CommunityEventsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly schedule: ScheduleService,
    private readonly notifications: NotificationsService,
    private readonly items: ItemsService,
    private readonly emitter: EventEmitter2,
  ) {}

  private get difficulty() {
    const d = Number(process.env.EVENT_DIFFICULTY);
    return Number.isFinite(d) && d > 0 ? d : 0.85;
  }

  /**
   * Mục tiêu năng lượng tự co giãn theo quy mô công ty:
   *   expected = Σ(ngày làm việc theo lịch của từng người) × điểm/ngày
   *            + số người × (lời cảm ơn kỳ vọng + nhiệm vụ kỳ vọng + thành tựu kỳ vọng)
   *   target   = expected × độ khó
   * Công ty 10 người hay 1.000 người đều có thử thách tương đương.
   */
  async computeTarget(
    year: number,
    month: number,
    questPointsTotal: number,
    difficulty = this.difficulty,
  ): Promise<TargetFormula> {
    const users = await this.prisma.user.findMany({ where: { isActive: true }, select: { id: true } });
    let totalScheduledDays = 0;
    for (const u of users) totalScheduledDays += (await this.schedule.scheduledDates(u.id, year, month)).length;
    const n = users.length;
    const workdayPoints = totalScheduledDays * EVENT_POINTS.WORKDAY_COMPLETED;
    const socialPoints = n * EXPECTED_APPRECIATIONS_PER_USER * EVENT_POINTS.APPRECIATION_SENT;
    const questPoints = Math.round(n * questPointsTotal * EXPECTED_QUEST_COMPLETION);
    const achievementPoints = n * EXPECTED_ACHIEVEMENTS_PER_USER * EVENT_POINTS.ACHIEVEMENT_UNLOCKED;
    const expectedPoints = workdayPoints + socialPoints + questPoints + achievementPoints;
    const targetPoints = Math.max(100, Math.round((expectedPoints * difficulty) / 10) * 10);
    return {
      activeUsers: n,
      totalScheduledDays,
      avgScheduledDays: n ? Math.round((totalScheduledDays / n) * 10) / 10 : 0,
      workdayPoints,
      socialPoints,
      questPoints,
      achievementPoints,
      expectedPoints,
      difficulty,
      targetPoints,
      computedAt: new Date().toISOString(),
    };
  }

  async ensureEvent(year: number, month: number, themeCode?: string, difficulty?: number): Promise<CommunityEvent> {
    const existing = await this.prisma.communityEvent.findUnique({ where: { year_month: { year, month } } });
    if (existing) return existing;
    const theme = (themeCode && themeByCode(themeCode)) || themeForMonth(year, month);
    return this.createFromTheme(year, month, theme, difficulty);
  }

  private async createFromTheme(year: number, month: number, theme: EventTheme, difficulty?: number) {
    const questTotal = DEFAULT_QUESTS.reduce((s, q) => s + q.points, 0);
    const formula = await this.computeTarget(year, month, questTotal, difficulty);
    const now = localParts();
    const isFuture = year * 12 + month > now.year * 12 + now.month;
    try {
      return await this.prisma.communityEvent.create({
        data: {
          year,
          month,
          type: theme.type,
          themeCode: theme.code,
          title: theme.title,
          description: theme.description,
          villainName: theme.villainName,
          icon: theme.icon,
          rewardItemCode: theme.rewardItemCode,
          targetPoints: formula.targetPoints,
          formula: formula as unknown as Prisma.InputJsonValue,
          status: isFuture ? 'UPCOMING' : 'ACTIVE',
          startsAt: zonedToUtc(ymd(year, month, 1), '00:00'),
          endsAt: zonedToUtc(ymd(year, month, daysInMonth(year, month)), '23:59'),
          quests: { create: DEFAULT_QUESTS.map((q) => ({ ...q })) },
        },
      });
    } catch (e) {
      // Có thể bị tạo song song bởi request khác
      const again = await this.prisma.communityEvent.findUnique({ where: { year_month: { year, month } } });
      if (again) return again;
      throw e;
    }
  }

  /** Admin tạo/đổi chủ đề sự kiện cho một tháng (chỉ khi chưa có ai đóng góp) */
  async setTheme(year: number, month: number, themeCode: string, difficulty?: number) {
    const theme = themeByCode(themeCode);
    if (!theme) throw new BadRequestException('Chủ đề không tồn tại');
    const existing = await this.prisma.communityEvent.findUnique({
      where: { year_month: { year, month } },
      include: { _count: { select: { contributions: true } } },
    });
    if (existing) {
      if (existing._count.contributions > 0) throw new BadRequestException('Sự kiện đã có đóng góp, không thể đổi chủ đề');
      await this.prisma.communityEvent.delete({ where: { id: existing.id } });
    }
    return this.createFromTheme(year, month, theme, difficulty);
  }

  async current() {
    const now = localParts();
    const event = await this.ensureEvent(now.year, now.month);
    if (event.status === 'UPCOMING') {
      return this.prisma.communityEvent.update({ where: { id: event.id }, data: { status: 'ACTIVE' } });
    }
    return event;
  }

  /** Tính lại mục tiêu khi số nhân viên/lịch làm việc thay đổi giữa tháng */
  async recalculate(eventId: string, difficulty?: number) {
    const event = await this.prisma.communityEvent.findUnique({ where: { id: eventId }, include: { quests: true } });
    if (!event) throw new NotFoundException();
    if (event.status === 'COMPLETED' || event.status === 'ENDED') return event;
    const prev = event.formula as unknown as TargetFormula;
    const formula = await this.computeTarget(
      event.year,
      event.month,
      event.quests.reduce((s, q) => s + q.points, 0),
      difficulty ?? prev?.difficulty,
    );
    await this.prisma.communityEvent.update({
      where: { id: eventId },
      data: { targetPoints: formula.targetPoints, formula: formula as unknown as Prisma.InputJsonValue },
    });
    await this.checkProgress(eventId);
    return this.prisma.communityEvent.findUniqueOrThrow({ where: { id: eventId } });
  }

  async recalculateCurrent() {
    const now = localParts();
    const event = await this.prisma.communityEvent.findUnique({ where: { year_month: { year: now.year, month: now.month } } });
    if (event) await this.recalculate(event.id);
  }

  /** Cộng năng lượng cho sự kiện của tháng chứa thời điểm `at` (idempotent theo refKey) */
  async addContribution(input: { userId: string; source: ContributionSource; points: number; refKey: string; at?: Date }) {
    const lp = localParts(input.at ?? new Date());
    const event = await this.ensureEvent(lp.year, lp.month);
    if (event.status === 'UPCOMING' || event.status === 'ENDED') return null;
    const res = await this.prisma.eventContribution.createMany({
      data: [
        {
          eventId: event.id,
          userId: input.userId,
          source: input.source,
          points: input.points,
          refKey: input.refKey,
          ...(input.at && { createdAt: input.at }),
        },
      ],
      skipDuplicates: true,
    });
    if (!res.count) return null;
    await this.prisma.communityEvent.update({
      where: { id: event.id },
      data: { currentPoints: { increment: input.points } },
    });
    await this.checkProgress(event.id);
    return { eventId: event.id, points: input.points, icon: event.icon, title: event.title };
  }

  /** Ghi nhận hành động cho nhiệm vụ cộng đồng; trả về các nhiệm vụ vừa hoàn thành */
  async trackQuest(userId: string, actionKey: string, at?: Date) {
    const lp = localParts(at ?? new Date());
    const event = await this.ensureEvent(lp.year, lp.month);
    if (event.status === 'UPCOMING' || event.status === 'ENDED') return [];
    const quests = await this.prisma.eventQuest.findMany({ where: { eventId: event.id, actionKey } });
    const completed: { title: string; icon: string; points: number }[] = [];
    for (const quest of quests) {
      const progress = await this.prisma.questProgress.upsert({
        where: { questId_userId: { questId: quest.id, userId } },
        create: { questId: quest.id, userId, count: 1 },
        update: { count: { increment: 1 } },
      });
      if (progress.completedAt || progress.count < quest.targetCount) continue;
      const marked = await this.prisma.questProgress.updateMany({
        where: { id: progress.id, completedAt: null },
        data: { completedAt: at ?? new Date() },
      });
      if (!marked.count) continue;
      await this.addContribution({ userId, source: 'QUEST_COMPLETED', points: quest.points, refKey: `quest:${quest.id}`, at });
      await this.notifications.notify(userId, 'EVENT', `Hoàn thành nhiệm vụ ${quest.icon} ${quest.title}`, `+${quest.points} năng lượng cho ${event.title}`);
      completed.push({ title: quest.title, icon: quest.icon, points: quest.points });
      try {
        await this.emitter.emitAsync(DomainEvents.QuestCompleted, {
          userId,
          questId: quest.id,
          eventId: event.id,
          at,
        } satisfies QuestCompletedPayload);
      } catch (e) {
        this.logger.warn(`quest listener failed: ${(e as Error).message}`);
      }
    }
    return completed;
  }

  private async checkProgress(eventId: string) {
    const event = await this.prisma.communityEvent.findUniqueOrThrow({ where: { id: eventId } });
    const pct = Math.floor((event.currentPoints / event.targetPoints) * 100);
    const newly = EVENT_MILESTONES.filter((m) => pct >= m && !event.milestonesReached.includes(m));
    if (newly.length) {
      await this.prisma.communityEvent.update({
        where: { id: eventId },
        data: { milestonesReached: [...new Set([...event.milestonesReached, ...newly])].sort((a, b) => a - b) },
      });
      const top = Math.max(...newly);
      const theme = themeByCode(event.themeCode);
      if (top < 100 && event.status === 'ACTIVE') {
        const users = await this.activeUserIds();
        await this.notifications.notifyMany(
          users,
          'EVENT',
          `${event.icon} ${event.title}: ${top}%`,
          theme?.milestoneLines[top] ?? `Cả công ty đã đạt ${top}% mục tiêu!`,
          { eventId, milestone: top },
        );
      }
    }
    if (event.currentPoints >= event.targetPoints && event.status === 'ACTIVE') {
      const marked = await this.prisma.communityEvent.updateMany({
        where: { id: eventId, status: 'ACTIVE' },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });
      if (marked.count) await this.onCompleted(event);
    }
  }

  private async onCompleted(event: CommunityEvent) {
    const [users, contributors] = await Promise.all([
      this.activeUserIds(),
      this.prisma.eventContribution.findMany({ where: { eventId: event.id }, distinct: ['userId'], select: { userId: true } }),
    ]);
    // Phần thưởng chung cho TẤT CẢ nhân viên — chiến thắng là của cả công ty
    if (event.rewardItemCode) await this.items.grantMany(users, event.rewardItemCode, `event:${event.id}`);
    // Mở khóa khu vực tiếp theo trên bản đồ thế giới chung
    let zoneName = '';
    const zone = await this.nextLockedZone();
    if (zone) {
      const unlocked = await this.prisma.worldZone.updateMany({
        where: { id: zone.id, unlockedAt: null },
        data: { unlockedAt: new Date(), unlockedByEventId: event.id },
      });
      if (unlocked.count) {
        await this.prisma.communityEvent.update({ where: { id: event.id }, data: { zoneCode: zone.code } });
        zoneName = ` Khu vực mới mở khóa: ${zone.icon} ${zone.name}.`;
      }
    }
    const theme = themeByCode(event.themeCode);
    await this.notifications.notifyMany(
      users,
      'EVENT',
      theme?.milestoneLines[100] ?? `${event.title} hoàn thành!`,
      `Cảm ơn mọi người đã cùng nhau góp sức.${zoneName} Mọi người đều nhận được vật phẩm kỷ niệm 🎁`,
      { eventId: event.id, completed: true },
    );
    try {
      await this.emitter.emitAsync(DomainEvents.CommunityEventCompleted, {
        eventId: event.id,
        contributorIds: contributors.map((c) => c.userId),
      } satisfies CommunityEventCompletedPayload);
    } catch (e) {
      this.logger.warn(`event-completed listener failed: ${(e as Error).message}`);
    }
  }

  /** Cuối tháng: sự kiện chưa đạt mục tiêu chuyển sang ENDED — nhẹ nhàng, không trách móc */
  async closeMonth(year: number, month: number) {
    const event = await this.prisma.communityEvent.findUnique({ where: { year_month: { year, month } } });
    if (!event || event.status !== 'ACTIVE') return;
    await this.prisma.communityEvent.update({ where: { id: event.id }, data: { status: 'ENDED' } });
    const pct = Math.floor((event.currentPoints / event.targetPoints) * 100);
    await this.notifications.notifyMany(
      await this.activeUserIds(),
      'EVENT',
      `${event.icon} ${event.title} đã khép lại`,
      `Cả công ty đã cùng nhau đi được ${pct}% chặng đường. Tháng sau chúng ta lại tiếp tục nhé 💚`,
      { eventId: event.id },
    );
  }

  async detail(userId: string, eventId?: string) {
    const event = eventId
      ? await this.prisma.communityEvent.findUnique({ where: { id: eventId } })
      : await this.current();
    if (!event) throw new NotFoundException();
    const [quests, mine, contributors, recent, zone] = await Promise.all([
      this.prisma.eventQuest.findMany({
        where: { eventId: event.id },
        include: { progress: { where: { userId } } },
        orderBy: { points: 'asc' },
      }),
      this.prisma.eventContribution.groupBy({
        by: ['source'],
        where: { eventId: event.id, userId },
        _sum: { points: true },
      }),
      this.prisma.eventContribution.findMany({ where: { eventId: event.id }, distinct: ['userId'], select: { userId: true } }),
      this.prisma.eventContribution.findMany({
        where: { eventId: event.id },
        orderBy: { createdAt: 'desc' },
        take: 12,
        include: { user: { select: { fullName: true, character: true } } },
      }),
      event.zoneCode
        ? this.prisma.worldZone.findUnique({ where: { code: event.zoneCode } })
        : event.status === 'ACTIVE' || event.status === 'UPCOMING'
          ? this.nextLockedZone()
          : null,
    ]);
    const theme = themeByCode(event.themeCode);
    const myBySource = Object.fromEntries(mine.map((m) => [m.source, m._sum.points ?? 0]));
    const myTotal = mine.reduce((s, m) => s + (m._sum.points ?? 0), 0);
    return {
      ...event,
      progressPct: Math.min(100, Math.round((event.currentPoints / event.targetPoints) * 1000) / 10),
      remainingPoints: Math.max(0, event.targetPoints - event.currentPoints),
      contributorsCount: contributors.length,
      milestones: EVENT_MILESTONES.map((m) => ({
        pct: m,
        reached: event.milestonesReached.includes(m),
        line: theme?.milestoneLines[m] ?? '',
      })),
      zone,
      quests: quests.map((q) => ({
        id: q.id,
        code: q.code,
        title: q.title,
        description: q.description,
        icon: q.icon,
        targetCount: q.targetCount,
        points: q.points,
        count: Math.min(q.progress[0]?.count ?? 0, q.targetCount),
        completed: !!q.progress[0]?.completedAt,
      })),
      // Đóng góp cá nhân chỉ hiển thị cho chính mình — không có bảng xếp hạng
      myContribution: { total: myTotal, bySource: myBySource },
      recentActivity: recent.map((r) => ({
        id: r.id,
        name: r.user.fullName,
        character: r.user.character,
        source: r.source,
        createdAt: r.createdAt,
      })),
    };
  }

  history() {
    return this.prisma.communityEvent.findMany({
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      take: 24,
      include: { _count: { select: { contributions: true } } },
    });
  }

  zones() {
    return this.prisma.worldZone.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  private nextLockedZone() {
    return this.prisma.worldZone.findFirst({ where: { unlockedAt: null }, orderBy: { sortOrder: 'asc' } });
  }

  private async activeUserIds() {
    const users = await this.prisma.user.findMany({ where: { isActive: true }, select: { id: true } });
    return users.map((u) => u.id);
  }
}
