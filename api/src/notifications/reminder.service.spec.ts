import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FixtureEntity } from '../fixtures/entities/fixture.entity';
import { FollowedTeamEntity } from '../users/entities/followed-team.entity';
import { ReminderDispatchEntity } from '../users/entities/reminder-dispatch.entity';
import { UserEntity } from '../users/entities/user.entity';
import { NotificationService } from './notification.service';
import { ReminderService } from './reminder.service';

describe('ReminderService', () => {
  let service: ReminderService;
  let notificationService: { isConfigured: jest.Mock; sendPush: jest.Mock };

  const fixturesRepository = { find: jest.fn() };
  const followedTeamsRepository = {
    createQueryBuilder: jest.fn(),
  };
  const reminderDispatchesRepository = { find: jest.fn(), save: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    notificationService = {
      isConfigured: jest.fn().mockReturnValue(true),
      sendPush: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReminderService,
        {
          provide: getRepositoryToken(FixtureEntity),
          useValue: fixturesRepository,
        },
        {
          provide: getRepositoryToken(UserEntity),
          useValue: {},
        },
        {
          provide: getRepositoryToken(FollowedTeamEntity),
          useValue: followedTeamsRepository,
        },
        {
          provide: getRepositoryToken(ReminderDispatchEntity),
          useValue: reminderDispatchesRepository,
        },
        {
          provide: NotificationService,
          useValue: notificationService,
        },
      ],
    }).compile();

    service = module.get(ReminderService);
  });

  it('returns zero when VAPID is not configured', async () => {
    notificationService.isConfigured.mockReturnValue(false);

    const result = await service.checkAndDispatchReminders();

    expect(result.notificationsSent).toBe(0);
    expect(fixturesRepository.find).not.toHaveBeenCalled();
  });

  it('returns zero when no upcoming fixtures match the reminder window', async () => {
    fixturesRepository.find.mockResolvedValue([]);

    const result = await service.checkAndDispatchReminders();

    expect(result.notificationsSent).toBe(0);
  });

  it('dispatches push for users matching the reminder lead-time bucket', async () => {
    const queryBuilder = {
      innerJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([
        {
          user_id: 'user-1',
          user: {
            id: 'user-1',
            push_subscription: {
              endpoint: 'https://push.example/abc',
              expirationTime: null,
              keys: { p256dh: 'key', auth: 'auth' },
            },
            reminder_minutes_before: 5,
          },
        },
      ]),
    };

    followedTeamsRepository.createQueryBuilder.mockReturnValue(queryBuilder);
    reminderDispatchesRepository.find.mockResolvedValue([]);
    reminderDispatchesRepository.save.mockResolvedValue(undefined);

    fixturesRepository.find.mockImplementation(({ where }) => {
      const matchDate = where.match_date_time._value?.[0] as Date | undefined;
      if (!matchDate) {
        return Promise.resolve([]);
      }

      const minutesAhead = Math.round(
        (matchDate.getTime() - Date.now()) / 60000,
      );

      if (minutesAhead >= 4 && minutesAhead <= 6) {
        return Promise.resolve([
          {
            id: 101,
            home_team_id: 203,
            away_team_id: 10,
            home_team: { id: 203, name: 'Mexico' },
            away_team: { id: 10, name: 'Argentina' },
            match_date_time: matchDate,
          },
        ]);
      }

      return Promise.resolve([]);
    });

    const result = await service.checkAndDispatchReminders();

    expect(result.notificationsSent).toBe(1);
    expect(notificationService.sendPush).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        body: expect.stringContaining('~5 minutes'),
      }),
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'user.reminder_minutes_before = :reminderMinutes',
      { reminderMinutes: 5 },
    );
  });
});
