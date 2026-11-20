import { Module } from '@nestjs/common';
import { AttendanceModule } from '../attendance/attendance.module';
import { CommunityEventsModule } from '../community-events/community-events.module';
import { MonthlySummaryModule } from '../monthly-summary/monthly-summary.module';
import { WorkScheduleModule } from '../schedule/schedule.module';
import { JobsService } from './jobs.service';

@Module({
  imports: [AttendanceModule, CommunityEventsModule, MonthlySummaryModule, WorkScheduleModule],
  providers: [JobsService],
})
export class JobsModule {}
