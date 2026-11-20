import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { Public } from '../common/decorators/roles.decorator';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthService } from './auth.service';

class LoginDto {
  @IsEmail() email: string;
  @IsString() @MinLength(6) password: string;
}

class ChangePasswordDto {
  @IsString() currentPassword: string;
  @IsString() @MinLength(8) newPassword: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password);
  }

  @Post('change-password')
  @HttpCode(200)
  changePassword(@CurrentUser() user: AuthUser, @Body() dto: ChangePasswordDto) {
    return this.auth.changePassword(user.id, dto.currentPassword, dto.newPassword);
  }
}
