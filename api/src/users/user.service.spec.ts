import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { TeamsService } from '../teams/teams.service';
import { FollowedTeamEntity } from './entities/followed-team.entity';
import { UserEntity } from './entities/user.entity';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let teamsService: { findFollowableTeamsByIds: jest.Mock };

  const usersRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const followedTeamsRepository = {
    delete: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const transactionManager = {
    getRepository: jest.fn((entity: unknown) => {
      if (entity === UserEntity) {
        return usersRepository;
      }
      return followedTeamsRepository;
    }),
  };

  const dataSource = {
    transaction: jest.fn(
      async (callback: (manager: typeof transactionManager) => Promise<void>) =>
        callback(transactionManager),
    ),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    teamsService = {
      findFollowableTeamsByIds: jest.fn().mockResolvedValue([
        {
          id: 203,
          name: 'Mexico',
          is_placeholder: false,
          espn_team_id: 203,
          updated_at: new Date(),
        },
      ]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: usersRepository,
        },
        {
          provide: getRepositoryToken(FollowedTeamEntity),
          useValue: followedTeamsRepository,
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
        {
          provide: TeamsService,
          useValue: teamsService,
        },
      ],
    }).compile();

    service = module.get(UserService);
  });

  it('rejects save without user id', async () => {
    await expect(
      service.saveSettings('', {
        userName: 'Alex',
        teams: [],
        pushNotificationsEnabled: false,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('upserts user settings and followed team ids', async () => {
    usersRepository.findOne.mockResolvedValue(null);
    usersRepository.create.mockImplementation((data) => data);
    usersRepository.save.mockResolvedValue(undefined);
    followedTeamsRepository.delete.mockResolvedValue(undefined);
    followedTeamsRepository.create.mockImplementation((data) => data);
    followedTeamsRepository.save.mockResolvedValue(undefined);

    const result = await service.saveSettings('user-1', {
      userName: 'Alex',
      teams: [203],
      pushNotificationsEnabled: true,
      reminderMinutesBefore: 1440,
      subscription: {
        endpoint: 'https://push.example/abc',
        expirationTime: null,
        keys: { p256dh: 'key', auth: 'auth' },
      },
    });

    expect(result.success).toBe(true);
    expect(followedTeamsRepository.save).toHaveBeenCalledWith([
      expect.objectContaining({ user_id: 'user-1', team_id: 203 }),
    ]);
  });

  it('resets reminder timing to default when push is disabled', async () => {
    usersRepository.findOne.mockResolvedValue({
      id: 'user-1',
      user_name: 'Alex',
      push_notifications_enabled: true,
      reminder_minutes_before: 1440,
      push_subscription: null,
    });
    usersRepository.save.mockResolvedValue(undefined);
    followedTeamsRepository.delete.mockResolvedValue(undefined);

    await service.saveSettings('user-1', {
      userName: 'Alex',
      teams: [],
      pushNotificationsEnabled: false,
      reminderMinutesBefore: 1440,
    });

    expect(usersRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        reminder_minutes_before: 5,
        push_subscription: null,
      }),
    );
  });
});
