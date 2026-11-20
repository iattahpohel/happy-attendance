import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { AdminModule } from './admin/admin.module';
import { AttendanceModule } from './attendance/attendance.module';
import { AuthModule } from './auth/auth.module';
import { CommunityEventsModule } from './community-events/community-events.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { GamificationModule } from './gamification/gamification.module';
import { HomeModule } from './home/home.module';
import { ItemsModule } from './items/items.module';
import { JobsModule } from './jobs/jobs.module';
import { MonthlySummaryModule } from './monthly-summary/monthly-summary.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PrismaModule } from './prisma/prisma.module';
import { RecognitionModule } from './recognition/recognition.module';
import { WorkScheduleModule } from './schedule/schedule.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    PrismaModule,
    NotificationsModule,
    AuthModule,
    UsersModule,
    WorkScheduleModule,
    ItemsModule,
    GamificationModule,
    CommunityEventsModule,
    AttendanceModule,
    MonthlySummaryModule,
    RecognitionModule,
    HomeModule,
    AdminModule,
    JobsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AppModule {}
