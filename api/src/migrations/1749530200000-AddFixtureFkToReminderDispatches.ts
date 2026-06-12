import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFixtureFkToReminderDispatches1749530200000
  implements MigrationInterface
{
  name = 'AddFixtureFkToReminderDispatches1749530200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE reminder_dispatches
        ADD CONSTRAINT fk_reminder_dispatches_fixture
        FOREIGN KEY (fixture_id)
        REFERENCES fixtures(id)
        ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE reminder_dispatches
        DROP CONSTRAINT IF EXISTS fk_reminder_dispatches_fixture
    `);
  }
}
