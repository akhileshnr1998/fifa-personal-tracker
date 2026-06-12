import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { Repository } from 'typeorm';
import { TeamEntity } from '../teams/entities/team.entity';
import {
  EspnStandingGroup,
  EspnStandingEntry,
  EspnStandingStat,
  EspnStandingsResponse,
} from './espn-standings.types';
import { GroupStandingEntity } from './entities/group-standing.entity';
import { TournamentGroupEntity } from './entities/tournament-group.entity';

const DEFAULT_ESPN_LEAGUE_SLUG = 'fifa.world';

function getStat(stats: EspnStandingStat[] | undefined, name: string): number {
  if (!stats) return 0;
  const stat = stats.find((s) => s.name === name);
  const value = stat?.value;
  if (value === undefined || value === null) return 0;
  return Math.round(value);
}

@Injectable()
export class StandingsSyncService {
  private readonly logger = new Logger(StandingsSyncService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @InjectRepository(TournamentGroupEntity)
    private readonly groupsRepository: Repository<TournamentGroupEntity>,
    @InjectRepository(GroupStandingEntity)
    private readonly standingsRepository: Repository<GroupStandingEntity>,
    @InjectRepository(TeamEntity)
    private readonly teamsRepository: Repository<TeamEntity>,
  ) {}

  async syncFromEspn(): Promise<void> {
    const slug =
      this.configService.get<string>('ESPN_LEAGUE_SLUG') ?? DEFAULT_ESPN_LEAGUE_SLUG;
    const url = `https://site.api.espn.com/apis/v2/sports/soccer/${slug}/standings`;

    try {
      const response = await firstValueFrom(
        this.httpService.get<EspnStandingsResponse>(url),
      );

      const groups = response.data?.children ?? [];
      if (groups.length === 0) {
        this.logger.warn('ESPN standings returned no groups');
        return;
      }

      await this.upsertTeamsFromGroups(groups);
      await this.upsertGroupsBatch(groups);

      this.logger.log(`Standings synced: ${groups.length} groups`);
    } catch (error) {
      this.logger.error('ESPN standings hydration failed', error);
    }
  }

  private async upsertTeamsFromGroups(
    groups: EspnStandingGroup[],
  ): Promise<void> {
    const teams = new Map<number, TeamEntity>();

    for (const group of groups) {
      for (const entry of group.standings?.entries ?? []) {
        const teamId = this.parseTeamId(entry);
        if (teamId === null) continue;

        const team = new TeamEntity();
        team.id = teamId;
        team.name = entry.team?.displayName ?? `Team ${teamId}`;
        team.is_placeholder = false;
        team.espn_team_id = teamId;
        teams.set(teamId, team);
      }
    }

    if (teams.size > 0) {
      await this.teamsRepository.upsert([...teams.values()], ['id']);
    }
  }

  /**
   * Replaces the previous sequential per-group upsert loop with two bulk
   * queries: one for all group rows and one for all standing rows.
   * This cuts DB round-trips from N×2 (12×2 = 24) down to 2.
   */
  private async upsertGroupsBatch(groups: EspnStandingGroup[]): Promise<void> {
    const syncedAt = new Date();

    const groupEntities = groups.map((group, index) => {
      const groupId = index + 1;
      // ESPN returns 'Group A' (7 chars) — derive single-letter abbreviation
      // from the sequential id so we get 1→A, 2→B, …, 12→L.
      const abbreviation = String.fromCharCode(64 + groupId);

      const entity = new TournamentGroupEntity();
      entity.id = groupId;
      entity.name = group.name ?? `Group ${abbreviation}`;
      entity.abbreviation = abbreviation;
      entity.espn_group_id = group.id ?? null;
      entity.last_synced_at = syncedAt;
      return entity;
    });

    await this.groupsRepository.upsert(groupEntities, ['id']);

    const allStandings = groups.flatMap((group, index) =>
      this.buildStandingEntities(index + 1, group.standings?.entries ?? []),
    );

    if (allStandings.length > 0) {
      await this.standingsRepository.upsert(allStandings, [
        'group_id',
        'team_id',
      ]);
    }
  }

  private buildStandingEntities(
    groupId: number,
    entries: EspnStandingEntry[],
  ): GroupStandingEntity[] {
    const entities: GroupStandingEntity[] = [];

    for (const entry of entries) {
      const teamId = this.parseTeamId(entry);
      if (teamId === null) continue;

      const standing = new GroupStandingEntity();
      standing.group_id = groupId;
      standing.team_id = teamId;
      standing.rank = getStat(entry.stats, 'rank');
      standing.rank_change = getStat(entry.stats, 'rankChange');
      standing.games_played = getStat(entry.stats, 'gamesPlayed');
      standing.wins = getStat(entry.stats, 'wins');
      standing.draws = getStat(entry.stats, 'ties');
      standing.losses = getStat(entry.stats, 'losses');
      standing.goals_for = getStat(entry.stats, 'pointsFor');
      standing.goals_against = getStat(entry.stats, 'pointsAgainst');
      standing.goal_diff = getStat(entry.stats, 'pointDifferential');
      standing.points = getStat(entry.stats, 'points');
      standing.qualification_label = entry.note?.description ?? null;
      standing.qualification_color = entry.note?.color ?? null;

      entities.push(standing);
    }

    return entities;
  }

  private parseTeamId(entry: EspnStandingEntry): number | null {
    const raw = entry.team?.id;
    if (!raw) return null;
    const id = Number.parseInt(raw, 10);
    return Number.isNaN(id) ? null : id;
  }
}
