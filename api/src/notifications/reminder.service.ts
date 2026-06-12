import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
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
import { ExpiredSubscriptionError, NotificationService } from './notification.service';

@Injectable()
export class ReminderService {
  private readonly logger = new Logger(ReminderService.name);

  private readonly appBaseUrl: string;
  private readonly cronSlackMinutes: number;

  constructor(
    @InjectRepository(FixtureEntity)
    private readonly fixturesRepository: Repository<FixtureEntity>,
    @InjectRepository(FollowedTeamEntity)
    private readonly followedTeamsRepository: Repository<FollowedTeamEntity>,
    @InjectRepository(ReminderDispatchEntity)
    private readonly reminderDispatchesRepository: Repository<ReminderDispatchEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    private readonly notificationService: NotificationService,
    private readonly configService: ConfigService,
  ) {
    this.appBaseUrl = this.configService.get<string>('APP_BASE_URL') ?? '';
    this.cronSlackMinutes =
      this.configService.get<number>('CRON_SLACK_MINUTES') ?? CRON_SLACK_MINUTES;
  }

  async checkAndDispatchReminders(): Promise<{ notificationsSent: number }> {
    if (!this.notificationService.isConfigured()) {
      return { notificationsSent: 0 };
    }

    const now = new Date();
    let notificationsSent = 0;

    for (const reminderMinutes of ALLOWED_REMINDER_MINUTES) {
      const count = await this.dispatchBucket(now, reminderMinutes);
      notificationsSent += count;
    }

    return { notificationsSent };
  }

  private async dispatchBucket(
    now: Date,
    reminderMinutes: ReminderMinutes,
  ): Promise<number> {
    const windowStart = new Date(now.getTime() + reminderMinutes * 60 * 1000);
    const windowEnd = new Date(
      windowStart.getTime() + this.cronSlackMinutes * 60 * 1000,
    );

    const upcomingFixtures = await this.fixturesRepository.find({
      where: { match_date_time: Between(windowStart, windowEnd) },
      relations: ['home_team', 'away_team'],
    });

    if (upcomingFixtures.length === 0) {
      return 0;
    }

    const fixtureIds = upcomingFixtures.map((f) => f.id);
    const allTeamIds = [
      ...new Set(upcomingFixtures.flatMap((f) => [f.home_team_id, f.away_team_id])),
    ];

    const followedEntries = await this.followedTeamsRepository
      .createQueryBuilder('ft')
      .innerJoinAndSelect('ft.user', 'user')
      .where('ft.team_id IN (:...allTeamIds)', { allTeamIds })
      .andWhere('user.push_notifications_enabled = true')
      .andWhere('user.push_subscription IS NOT NULL')
      .andWhere('user.reminder_minutes_before = :reminderMinutes', {
        reminderMinutes,
      })
      .getMany();

    const alreadySent = await this.reminderDispatchesRepository.find({
      where: { fixture_id: In(fixtureIds) },
      select: ['user_id', 'fixture_id'],
    });
    const dispatchedSet = new Set(
      alreadySent.map((d) => `${d.user_id}:${d.fixture_id}`),
    );

    const teamUsers = new Map<number, Map<string, UserEntity>>();
    for (const entry of followedEntries) {
      if (!teamUsers.has(entry.team_id)) {
        teamUsers.set(entry.team_id, new Map());
      }
      teamUsers.get(entry.team_id)!.set(entry.user_id, entry.user);
    }

    let notificationsSent = 0;

    for (const fixture of upcomingFixtures) {
      const eligible = new Map<string, UserEntity>();
      for (const teamId of [fixture.home_team_id, fixture.away_team_id]) {
        const users = teamUsers.get(teamId);
        if (!users) continue;
        for (const [userId, user] of users) {
          if (!dispatchedSet.has(`${userId}:${fixture.id}`)) {
            eligible.set(userId, user);
          }
        }
      }

      for (const user of eligible.values()) {
        if (!user.push_subscription) continue;

        // F6: write dispatch record BEFORE sending push (atomic dedup guard).
        // ON CONFLICT DO NOTHING — if the record already exists (concurrent cron
        // run), the RETURNING clause returns no rows and we skip the push.
        const insertResult = await this.reminderDispatchesRepository
          .createQueryBuilder()
          .insert()
          .into(ReminderDispatchEntity)
          .values({ user_id: user.id, fixture_id: fixture.id })
          .orIgnore()
          .returning('user_id')
          .execute();

        if (insertResult.raw.length === 0) {
          // Row already existed — another cron run already dispatched this.
          continue;
        }

        try {
          await this.notificationService.sendPush(user.push_subscription, {
            title: 'Match reminder',
            body: formatReminderPushBody(
              fixture.home_team.name,
              fixture.away_team.name,
              reminderMinutes,
            ),
            url: `${this.appBaseUrl}/`,
          });
          notificationsSent += 1;
        } catch (error) {
          if (error instanceof ExpiredSubscriptionError) {
            // Subscription is gone on the browser side — disable push for this
            // user so dead endpoints do not accumulate and waste future cron cycles.
            await this.usersRepository
              .update(user.id, {
                push_subscription: null,
                push_notifications_enabled: false,
              })
              .catch((updateError) => {
                this.logger.warn(
                  `Failed to clear expired subscription for user ${user.id}`,
                  updateError,
                );
              });
            this.logger.log(
              `Cleared expired push subscription for user ${user.id}`,
            );
            continue;
          }

          // Transient push failure — remove the pre-written dispatch record so
          // the next cron cycle can retry delivery.
          await this.reminderDispatchesRepository
            .delete({ user_id: user.id, fixture_id: fixture.id })
            .catch((deleteError) => {
              this.logger.warn(
                `Failed to rollback dispatch record for user ${user.id} / fixture ${fixture.id}`,
                deleteError,
              );
            });

          this.logger.warn(
            `Push failed for user ${user.id} / fixture ${fixture.id} — dispatch record removed for retry`,
            error,
          );
        }
      }
    }

    return notificationsSent;
  }
}
