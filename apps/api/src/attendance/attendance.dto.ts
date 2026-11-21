import { IsLatitude, IsLongitude, IsNumber, IsOptional, Min } from 'class-validator';

/** Vị trí gửi kèm khi chấm công. Bỏ trống = không có vị trí (người dùng đã xác nhận). */
export class PunchDto {
  @IsOptional() @IsLatitude() latitude?: number;
  @IsOptional() @IsLongitude() longitude?: number;
  @IsOptional() @IsNumber() @Min(0) accuracy?: number;
}
