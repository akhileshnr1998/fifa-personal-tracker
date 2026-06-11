import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFollowedTeamsTable1749520500000
  implements MigrationInterface
{
  name = 'CreateFollowedTeamsTable1749520500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE followed_teams (
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        team_id INT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        PRIMARY KEY (user_id, team_id)
      )
    `);
    await queryRunner.query(`
      CREATE INDEX idx_followed_teams_team_id ON followed_teams(team_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_followed_teams_team_id`);
    await queryRunner.query(`DROP TABLE IF EXISTS followed_teams`);
  }
}
