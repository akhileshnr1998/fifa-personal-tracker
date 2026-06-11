import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateGroupStandingsTable1749530100000
  implements MigrationInterface
{
  name = 'CreateGroupStandingsTable1749530100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE group_standings (
        group_id INT NOT NULL REFERENCES tournament_groups(id) ON DELETE CASCADE,
        team_id  INT NOT NULL REFERENCES teams(id)             ON DELETE CASCADE,
        rank          SMALLINT NOT NULL DEFAULT 0,
        rank_change   SMALLINT NOT NULL DEFAULT 0,
        games_played  SMALLINT NOT NULL DEFAULT 0,
        wins          SMALLINT NOT NULL DEFAULT 0,
        draws         SMALLINT NOT NULL DEFAULT 0,
        losses        SMALLINT NOT NULL DEFAULT 0,
        goals_for     SMALLINT NOT NULL DEFAULT 0,
        goals_against SMALLINT NOT NULL DEFAULT 0,
        goal_diff     SMALLINT NOT NULL DEFAULT 0,
        points        SMALLINT NOT NULL DEFAULT 0,
        qualification_label VARCHAR(100),
        qualification_color VARCHAR(7),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (group_id, team_id)
      )
    `);
    await queryRunner.query(`
      CREATE INDEX idx_group_standings_team_id
        ON group_standings(team_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_group_standings_group_rank
        ON group_standings(group_id, rank)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_group_standings_group_rank`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_group_standings_team_id`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS group_standings`);
  }
}
