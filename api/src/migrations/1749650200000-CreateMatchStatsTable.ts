import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMatchStatsTable1749650200000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS match_stats (
        id               SERIAL PRIMARY KEY,
        fixture_id       INT NOT NULL
                           REFERENCES fixtures(id) ON DELETE CASCADE,
        team_id          INT NOT NULL
                           REFERENCES teams(id) ON DELETE CASCADE,
        possession_pct   NUMERIC(5,2),
        shots            INT,
        shots_on_target  INT,
        corners          INT,
        fouls            INT,
        yellow_cards     INT,
        red_cards        INT,
        offsides         INT,
        saves            INT,
        updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE (fixture_id, team_id)
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_match_stats_fixture_id ON match_stats(fixture_id)`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS match_stats`);
  }
}
