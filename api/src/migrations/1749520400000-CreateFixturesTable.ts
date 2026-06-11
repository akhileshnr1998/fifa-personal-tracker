import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFixturesTable1749520400000 implements MigrationInterface {
  name = 'CreateFixturesTable1749520400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE fixtures (
        id INT PRIMARY KEY,
        match_number INT,
        match_date_time TIMESTAMP WITH TIME ZONE NOT NULL,
        stage_id INT NOT NULL,
        home_team_id INT NOT NULL REFERENCES teams(id),
        away_team_id INT NOT NULL REFERENCES teams(id),
        venue_id INT NOT NULL REFERENCES venues(id),
        status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
        home_score INT,
        away_score INT,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await queryRunner.query(`
      CREATE INDEX idx_fixtures_date ON fixtures(match_date_time)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_fixtures_home_team_id ON fixtures(home_team_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_fixtures_away_team_id ON fixtures(away_team_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_fixtures_venue_id ON fixtures(venue_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_fixtures_venue_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_fixtures_away_team_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_fixtures_home_team_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_fixtures_date`);
    await queryRunner.query(`DROP TABLE IF EXISTS fixtures`);
  }
}
