import { Body, Controller, Get, Patch } from '@nestjs/common';
import { IsBoolean, IsIn, IsOptional } from 'class-validator';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { CHARACTERS, UsersService } from './users.service';

class PreferencesDto {
  @IsOptional() @IsIn(CHARACTERS) character?: string;
  @IsOptional() @IsBoolean() soundEnabled?: boolean;
  @IsOptional() @IsBoolean() reminderEnabled?: boolean;
}

@Controller()
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.users.me(user.id);
  }

  @Patch('me/preferences')
  preferences(@CurrentUser() user: AuthUser, @Body() dto: PreferencesDto) {
    return this.users.updatePreferences(user.id, dto);
  }

  @Get('users/directory')
  directory(@CurrentUser() user: AuthUser) {
    return this.users.directory(user.id);
  }
}
