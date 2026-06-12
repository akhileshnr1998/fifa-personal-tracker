import { Controller, Post, UseGuards } from '@nestjs/common';
import { CronSecretGuard } from '../common/guards/cron-secret.guard';
import { ReminderService } from './reminder.service';

@Controller('api/notifications')
export class NotificationsController {
  constructor(private readonly reminderService: ReminderService) {}

  @Post('check-reminders')
  @UseGuards(CronSecretGuard)
  async checkReminders(): Promise<{ success: true; notificationsSent: number }> {
    const { notificationsSent } =
      await this.reminderService.checkAndDispatchReminders();

    return { success: true, notificationsSent };
  }
}
