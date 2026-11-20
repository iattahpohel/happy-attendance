import { Module } from '@nestjs/common';
import { CommunityEventsModule } from '../community-events/community-events.module';
import { GamificationModule } from '../gamification/gamification.module';
import { WorkScheduleModule } from '../schedule/schedule.module';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';

@Module({
  imports: [WorkScheduleModule, GamificationModule, CommunityEventsModule],
  controllers: [AttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
