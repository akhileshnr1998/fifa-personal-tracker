import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFixturesTable1749523200000 implements MigrationInterface {
  name = 'CreateFixturesTable1749523200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS fixtures (
        id INT PRIMARY KEY,
        match_number INT,
        match_date_time TIMESTAMP WITH TIME ZONE NOT NULL,
        stage_id INT NOT NULL,
        home_team VARCHAR(100) NOT NULL,
        away_team VARCHAR(100) NOT NULL,
        venue VARCHAR(150) DEFAULT 'TBD',
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_fixtures_date ON fixtures(match_date_time)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_fixtures_date`);
    await queryRunner.query(`DROP TABLE IF EXISTS fixtures`);
  }
}
