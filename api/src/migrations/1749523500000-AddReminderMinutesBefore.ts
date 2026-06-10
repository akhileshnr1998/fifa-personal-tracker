import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReminderMinutesBefore1749523500000 implements MigrationInterface {
  name = 'AddReminderMinutesBefore1749523500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS reminder_minutes_before INT NOT NULL DEFAULT 5
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users DROP COLUMN IF EXISTS reminder_minutes_before
    `);
  }
}
