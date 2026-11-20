import { Controller, Get } from '@nestjs/common';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { GamificationService } from './gamification.service';

@Controller('achievements')
export class GamificationController {
  constructor(private readonly gamification: GamificationService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.gamification.listForUser(user.id);
  }

  @Get('profile')
  profile(@CurrentUser() user: AuthUser) {
    return this.gamification.profile(user.id);
  }
}
