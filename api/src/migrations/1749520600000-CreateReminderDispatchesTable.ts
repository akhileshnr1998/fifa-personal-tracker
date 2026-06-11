import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateReminderDispatchesTable1749520600000
  implements MigrationInterface
{
  name = 'CreateReminderDispatchesTable1749520600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE reminder_dispatches (
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        fixture_id INT NOT NULL,
        sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, fixture_id)
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS reminder_dispatches`);
  }
}
