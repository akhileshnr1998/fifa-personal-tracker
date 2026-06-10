import {
  Controller,
  Headers,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ReminderService } from './reminder.service';

@Controller('api/fixtures')
export class NotificationsController {
  constructor(
    private readonly reminderService: ReminderService,
    private readonly configService: ConfigService,
  ) {}

  @Post('check-reminders')
  async checkReminders(
    @Headers('x-cron-secret') cronSecret: string | undefined,
  ): Promise<{ success: true; notificationsSent: number }> {
    const expectedSecret = this.configService.get<string>('CRON_SECRET');

    if (!expectedSecret || cronSecret !== expectedSecret) {
      throw new UnauthorizedException('Invalid cron secret.');
    }

    const { notificationsSent } =
      await this.reminderService.checkAndDispatchReminders();

    return { success: true, notificationsSent };
  }
}
