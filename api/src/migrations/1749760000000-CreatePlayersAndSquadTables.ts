import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePlayersAndSquadTables1749760000000
  implements MigrationInterface
{
  name = 'CreatePlayersAndSquadTables1749760000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE teams
      ADD COLUMN IF NOT EXISTS abbreviation VARCHAR(10),
      ADD COLUMN IF NOT EXISTS slug VARCHAR(50)
    `);

    await queryRunner.query(`
      CREATE TABLE players (
        id INT PRIMARY KEY,
        full_name VARCHAR(150) NOT NULL,
        display_name VARCHAR(150) NOT NULL,
        position VARCHAR(50),
        position_abbr VARCHAR(10),
        age INT,
        height_display VARCHAR(20),
        weight_display VARCHAR(20),
        appearances INT NOT NULL DEFAULT 0,
        goals INT NOT NULL DEFAULT 0,
        assists INT NOT NULL DEFAULT 0,
        yellow_cards INT NOT NULL DEFAULT 0,
        red_cards INT NOT NULL DEFAULT 0,
        espn_athlete_id INT,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE TABLE team_squad_members (
        team_id INT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        player_id INT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
        jersey VARCHAR(10),
        PRIMARY KEY (team_id, player_id)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_team_squad_members_team_id ON team_squad_members(team_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_team_squad_members_team_id`);
    await queryRunner.query(`DROP TABLE IF EXISTS team_squad_members`);
    await queryRunner.query(`DROP TABLE IF EXISTS players`);
    await queryRunner.query(`
      ALTER TABLE teams
      DROP COLUMN IF EXISTS abbreviation,
      DROP COLUMN IF EXISTS slug
    `);
  }
}
