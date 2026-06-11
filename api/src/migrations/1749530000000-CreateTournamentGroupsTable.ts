import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTournamentGroupsTable1749530000000
  implements MigrationInterface
{
  name = 'CreateTournamentGroupsTable1749530000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE tournament_groups (
        id INT PRIMARY KEY,
        name VARCHAR(30) NOT NULL UNIQUE,
        abbreviation VARCHAR(5) NOT NULL UNIQUE,
        espn_group_id VARCHAR(20),
        last_synced_at TIMESTAMP WITH TIME ZONE,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await queryRunner.query(`
      CREATE INDEX idx_tournament_groups_name ON tournament_groups(name)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_tournament_groups_abbr ON tournament_groups(abbreviation)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_tournament_groups_abbr`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_tournament_groups_name`);
    await queryRunner.query(`DROP TABLE IF EXISTS tournament_groups`);
  }
}
