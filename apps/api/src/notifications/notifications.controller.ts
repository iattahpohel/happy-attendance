import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { IsOptional, IsString } from 'class-validator';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';

class RegisterDeviceDto {
  @IsString() token: string;
  @IsOptional() @IsString() platform?: string;
}

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  async list(@CurrentUser() user: AuthUser) {
    const [items, unread] = await Promise.all([this.service.list(user.id), this.service.unreadCount(user.id)]);
    return { items, unread };
  }

  @Patch('read-all')
  async readAll(@CurrentUser() user: AuthUser) {
    await this.service.markAllRead(user.id);
    return { ok: true };
  }

  @Post('devices')
  async register(@CurrentUser() user: AuthUser, @Body() dto: RegisterDeviceDto) {
    await this.service.registerDevice(user.id, dto.token, dto.platform);
    return { ok: true };
  }
}
