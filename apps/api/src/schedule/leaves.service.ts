import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { LeaveStatus, LeaveType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { dateOnly } from '../common/time';

const LEAVE_LABEL: Record<LeaveType, string> = {
  ANNUAL: 'Nghỉ phép năm',
  SICK: 'Nghỉ ốm',
  PERSONAL: 'Việc cá nhân',
  OTHER: 'Khác',
};

@Injectable()
export class LeavesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async request(userId: string, dto: { startDate: string; endDate: string; type: LeaveType; reason?: string }) {
    if (dto.endDate < dto.startDate) throw new BadRequestException('Ngày kết thúc phải sau ngày bắt đầu');
    const overlap = await this.prisma.leaveRecord.findFirst({
      where: {
        userId,
        status: { in: ['PENDING', 'APPROVED'] },
        startDate: { lte: dateOnly(dto.endDate) },
        endDate: { gte: dateOnly(dto.startDate) },
      },
    });
    if (overlap) throw new BadRequestException('Bạn đã có đơn nghỉ trùng khoảng thời gian này');
    return this.prisma.leaveRecord.create({
      data: {
        userId,
        startDate: dateOnly(dto.startDate),
        endDate: dateOnly(dto.endDate),
        type: dto.type,
        reason: dto.reason,
      },
    });
  }

  mine(userId: string) {
    return this.prisma.leaveRecord.findMany({ where: { userId }, orderBy: { startDate: 'desc' }, take: 50 });
  }

  async cancel(userId: string, id: string) {
    const leave = await this.prisma.leaveRecord.findUnique({ where: { id } });
    if (!leave) throw new NotFoundException();
    if (leave.userId !== userId) throw new ForbiddenException();
    if (leave.status !== 'PENDING') throw new BadRequestException('Chỉ huỷ được đơn đang chờ duyệt');
    return this.prisma.leaveRecord.update({ where: { id }, data: { status: 'CANCELLED' } });
  }

  list(status?: LeaveStatus) {
    return this.prisma.leaveRecord.findMany({
      where: status ? { status } : undefined,
      include: { user: { select: { id: true, fullName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async review(reviewerId: string, id: string, status: 'APPROVED' | 'REJECTED') {
    const leave = await this.prisma.leaveRecord.findUnique({ where: { id } });
    if (!leave) throw new NotFoundException();
    if (leave.status !== 'PENDING') throw new BadRequestException('Đơn này đã được xử lý');
    const updated = await this.prisma.leaveRecord.update({
      where: { id },
      data: { status, reviewedById: reviewerId, reviewedAt: new Date() },
    });
    const label = LEAVE_LABEL[leave.type];
    await this.notifications.notify(
      leave.userId,
      'SYSTEM',
      status === 'APPROVED' ? `${label} đã được duyệt 🌴` : `${label} chưa được duyệt`,
      status === 'APPROVED'
        ? 'Những ngày nghỉ sẽ không ảnh hưởng tới hành trình của bạn. Nghỉ ngơi thật tốt nhé!'
        : 'Bạn có thể trao đổi thêm với quản lý nhé.',
    );
    return updated;
  }
}
