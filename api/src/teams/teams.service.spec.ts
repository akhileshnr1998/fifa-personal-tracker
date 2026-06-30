import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeamSquadMemberEntity } from './entities/team-squad-member.entity';
import { TeamEntity } from './entities/team.entity';
import { SquadSyncService } from './squad-sync.service';
import { TeamsSyncService } from './teams-sync.service';
import { TeamsService } from './teams.service';

describe('TeamsService', () => {
  let service: TeamsService;
  let teamsRepository: jest.Mocked<
    Pick<Repository<TeamEntity>, 'find' | 'findOne' | 'count'>
  >;
  let squadMembersRepository: jest.Mocked<
    Pick<Repository<TeamSquadMemberEntity>, 'count' | 'find'>
  >;
  let teamsSyncService: jest.Mocked<Pick<TeamsSyncService, 'syncFromEspn'>>;
  let squadSyncService: jest.Mocked<Pick<SquadSyncService, 'syncTeamSquadFromEspn'>>;

  beforeEach(async () => {
    teamsRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      count: jest.fn(),
    };
    squadMembersRepository = {
      count: jest.fn(),
      find: jest.fn(),
    };
    teamsSyncService = {
      syncFromEspn: jest.fn().mockResolvedValue(undefined),
    };
    squadSyncService = {
      syncTeamSquadFromEspn: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamsService,
        {
          provide: getRepositoryToken(TeamEntity),
          useValue: teamsRepository,
        },
        {
          provide: getRepositoryToken(TeamSquadMemberEntity),
          useValue: squadMembersRepository,
        },
        {
          provide: TeamsSyncService,
          useValue: teamsSyncService,
        },
        {
          provide: SquadSyncService,
          useValue: squadSyncService,
        },
      ],
    }).compile();

    service = module.get(TeamsService);
  });

  it('returns sorted non-placeholder teams for the settings picker', async () => {
    teamsRepository.find.mockResolvedValue([
      {
        id: 203,
        name: 'Mexico',
        is_placeholder: false,
        espn_team_id: 203,
        abbreviation: 'MEX',
        slug: 'mex',
        updated_at: new Date(),
      },
      {
        id: 10,
        name: 'Argentina',
        is_placeholder: false,
        espn_team_id: 10,
        abbreviation: 'ARG',
        slug: 'arg',
        updated_at: new Date(),
      },
    ]);

    const result = await service.getPickerOptions();

    expect(teamsRepository.find).toHaveBeenCalledWith({
      where: { is_placeholder: false },
      order: { name: 'ASC' },
    });
    expect(result).toEqual([
      { id: 203, name: 'Mexico' },
      { id: 10, name: 'Argentina' },
    ]);
  });

  it('hydrates teams from ESPN when fewer than 48 teams exist', async () => {
    teamsRepository.count.mockResolvedValue(12);
    teamsRepository.find.mockResolvedValue([
      {
        id: 203,
        name: 'Mexico',
        is_placeholder: false,
        espn_team_id: 203,
        abbreviation: 'MEX',
        slug: 'mex',
        updated_at: new Date(),
      },
    ]);

    const result = await service.getAllTeams();

    expect(teamsSyncService.syncFromEspn).toHaveBeenCalled();
    expect(result).toEqual([
      {
        id: 203,
        name: 'Mexico',
        abbreviation: 'MEX',
        slug: 'mex',
      },
    ]);
  });

  it('hydrates squad on first request and returns mapped players', async () => {
    const team: TeamEntity = {
      id: 203,
      name: 'Mexico',
      is_placeholder: false,
      espn_team_id: 203,
      abbreviation: 'MEX',
      slug: 'mex',
      updated_at: new Date(),
    };

    teamsRepository.findOne.mockResolvedValue(team);
    squadMembersRepository.count.mockResolvedValue(0);
    squadMembersRepository.find.mockResolvedValue([
      {
        team_id: 203,
        player_id: 1,
        jersey: '10',
        team,
        player: {
          id: 1,
          full_name: 'Alexis Vega',
          display_name: 'Alexis Vega',
          position: 'Forward',
          position_abbr: 'F',
          age: 27,
          height_display: "5' 10\"",
          weight_display: '165 lbs',
          appearances: 1,
          goals: 0,
          assists: 1,
          yellow_cards: 0,
          red_cards: 0,
          espn_athlete_id: 1,
          updated_at: new Date(),
        },
      },
    ]);

    const result = await service.getTeamSquad(203);

    expect(squadSyncService.syncTeamSquadFromEspn).toHaveBeenCalledWith(203);
    expect(result.team.name).toBe('Mexico');
    expect(result.players).toHaveLength(1);
    expect(result.players[0].display_name).toBe('Alexis Vega');
  });

  it('throws when squad is requested for a placeholder team', async () => {
    teamsRepository.findOne.mockResolvedValue({
      id: -1,
      name: 'Group A Winner',
      is_placeholder: true,
      espn_team_id: null,
      abbreviation: null,
      slug: null,
      updated_at: new Date(),
    });

    await expect(service.getTeamSquad(-1)).rejects.toBeInstanceOf(NotFoundException);
  });
});
