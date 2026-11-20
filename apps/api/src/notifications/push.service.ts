import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Gửi push qua Firebase Cloud Messaging nếu có cấu hình FIREBASE_SERVICE_ACCOUNT.
 * Không cấu hình -> chỉ dùng thông báo trong app (bảng notifications).
 */
@Injectable()
export class PushService implements OnModuleInit {
  private readonly logger = new Logger(PushService.name);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private messaging: any = null;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const admin = require('firebase-admin');
      const app = admin.apps.length
        ? admin.app()
        : admin.initializeApp({ credential: admin.credential.cert(JSON.parse(raw)) });
      this.messaging = app.messaging();
      this.logger.log('FCM push enabled');
    } catch (e) {
      this.logger.warn(`FCM disabled: ${(e as Error).message}`);
    }
  }

  async send(userIds: string[], title: string, body: string, data?: Record<string, string>) {
    if (!this.messaging || !userIds.length) return;
    const devices = await this.prisma.deviceToken.findMany({ where: { userId: { in: userIds } } });
    if (!devices.length) return;
    try {
      const res = await this.messaging.sendEachForMulticast({
        tokens: devices.map((d) => d.token),
        notification: { title, body },
        data,
      });
      // Dọn token không còn hợp lệ
      const invalid: string[] = [];
      res.responses.forEach((r: { success: boolean }, i: number) => {
        if (!r.success) invalid.push(devices[i].token);
      });
      if (invalid.length) await this.prisma.deviceToken.deleteMany({ where: { token: { in: invalid } } });
    } catch (e) {
      this.logger.warn(`Push failed: ${(e as Error).message}`);
    }
  }
}
