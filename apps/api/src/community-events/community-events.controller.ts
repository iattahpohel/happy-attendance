import { Controller, Get, Param } from '@nestjs/common';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { CommunityEventsService } from './community-events.service';

@Controller()
export class CommunityEventsController {
  constructor(private readonly events: CommunityEventsService) {}

  @Get('events/current')
  current(@CurrentUser() user: AuthUser) {
    return this.events.detail(user.id);
  }

  @Get('events')
  history() {
    return this.events.history();
  }

  @Get('events/:id')
  detail(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.events.detail(user.id, id);
  }

  @Get('world/zones')
  zones() {
    return this.events.zones();
  }
}
