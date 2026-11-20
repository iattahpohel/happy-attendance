import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user || !user.isActive || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Email hoặc mật khẩu chưa đúng');
    }
    return { accessToken: await this.jwt.signAsync({ sub: user.id, role: user.role }) };
  }

  async changePassword(userId: string, current: string, next: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!(await bcrypt.compare(current, user.passwordHash))) throw new BadRequestException('Mật khẩu hiện tại chưa đúng');
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash: await bcrypt.hash(next, 10) } });
    return { ok: true };
  }
}
