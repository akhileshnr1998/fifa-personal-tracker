import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FixtureEntity } from '../fixtures/entities/fixture.entity';
import { FollowedTeamEntity } from '../users/entities/followed-team.entity';
import { ReminderDispatchEntity } from '../users/entities/reminder-dispatch.entity';
import { NotificationService } from './notification.service';
import { NotificationsController } from './notifications.controller';
import { ReminderService } from './reminder.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([FixtureEntity, FollowedTeamEntity, ReminderDispatchEntity]),
  ],
  controllers: [NotificationsController],
  providers: [NotificationService, ReminderService],
})
export class NotificationsModule {}
