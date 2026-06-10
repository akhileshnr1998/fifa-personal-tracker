import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { FixtureEntity } from '../fixtures/entities/fixture.entity';
import { FollowedTeamEntity } from '../users/entities/followed-team.entity';
import { ReminderDispatchEntity } from '../users/entities/reminder-dispatch.entity';
import { UserEntity } from '../users/entities/user.entity';
import {
  ALLOWED_REMINDER_MINUTES,
  CRON_SLACK_MINUTES,
  formatReminderPushBody,
  ReminderMinutes,
} from '../users/reminder-minutes';
import { NotificationService } from './notification.service';

@Injectable()
export class ReminderService {
  private readonly logger = new Logger(ReminderService.name);

  constructor(
    @InjectRepository(FixtureEntity)
    private readonly fixturesRepository: Repository<FixtureEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(FollowedTeamEntity)
    private readonly followedTeamsRepository: Repository<FollowedTeamEntity>,
    @InjectRepository(ReminderDispatchEntity)
    private readonly reminderDispatchesRepository: Repository<ReminderDispatchEntity>,
    private readonly notificationService: NotificationService,
  ) {}

  async checkAndDispatchReminders(): Promise<{ notificationsSent: number }> {
    if (!this.notificationService.isConfigured()) {
      return { notificationsSent: 0 };
    }

    const now = new Date();
    let notificationsSent = 0;

    for (const reminderMinutes of ALLOWED_REMINDER_MINUTES) {
      const windowStart = new Date(
        now.getTime() + reminderMinutes * 60 * 1000,
      );
      const windowEnd = new Date(
        windowStart.getTime() + CRON_SLACK_MINUTES * 60 * 1000,
      );

      const upcomingFixtures = await this.fixturesRepository.find({
        where: {
          match_date_time: Between(windowStart, windowEnd),
        },
      });

      for (const fixture of upcomingFixtures) {
        const teamNames = [fixture.home_team, fixture.away_team];
        const recipients = await this.findEligibleRecipients(
          teamNames,
          fixture.id,
          reminderMinutes,
        );

        for (const user of recipients) {
          if (!user.push_subscription) {
            continue;
          }

          try {
            await this.notificationService.sendPush(user.push_subscription, {
              title: 'Match reminder',
              body: formatReminderPushBody(
                fixture.home_team,
                fixture.away_team,
                reminderMinutes,
              ),
              url: '/',
            });

            await this.reminderDispatchesRepository.save({
              user_id: user.id,
              fixture_id: fixture.id,
            });

            notificationsSent += 1;
          } catch (error) {
            this.logger.warn(
              `Failed to send reminder to user ${user.id} for fixture ${fixture.id}`,
              error,
            );
          }
        }
      }
    }

    return { notificationsSent };
  }

  private async findEligibleRecipients(
    teamNames: string[],
    fixtureId: number,
    reminderMinutes: ReminderMinutes,
  ): Promise<UserEntity[]> {
    const followed = await this.followedTeamsRepository
      .createQueryBuilder('ft')
      .innerJoinAndSelect('ft.user', 'user')
      .where('ft.team_name IN (:...teamNames)', { teamNames })
      .andWhere('user.push_notifications_enabled = true')
      .andWhere('user.push_subscription IS NOT NULL')
      .andWhere('user.reminder_minutes_before = :reminderMinutes', {
        reminderMinutes,
      })
      .getMany();

    const alreadySent = await this.reminderDispatchesRepository.find({
      where: { fixture_id: fixtureId },
      select: ['user_id'],
    });
    const sentUserIds = new Set(alreadySent.map((entry) => entry.user_id));

    const uniqueUsers = new Map<string, UserEntity>();
    for (const entry of followed) {
      if (!sentUserIds.has(entry.user_id)) {
        uniqueUsers.set(entry.user_id, entry.user);
      }
    }

    return [...uniqueUsers.values()];
  }
}
