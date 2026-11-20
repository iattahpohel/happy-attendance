import { Injectable } from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PushService } from './push.service';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly push: PushService,
  ) {}

  async notify(userId: string, type: NotificationType, title: string, body: string, data?: Prisma.InputJsonValue) {
    await this.prisma.notification.create({ data: { userId, type, title, body, data } });
    void this.push.send([userId], title, body);
  }

  async notifyMany(userIds: string[], type: NotificationType, title: string, body: string, data?: Prisma.InputJsonValue) {
    if (!userIds.length) return;
    await this.prisma.notification.createMany({
      data: userIds.map((userId) => ({ userId, type, title, body, data })),
    });
    void this.push.send(userIds, title, body);
  }

  list(userId: string, limit = 30) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  unreadCount(userId: string) {
    return this.prisma.notification.count({ where: { userId, readAt: null } });
  }

  markAllRead(userId: string) {
    return this.prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
  }

  registerDevice(userId: string, token: string, platform = 'web') {
    return this.prisma.deviceToken.upsert({
      where: { token },
      create: { userId, token, platform },
      update: { userId, platform },
    });
  }
}
