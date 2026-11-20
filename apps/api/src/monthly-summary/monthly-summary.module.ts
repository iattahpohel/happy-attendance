import { Module } from '@nestjs/common';
import { AttendanceModule } from '../attendance/attendance.module';
import { GamificationModule } from '../gamification/gamification.module';
import { MonthlySummaryController } from './monthly-summary.controller';
import { MonthlySummaryService } from './monthly-summary.service';

@Module({
  imports: [AttendanceModule, GamificationModule],
  controllers: [MonthlySummaryController],
  providers: [MonthlySummaryService],
  exports: [MonthlySummaryService],
})
export class MonthlySummaryModule {}
