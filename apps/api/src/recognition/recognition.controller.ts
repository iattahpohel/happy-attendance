import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { IsBoolean, IsOptional, IsString, IsUUID, Length, MaxLength } from 'class-validator';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { RecognitionService } from './recognition.service';

class SendAppreciationDto {
  @IsUUID() receiverId: string;
  @IsString() @Length(3, 280) message: string;
  @IsOptional() @IsString() @MaxLength(8) emoji?: string;
  @IsOptional() @IsBoolean() isPublic?: boolean;
}

@Controller()
export class RecognitionController {
  constructor(private readonly recognition: RecognitionService) {}

  @Post('appreciations')
  send(@CurrentUser() user: AuthUser, @Body() dto: SendAppreciationDto) {
    return this.recognition.send(user.id, dto);
  }

  @Get('appreciations/wall')
  wall(@Query('cursor') cursor?: string) {
    return this.recognition.wall(cursor);
  }

  @Get('appreciations/received')
  received(@CurrentUser() user: AuthUser) {
    return this.recognition.received(user.id);
  }

  @Get('recognition/honors')
  honors(@Query('year') year?: string, @Query('month') month?: string) {
    return this.recognition.honors(Number(year) || undefined, Number(month) || undefined);
  }

  @Get('community/feed')
  feed() {
    return this.recognition.feed();
  }
}
