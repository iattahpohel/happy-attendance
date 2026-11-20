import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export const publicUserSelect = {
  id: true,
  email: true,
  fullName: true,
  role: true,
  character: true,
  xp: true,
  soundEnabled: true,
  reminderEnabled: true,
  workWeekdays: true,
  defaultStartTime: true,
  defaultEndTime: true,
  isActive: true,
  team: { select: { id: true, name: true } },
} as const;

export const CHARACTERS = ['sunny', 'mochi', 'leaf', 'cloud', 'berry'];

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  me(userId: string) {
    return this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: publicUserSelect });
  }

  updatePreferences(userId: string, data: { character?: string; soundEnabled?: boolean; reminderEnabled?: boolean }) {
    return this.prisma.user.update({ where: { id: userId }, data, select: publicUserSelect });
  }

  directory(excludeId?: string) {
    return this.prisma.user.findMany({
      where: { isActive: true, ...(excludeId && { NOT: { id: excludeId } }) },
      select: { id: true, fullName: true, character: true, team: { select: { name: true } } },
      orderBy: { fullName: 'asc' },
    });
  }
}
