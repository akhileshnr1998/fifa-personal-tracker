import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Put,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SaveSettingsDto } from './dto/save-settings.dto';
import { UserService } from './user.service';

@Controller('api/user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {}

  @Get('vapid-public-key')
  getVapidPublicKey(): { publicKey: string } {
    const publicKey = this.configService.get<string>('VAPID_PUBLIC_KEY') ?? '';
    return { publicKey };
  }

  @Put('settings')
  async saveSettings(
    @Headers('x-user-id') userId: string | undefined,
    @Body() dto: SaveSettingsDto,
  ): Promise<{ success: true; message: string }> {
    if (!userId?.trim()) {
      throw new BadRequestException('X-User-Id header is required.');
    }

    return this.userService.saveSettings(userId.trim(), dto);
  }
}
