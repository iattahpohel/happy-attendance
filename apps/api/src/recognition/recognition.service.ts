import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { TitleCode } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import { CommunityEventsService } from '../community-events/community-events.service';
import { NotificationsService } from '../notifications/notifications.service';
import { APPRECIATION_DAILY_REWARD_CAP, EVENT_POINTS, XP } from '../common/constants';
import { localParts, ymd, zonedToUtc } from '../common/time';
import { TITLE_INFO } from '../monthly-summary/monthly-summary.service';

const userSelect = { id: true, fullName: true, character: true, team: { select: { name: true } } } as const;

@Injectable()
export class RecognitionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gamification: GamificationService,
    private readonly events: CommunityEventsService,
    private readonly notifications: NotificationsService,
  ) {}

  async send(senderId: string, dto: { receiverId: string; message: string; emoji?: string; isPublic?: boolean }, at?: Date) {
    if (dto.receiverId === senderId) throw new BadRequestException('Hãy gửi lời cảm ơn tới một đồng nghiệp nhé 😊');
    const [sender, receiver] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({ where: { id: senderId } }),
      this.prisma.user.findUnique({ where: { id: dto.receiverId } }),
    ]);
    if (!receiver || !receiver.isActive) throw new NotFoundException('Không tìm thấy đồng nghiệp');

    const lp = localParts(at ?? new Date());
    const dayStart = zonedToUtc(lp.dateStr, '00:00');
    const sentToday = await this.prisma.appreciationMessage.count({
      where: { senderId, createdAt: { gte: dayStart, ...(at && { lte: at }) } },
    });
    const msg = await this.prisma.appreciationMessage.create({
      data: {
        senderId,
        receiverId: receiver.id,
        message: dto.message.trim(),
        emoji: dto.emoji || '💚',
        isPublic: dto.isPublic ?? true,
        ...(at && { createdAt: at }),
      },
    });

    // Giới hạn phần thưởng mỗi ngày để lời cảm ơn luôn chân thành, không bị "cày điểm"
    const rewarded = sentToday < APPRECIATION_DAILY_REWARD_CAP;
    let contribution = null;
    let questsCompleted: { title: string; icon: string; points: number }[] = [];
    if (rewarded) {
      await this.gamification.addXp(senderId, XP.APPRECIATION_SENT);
      contribution = await this.events.addContribution({
        userId: senderId,
        source: 'APPRECIATION_SENT',
        points: EVENT_POINTS.APPRECIATION_SENT,
        refKey: `thanks:${msg.id}`,
        at,
      });
      questsCompleted = await this.events.trackQuest(senderId, 'SEND_APPRECIATION', at);
      if (sender.teamId && receiver.teamId && sender.teamId !== receiver.teamId) {
        questsCompleted.push(...(await this.events.trackQuest(senderId, 'CROSS_TEAM_THANKS', at)));
      }
    }
    await this.gamification.addXp(receiver.id, XP.APPRECIATION_RECEIVED);
    await this.notifications.notify(receiver.id, 'APPRECIATION', `${sender.fullName} gửi lời cảm ơn ${msg.emoji}`, msg.message, {
      appreciationId: msg.id,
    });
    const newAchievements = await this.gamification.evaluateSocial(senderId, at);
    await this.gamification.evaluateSocial(receiver.id, at);
    return { message: msg, rewarded, contribution, questsCompleted, newAchievements };
  }

  async wall(cursor?: string, limit = 20) {
    const rows = await this.prisma.appreciationMessage.findMany({
      where: { isPublic: true },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      include: { sender: { select: userSelect }, receiver: { select: userSelect } },
    });
    const hasMore = rows.length > limit;
    const items = rows.slice(0, limit);
    return { items, nextCursor: hasMore ? items[items.length - 1].id : null };
  }

  received(userId: string) {
    return this.prisma.appreciationMessage.findMany({
      where: { receiverId: userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { sender: { select: userSelect } },
    });
  }

  /** Vinh danh theo danh hiệu: nhóm theo danh hiệu, sắp xếp theo tên — KHÔNG xếp hạng */
  async honors(year?: number, month?: number) {
    let y = year;
    let m = month;
    if (!y || !m) {
      const latest = await this.prisma.monthlyTitle.findFirst({ orderBy: [{ year: 'desc' }, { month: 'desc' }] });
      if (!latest) return { year: null, month: null, groups: [] };
      y = latest.year;
      m = latest.month;
    }
    const rows = await this.prisma.monthlyTitle.findMany({
      where: { year: y, month: m },
      include: { user: { select: userSelect } },
    });
    const order: TitleCode[] = ['PERFECT_MONTH', 'STEADY_STAR', 'GROWTH_MINDSET', 'COMEBACK_STAR', 'POSITIVE_ENERGY', 'RELIABLE_PARTNER'];
    const groups = order.map((code) => ({
      code,
      ...TITLE_INFO[code],
      people: rows
        .filter((r) => r.code === code)
        .map((r) => ({ ...r.user, reason: r.reason }))
        .sort((a, b) => a.fullName.localeCompare(b.fullName, 'vi')),
    }));
    return { year: y, month: m, groups };
  }

  /** Bảng tin cộng đồng: thành tựu mới, danh hiệu — chỉ những điều tích cực */
  async feed() {
    const [achievements, thanks] = await Promise.all([
      this.prisma.userAchievement.findMany({
        orderBy: { unlockedAt: 'desc' },
        take: 15,
        include: { user: { select: userSelect }, achievement: true },
      }),
      this.prisma.appreciationMessage.count({
        where: { createdAt: { gte: zonedToUtc(ymd(localParts().year, localParts().month, 1), '00:00') } },
      }),
    ]);
    return {
      thanksThisMonth: thanks,
      achievements: achievements.map((a) => ({
        id: a.id,
        user: a.user,
        name: a.achievement.name,
        icon: a.achievement.icon,
        unlockedAt: a.unlockedAt,
      })),
    };
  }
}
