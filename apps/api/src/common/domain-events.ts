/** Tên các domain event nội bộ (dùng @nestjs/event-emitter để tách phụ thuộc giữa module) */
export const DomainEvents = {
  AchievementUnlocked: 'achievement.unlocked',
  QuestCompleted: 'quest.completed',
  CommunityEventCompleted: 'community-event.completed',
} as const;

export interface AchievementUnlockedPayload {
  userId: string;
  achievementId: string;
  code: string;
  at?: Date;
}

export interface QuestCompletedPayload {
  userId: string;
  questId: string;
  eventId: string;
  at?: Date;
}

export interface CommunityEventCompletedPayload {
  eventId: string;
  contributorIds: string[];
}
