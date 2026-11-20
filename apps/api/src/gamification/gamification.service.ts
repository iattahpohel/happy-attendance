import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Achievement } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ItemsService } from '../items/items.service';
import { GARDEN_STAGES, LEVEL_REWARDS, levelFromXp } from '../common/constants';
import { AchievementUnlockedPayload, DomainEvents } from '../common/domain-events';

export interface UnlockedAchievement {
  code: string;
  name: string;
  icon: string;
  description: string;
  xpReward: number;
}

@Injectable()
export class GamificationService {
  private readonly logger = new Logger(GamificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly items: ItemsService,
    private readonly emitter: EventEmitter2,
  ) {}

  async addXp(userId: string, amount: number) {
    if (amount <= 0) return null;
    const before = await this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { xp: true } });
    const after = await this.prisma.user.update({
      where: { id: userId },
      data: { xp: { increment: amount } },
      select: { xp: true },
    });
    const oldLevel = levelFromXp(before.xp).level;
    const newLevel = levelFromXp(after.xp).level;
    if (newLevel > oldLevel) {
      for (let lv = oldLevel + 1; lv <= newLevel; lv++) {
        const reward = LEVEL_REWARDS[lv];
        if (reward) await this.items.grant(userId, reward, `level:${lv}`, true);
      }
      await this.notifications.notify(userId, 'ACHIEVEMENT', `Bạn đã lên cấp ${newLevel}! ⭐`, 'Hành trình của bạn đang tiến về phía trước.', {
        level: newLevel,
      });
    }
    return { xp: after.xp, gained: amount, leveledUp: newLevel > oldLevel, level: newLevel };
  }

  /** Mở khóa thành tựu (idempotent). Trả về thành tựu nếu vừa mở khóa lần đầu. */
  async unlock(userId: string, code: string, at?: Date): Promise<UnlockedAchievement | null> {
    const achievement = await this.prisma.achievement.findUnique({ where: { code } });
    if (!achievement || !achievement.isActive) return null;
    const res = await this.prisma.userAchievement.createMany({
      data: [{ userId, achievementId: achievement.id, ...(at && { unlockedAt: at }) }],
      skipDuplicates: true,
    });
    if (!res.count) return null;

    await this.addXp(userId, achievement.xpReward);
    if (achievement.rewardItemCode) await this.items.grant(userId, achievement.rewardItemCode, `achievement:${code}`, true);
    await this.notifications.notify(
      userId,
      'ACHIEVEMENT',
      `Mở khóa thành tựu ${achievement.icon} ${achievement.name}`,
      achievement.description,
      { code },
    );
    try {
      await this.emitter.emitAsync(DomainEvents.AchievementUnlocked, {
        userId,
        achievementId: achievement.id,
        code,
        at,
      } satisfies AchievementUnlockedPayload);
    } catch (e) {
      this.logger.warn(`achievement listener failed: ${(e as Error).message}`);
    }
    return this.toDto(achievement);
  }

  async completedDaysTotal(userId: string) {
    return this.prisma.attendanceRecord.count({ where: { userId, completed: true, isScheduledDay: true } });
  }

  /** Thành tựu dựa trên tổng số ngày làm việc đã hoàn thành theo lịch */
  async evaluateJourney(userId: string, at?: Date): Promise<UnlockedAchievement[]> {
    const total = await this.completedDaysTotal(userId);
    const list = await this.prisma.achievement.findMany({
      where: { category: 'journey', threshold: { not: null }, isActive: true },
    });
    return this.unlockWhere(userId, list.filter((a) => total >= (a.threshold ?? Infinity)), at);
  }

  async evaluateSocial(userId: string, at?: Date): Promise<UnlockedAchievement[]> {
    const [sent, received] = await Promise.all([
      this.prisma.appreciationMessage.count({ where: { senderId: userId } }),
      this.prisma.appreciationMessage.count({ where: { receiverId: userId } }),
    ]);
    const out: UnlockedAchievement[] = [];
    const kind = await this.prisma.achievement.findUnique({ where: { code: 'KIND_HEART' } });
    if (kind && sent >= (kind.threshold ?? 10)) {
      const r = await this.unlock(userId, 'KIND_HEART', at);
      if (r) out.push(r);
    }
    const insp = await this.prisma.achievement.findUnique({ where: { code: 'INSPIRER' } });
    if (insp && received >= (insp.threshold ?? 1)) {
      const r = await this.unlock(userId, 'INSPIRER', at);
      if (r) out.push(r);
    }
    return out;
  }

  async evaluateQuests(userId: string, at?: Date) {
    const done = await this.prisma.questProgress.count({ where: { userId, completedAt: { not: null } } });
    const a = await this.prisma.achievement.findUnique({ where: { code: 'QUEST_HELPER' } });
    if (a && done >= (a.threshold ?? 5)) await this.unlock(userId, 'QUEST_HELPER', at);
  }

  private async unlockWhere(userId: string, list: Achievement[], at?: Date) {
    const out: UnlockedAchievement[] = [];
    for (const a of list.sort((x, y) => x.sortOrder - y.sortOrder)) {
      const r = await this.unlock(userId, a.code, at);
      if (r) out.push(r);
    }
    return out;
  }

  async listForUser(userId: string) {
    const [all, mine, completed, sent, received, quests] = await Promise.all([
      this.prisma.achievement.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
      this.prisma.userAchievement.findMany({ where: { userId } }),
      this.completedDaysTotal(userId),
      this.prisma.appreciationMessage.count({ where: { senderId: userId } }),
      this.prisma.appreciationMessage.count({ where: { receiverId: userId } }),
      this.prisma.questProgress.count({ where: { userId, completedAt: { not: null } } }),
    ]);
    const unlockedMap = new Map(mine.map((m) => [m.achievementId, m.unlockedAt]));
    const progressOf = (a: Achievement): number | null => {
      if (a.category === 'journey') return completed;
      if (a.code === 'KIND_HEART') return sent;
      if (a.code === 'INSPIRER') return received;
      if (a.code === 'QUEST_HELPER') return quests;
      return null;
    };
    return all.map((a) => ({
      ...this.toDto(a),
      category: a.category,
      threshold: a.threshold,
      rewardItemCode: a.rewardItemCode,
      unlocked: unlockedMap.has(a.id),
      unlockedAt: unlockedMap.get(a.id) ?? null,
      progress: progressOf(a),
    }));
  }

  async profile(userId: string) {
    const [user, completed] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { xp: true } }),
      this.completedDaysTotal(userId),
    ]);
    const garden = [...GARDEN_STAGES].reverse().find((s) => completed >= s.minDays)!;
    const next = GARDEN_STAGES.find((s) => s.minDays > completed) ?? null;
    return {
      xp: user.xp,
      ...levelFromXp(user.xp),
      completedDaysTotal: completed,
      garden: { ...garden, next: next ? { ...next, daysLeft: next.minDays - completed } : null },
    };
  }

  private toDto(a: Achievement): UnlockedAchievement {
    return { code: a.code, name: a.name, icon: a.icon, description: a.description, xpReward: a.xpReward };
  }
}
