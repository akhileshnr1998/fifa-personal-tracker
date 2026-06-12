import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMatchEventsTable1749650100000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS match_events (
        id            SERIAL PRIMARY KEY,
        fixture_id    INT NOT NULL
                        REFERENCES fixtures(id) ON DELETE CASCADE,
        event_order   INT NOT NULL DEFAULT 0,
        type          VARCHAR(20) NOT NULL
                        CHECK (type IN (
                          'goal','own_goal','penalty_goal','penalty_miss',
                          'yellow_card','red_card'
                        )),
        team_id       INT REFERENCES teams(id) ON DELETE SET NULL,
        player_name   VARCHAR(150),
        assist_name   VARCHAR(150),
        minute        INT,
        is_extra_time BOOLEAN NOT NULL DEFAULT FALSE,
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT uq_match_events_fixture_order UNIQUE (fixture_id, event_order)
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_match_events_fixture_id ON match_events(fixture_id)`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS match_events`);
  }
}
