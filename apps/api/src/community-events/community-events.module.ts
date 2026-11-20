import { Module } from '@nestjs/common';
import { ItemsModule } from '../items/items.module';
import { WorkScheduleModule } from '../schedule/schedule.module';
import { CommunityEventsController } from './community-events.controller';
import { CommunityEventsListener } from './community-events.listener';
import { CommunityEventsService } from './community-events.service';

@Module({
  imports: [ItemsModule, WorkScheduleModule],
  controllers: [CommunityEventsController],
  providers: [CommunityEventsService, CommunityEventsListener],
  exports: [CommunityEventsService],
})
export class CommunityEventsModule {}
