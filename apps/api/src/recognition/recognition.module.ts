import { Module } from '@nestjs/common';
import { CommunityEventsModule } from '../community-events/community-events.module';
import { GamificationModule } from '../gamification/gamification.module';
import { RecognitionController } from './recognition.controller';
import { RecognitionService } from './recognition.service';

@Module({
  imports: [GamificationModule, CommunityEventsModule],
  controllers: [RecognitionController],
  providers: [RecognitionService],
  exports: [RecognitionService],
})
export class RecognitionModule {}
