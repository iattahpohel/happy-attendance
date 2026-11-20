import { Module } from '@nestjs/common';
import { AttendanceModule } from '../attendance/attendance.module';
import { CommunityEventsModule } from '../community-events/community-events.module';
import { GamificationModule } from '../gamification/gamification.module';
import { ItemsModule } from '../items/items.module';
import { UsersModule } from '../users/users.module';
import { HomeController } from './home.controller';

@Module({
  imports: [AttendanceModule, GamificationModule, CommunityEventsModule, ItemsModule, UsersModule],
  controllers: [HomeController],
})
export class HomeModule {}
