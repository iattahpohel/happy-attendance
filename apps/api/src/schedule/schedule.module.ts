import { Module } from '@nestjs/common';
import { LeavesService } from './leaves.service';
import { ScheduleController } from './schedule.controller';
import { ScheduleService } from './schedule.service';

@Module({
  controllers: [ScheduleController],
  providers: [ScheduleService, LeavesService],
  exports: [ScheduleService, LeavesService],
})
export class WorkScheduleModule {}
