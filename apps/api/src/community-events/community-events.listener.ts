import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EVENT_POINTS } from '../common/constants';
import { AchievementUnlockedPayload, DomainEvents } from '../common/domain-events';
import { CommunityEventsService } from './community-events.service';

@Injectable()
export class CommunityEventsListener {
  constructor(private readonly events: CommunityEventsService) {}

  @OnEvent(DomainEvents.AchievementUnlocked)
  async onAchievement(p: AchievementUnlockedPayload) {
    await this.events.addContribution({
      userId: p.userId,
      source: 'ACHIEVEMENT_UNLOCKED',
      points: EVENT_POINTS.ACHIEVEMENT_UNLOCKED,
      refKey: `ach:${p.code}`,
      at: p.at,
    });
    await this.events.trackQuest(p.userId, 'UNLOCK_ACHIEVEMENT', p.at);
  }
}
