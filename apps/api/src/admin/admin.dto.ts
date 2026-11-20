import { LeaveStatus, Role } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
  MinLength,
} from 'class-validator';

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export class CreateUserDto {
  @IsEmail() email: string;
  @IsString() @MinLength(2) fullName: string;
  @IsString() @MinLength(8) password: string;
  @IsOptional() @IsEnum(Role) role?: Role;
  @IsOptional() @IsUUID() teamId?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(7) @IsInt({ each: true }) workWeekdays?: number[];
  @IsOptional() @Matches(HHMM) defaultStartTime?: string;
  @IsOptional() @Matches(HHMM) defaultEndTime?: string;
}

export class UpdateUserDto {
  @IsOptional() @IsString() @MinLength(2) fullName?: string;
  @IsOptional() @IsEnum(Role) role?: Role;
  @IsOptional() @IsUUID() teamId?: string | null;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsArray() @ArrayMaxSize(7) @IsInt({ each: true }) workWeekdays?: number[];
  @IsOptional() @Matches(HHMM) defaultStartTime?: string;
  @IsOptional() @Matches(HHMM) defaultEndTime?: string;
  @IsOptional() @IsString() @MinLength(8) password?: string;
}

export class CreateTeamDto {
  @IsString() @MinLength(2) name: string;
}

export class UpsertScheduleDayDto {
  @IsBoolean() isWorkday: boolean;
  @IsOptional() @Matches(HHMM) startTime?: string;
  @IsOptional() @Matches(HHMM) endTime?: string;
  @IsOptional() @IsString() note?: string;
}

export class GenerateScheduleDto {
  @Type(() => Number) @IsInt() year: number;
  @Type(() => Number) @IsInt() @Min(1) @Max(12) month: number;
  @IsOptional() @IsArray() @IsUUID('all', { each: true }) userIds?: string[];
  @IsOptional() @IsBoolean() overwrite?: boolean;
}

export class HolidayDto {
  @IsDateString() date: string;
  @IsString() @MinLength(2) name: string;
}

export class ReviewLeaveDto {
  @IsIn([LeaveStatus.APPROVED, LeaveStatus.REJECTED]) status: 'APPROVED' | 'REJECTED';
}

export class CreateEventDto {
  @Type(() => Number) @IsInt() year: number;
  @Type(() => Number) @IsInt() @Min(1) @Max(12) month: number;
  @IsString() themeCode: string;
  @IsOptional() @IsNumber() @Min(0.1) @Max(2) difficulty?: number;
}

export class RecalculateEventDto {
  @IsOptional() @IsNumber() @Min(0.1) @Max(2) difficulty?: number;
}

export class FinalizeMonthDto {
  @Type(() => Number) @IsInt() year: number;
  @Type(() => Number) @IsInt() @Min(1) @Max(12) month: number;
}

export class CorrectAttendanceDto {
  @IsOptional() @IsDateString() checkInAt?: string;
  @IsOptional() @IsDateString() checkOutAt?: string;
  @IsOptional() @IsString() note?: string;
}

export class UpdateAchievementDto {
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsInt() @Min(1) threshold?: number;
  @IsOptional() @IsInt() @Min(0) xpReward?: number;
}
