import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ItemsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /** Trao vật phẩm cho 1 người. Trả về item nếu đây là lần đầu nhận. */
  async grant(userId: string, itemCode: string, source: string, silent = false) {
    const item = await this.prisma.item.findUnique({ where: { code: itemCode } });
    if (!item) return null;
    const res = await this.prisma.userItem.createMany({
      data: [{ userId, itemId: item.id, source }],
      skipDuplicates: true,
    });
    if (!res.count) return null;
    if (!silent) {
      await this.notifications.notify(userId, 'ITEM', `Bạn nhận được ${item.icon} ${item.name}`, item.description, {
        itemCode,
      });
    }
    return item;
  }

  /** Trao vật phẩm chung cho nhiều người (ví dụ khi cả công ty đánh bại boss). */
  async grantMany(userIds: string[], itemCode: string, source: string) {
    const item = await this.prisma.item.findUnique({ where: { code: itemCode } });
    if (!item || !userIds.length) return null;
    await this.prisma.userItem.createMany({
      data: userIds.map((userId) => ({ userId, itemId: item.id, source })),
      skipDuplicates: true,
    });
    return item;
  }

  async catalog(userId: string) {
    const [items, owned] = await Promise.all([
      this.prisma.item.findMany({ orderBy: [{ type: 'asc' }, { name: 'asc' }] }),
      this.prisma.userItem.findMany({ where: { userId } }),
    ]);
    const ownedMap = new Map(owned.map((o) => [o.itemId, o]));
    return items.map((it) => {
      const o = ownedMap.get(it.id);
      return {
        ...it,
        owned: !!o,
        equipped: o?.equipped ?? false,
        source: o?.source ?? null,
        acquiredAt: o?.acquiredAt ?? null,
      };
    });
  }

  equipped(userId: string) {
    return this.prisma.userItem
      .findMany({ where: { userId, equipped: true }, include: { item: true } })
      .then((rows) => rows.map((r) => r.item));
  }

  /** Mỗi loại (OUTFIT, BACKGROUND…) chỉ trang bị 1 món, riêng DECORATION/STICKER tối đa 3 món */
  async setEquipped(userId: string, itemId: string, equipped: boolean) {
    const owned = await this.prisma.userItem.findUnique({
      where: { userId_itemId: { userId, itemId } },
      include: { item: true },
    });
    if (!owned) throw new NotFoundException('Bạn chưa sở hữu vật phẩm này');
    if (equipped) {
      const type = owned.item.type;
      const others = await this.prisma.userItem.findMany({
        where: { userId, equipped: true, item: { type }, NOT: { itemId } },
        orderBy: { acquiredAt: 'asc' },
      });
      const max = type === 'DECORATION' || type === 'STICKER' ? 3 : 1;
      const toUnequip = others.slice(0, Math.max(0, others.length - (max - 1)));
      if (toUnequip.length) {
        await this.prisma.userItem.updateMany({
          where: { id: { in: toUnequip.map((o) => o.id) } },
          data: { equipped: false },
        });
      }
    }
    await this.prisma.userItem.update({ where: { id: owned.id }, data: { equipped } });
    return { ok: true };
  }
}
