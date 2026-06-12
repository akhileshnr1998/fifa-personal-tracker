import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CronSecretGuard } from '../common/guards/cron-secret.guard';
import { FixtureEntity } from '../fixtures/entities/fixture.entity';
import { FollowedTeamEntity } from '../users/entities/followed-team.entity';
import { ReminderDispatchEntity } from '../users/entities/reminder-dispatch.entity';
import { UserEntity } from '../users/entities/user.entity';
import { NotificationService } from './notification.service';
import { NotificationsController } from './notifications.controller';
import { ReminderService } from './reminder.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FixtureEntity,
      FollowedTeamEntity,
      ReminderDispatchEntity,
      UserEntity,
    ]),
  ],
  controllers: [NotificationsController],
  providers: [NotificationService, ReminderService, CronSecretGuard],
})
export class NotificationsModule {}
