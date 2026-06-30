import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddShootoutEventTypes1749750100000 implements MigrationInterface {
  name = 'AddShootoutEventTypes1749750100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE match_events DROP CONSTRAINT IF EXISTS match_events_type_check
    `);
    await queryRunner.query(`
      ALTER TABLE match_events ADD CONSTRAINT match_events_type_check
        CHECK (type IN (
          'goal','own_goal','penalty_goal','penalty_miss',
          'yellow_card','red_card',
          'shootout_goal','shootout_miss'
        ))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE match_events DROP CONSTRAINT IF EXISTS match_events_type_check
    `);
    await queryRunner.query(`
      ALTER TABLE match_events ADD CONSTRAINT match_events_type_check
        CHECK (type IN (
          'goal','own_goal','penalty_goal','penalty_miss',
          'yellow_card','red_card'
        ))
    `);
  }
}
