import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator';

export class PushSubscriptionKeysDto {
  @IsString()
  @IsNotEmpty()
  p256dh!: string;

  @IsString()
  @IsNotEmpty()
  auth!: string;
}

export class PushSubscriptionDto {
  @IsUrl()
  endpoint!: string;

  @IsOptional()
  @IsInt()
  expirationTime!: number | null;

  @ValidateNested()
  @Type(() => PushSubscriptionKeysDto)
  keys!: PushSubscriptionKeysDto;
}

export class SaveSettingsDto {
  @IsString()
  @IsNotEmpty()
  userName!: string;

  @IsArray()
  @IsInt({ each: true })
  teams!: number[];

  @IsBoolean()
  pushNotificationsEnabled!: boolean;

  @IsOptional()
  @IsIn([5, 15, 60, 180, 1440])
  reminderMinutesBefore?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => PushSubscriptionDto)
  subscription?: PushSubscriptionDto | null;
}
