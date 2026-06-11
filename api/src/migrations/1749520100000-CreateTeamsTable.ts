import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTeamsTable1749520100000 implements MigrationInterface {
  name = 'CreateTeamsTable1749520100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE teams (
        id INT PRIMARY KEY,
        name VARCHAR(150) NOT NULL UNIQUE,
        is_placeholder BOOLEAN NOT NULL DEFAULT FALSE,
        espn_team_id INT,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await queryRunner.query(`
      CREATE INDEX idx_teams_is_placeholder ON teams(is_placeholder)
    `);
    await queryRunner.query(`
      INSERT INTO teams (id, name, is_placeholder, espn_team_id)
      VALUES (0, 'TBD', TRUE, NULL)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_teams_is_placeholder`);
    await queryRunner.query(`DROP TABLE IF EXISTS teams`);
  }
}
