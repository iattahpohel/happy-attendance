import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CommunityEventCompletedPayload, DomainEvents, QuestCompletedPayload } from '../common/domain-events';
import { GamificationService } from './gamification.service';

@Injectable()
export class GamificationListener {
  constructor(private readonly gamification: GamificationService) {}

  @OnEvent(DomainEvents.QuestCompleted)
  async onQuestCompleted(p: QuestCompletedPayload) {
    await this.gamification.evaluateQuests(p.userId, p.at);
  }

  @OnEvent(DomainEvents.CommunityEventCompleted)
  async onEventCompleted(p: CommunityEventCompletedPayload) {
    for (const userId of p.contributorIds) await this.gamification.unlock(userId, 'WORLD_GUARDIAN');
  }
}
