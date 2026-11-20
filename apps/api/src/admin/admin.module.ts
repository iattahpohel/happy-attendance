import { Module } from '@nestjs/common';
import { AttendanceModule } from '../attendance/attendance.module';
import { CommunityEventsModule } from '../community-events/community-events.module';
import { MonthlySummaryModule } from '../monthly-summary/monthly-summary.module';
import { WorkScheduleModule } from '../schedule/schedule.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [WorkScheduleModule, AttendanceModule, CommunityEventsModule, MonthlySummaryModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
