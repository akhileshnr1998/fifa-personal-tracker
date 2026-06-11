import { join } from 'path';
import { DataSourceOptions } from 'typeorm';
import { FixtureEntity } from '../fixtures/entities/fixture.entity';
import { GroupStandingEntity } from '../standings/entities/group-standing.entity';
import { TournamentGroupEntity } from '../standings/entities/tournament-group.entity';
import { TeamEntity } from '../teams/entities/team.entity';
import { FollowedTeamEntity } from '../users/entities/followed-team.entity';
import { ReminderDispatchEntity } from '../users/entities/reminder-dispatch.entity';
import { UserEntity } from '../users/entities/user.entity';
import { VenueEntity } from '../venues/entities/venue.entity';

export function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return url;
}

function getSsl(url: string): boolean | { rejectUnauthorized: boolean } {
  return url.includes('neon.tech') ? { rejectUnauthorized: false } : false;
}

export function getTypeOrmOptions(databaseUrl?: string): DataSourceOptions {
  const url = databaseUrl ?? getDatabaseUrl();
  const isCompiled = __filename.endsWith('.js');

  return {
    type: 'postgres',
    url,
    entities: [
      TeamEntity,
      VenueEntity,
      UserEntity,
      FixtureEntity,
      FollowedTeamEntity,
      ReminderDispatchEntity,
      TournamentGroupEntity,
      GroupStandingEntity,
    ],
    migrations: [join(__dirname, '..', 'migrations', isCompiled ? '*.js' : '*.ts')],
    synchronize: false,
    ssl: getSsl(url),
  };
}
