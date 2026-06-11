import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { TeamsService } from '../teams/teams.service';
import { SaveSettingsDto } from './dto/save-settings.dto';
import { FollowedTeamEntity } from './entities/followed-team.entity';
import { UserEntity } from './entities/user.entity';
import {
  DEFAULT_REMINDER_MINUTES,
  normalizeReminderMinutes,
} from './reminder-minutes';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(FollowedTeamEntity)
    private readonly followedTeamsRepository: Repository<FollowedTeamEntity>,
    private readonly teamsService: TeamsService,
    private readonly dataSource: DataSource,
  ) {}

  async saveSettings(
    userId: string,
    dto: SaveSettingsDto,
  ): Promise<{ success: true; message: string }> {
    if (!userId) {
      throw new BadRequestException('User id is required.');
    }

    const userName = dto.userName?.trim();
    if (!userName) {
      throw new BadRequestException('Name is required.');
    }

    const teamIds = Array.isArray(dto.teams) ? dto.teams : [];
    const uniqueTeamIds = [...new Set(teamIds)];

    if (uniqueTeamIds.length > 0) {
      const validTeams =
        await this.teamsService.findFollowableTeamsByIds(uniqueTeamIds);
      if (validTeams.length !== uniqueTeamIds.length) {
        throw new BadRequestException(
          'One or more followed teams are invalid or not followable.',
        );
      }
    }

    await this.dataSource.transaction(async (manager) => {
      const usersRepo = manager.getRepository(UserEntity);
      const followedRepo = manager.getRepository(FollowedTeamEntity);

      let user = await usersRepo.findOne({ where: { id: userId } });

      if (!user) {
        user = usersRepo.create({
          id: userId,
          user_name: userName,
          push_notifications_enabled: false,
          push_subscription: null,
          reminder_minutes_before: DEFAULT_REMINDER_MINUTES,
        });
      }

      user.user_name = userName;
      user.push_notifications_enabled = Boolean(dto.pushNotificationsEnabled);
      user.reminder_minutes_before = dto.pushNotificationsEnabled
        ? normalizeReminderMinutes(dto.reminderMinutesBefore)
        : DEFAULT_REMINDER_MINUTES;

      if (dto.pushNotificationsEnabled && dto.subscription) {
        user.push_subscription = dto.subscription;
      } else {
        user.push_subscription = null;
      }

      await usersRepo.save(user);
      await followedRepo.delete({ user_id: userId });

      if (uniqueTeamIds.length > 0) {
        const followed = uniqueTeamIds.map((teamId) =>
          followedRepo.create({
            user_id: userId,
            team_id: teamId,
          }),
        );
        await followedRepo.save(followed);
      }
    });

    return {
      success: true,
      message: 'Notification preferences saved.',
    };
  }

  async getUserWithFollowedTeams(userId: string): Promise<UserEntity> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['followed_teams', 'followed_teams.team'],
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return user;
  }

  async findUsersFollowingTeam(teamId: number): Promise<UserEntity[]> {
    const followed = await this.followedTeamsRepository.find({
      where: { team_id: teamId },
      relations: ['user'],
    });

    return followed
      .map((entry) => entry.user)
      .filter(
        (user) =>
          user.push_notifications_enabled && user.push_subscription !== null,
      );
  }
}
