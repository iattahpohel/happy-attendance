import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { MonthlySummaryService } from './monthly-summary.service';

@Controller()
export class MonthlySummaryController {
  constructor(private readonly summary: MonthlySummaryService) {}

  @Get('wrapped/history')
  history(@CurrentUser() user: AuthUser) {
    return this.summary.history(user.id);
  }

  @Get('wrapped/:year/:month')
  wrapped(
    @CurrentUser() user: AuthUser,
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
  ) {
    return this.summary.wrapped(user.id, year, month);
  }

  @Get('titles/mine')
  titles(@CurrentUser() user: AuthUser) {
    return this.summary.myTitles(user.id);
  }
}
