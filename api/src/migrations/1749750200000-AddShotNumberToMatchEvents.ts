import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddShotNumberToMatchEvents1749750200000
  implements MigrationInterface
{
  name = 'AddShotNumberToMatchEvents1749750200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE match_events
        ADD COLUMN shot_number INT
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE match_events
        DROP COLUMN IF EXISTS shot_number
    `);
  }
}
