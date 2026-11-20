import { Controller, Get } from '@nestjs/common';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { localParts } from '../common/time';
import { AttendanceService } from '../attendance/attendance.service';
import { CommunityEventsService } from '../community-events/community-events.service';
import { GamificationService } from '../gamification/gamification.service';
import { ItemsService } from '../items/items.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';

/** Một request duy nhất cho màn hình Home */
@Controller('home')
export class HomeController {
  constructor(
    private readonly attendance: AttendanceService,
    private readonly gamification: GamificationService,
    private readonly events: CommunityEventsService,
    private readonly items: ItemsService,
    private readonly notifications: NotificationsService,
    private readonly users: UsersService,
  ) {}

  @Get()
  async home(@CurrentUser() user: AuthUser) {
    const now = localParts();
    const [me, today, progress, profile, streak, event, equipped, unread] = await Promise.all([
      this.users.me(user.id),
      this.attendance.today(user.id),
      this.attendance.monthProgress(user.id, now.year, now.month),
      this.gamification.profile(user.id),
      this.attendance.currentStreak(user.id),
      this.events.current(),
      this.items.equipped(user.id),
      this.notifications.unreadCount(user.id),
    ]);
    return {
      me,
      today,
      monthProgress: progress,
      profile,
      streak,
      equipped,
      unreadNotifications: unread,
      event: {
        id: event.id,
        title: event.title,
        icon: event.icon,
        type: event.type,
        villainName: event.villainName,
        status: event.status,
        currentPoints: event.currentPoints,
        targetPoints: event.targetPoints,
        progressPct: Math.min(100, Math.round((event.currentPoints / event.targetPoints) * 100)),
      },
    };
  }
}
