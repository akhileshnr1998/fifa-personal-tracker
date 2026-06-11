import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable1749520300000 implements MigrationInterface {
  name = 'CreateUsersTable1749520300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE users (
        id UUID PRIMARY KEY,
        user_name VARCHAR(100) NOT NULL,
        push_subscription JSONB,
        push_notifications_enabled BOOLEAN NOT NULL DEFAULT FALSE,
        reminder_minutes_before INT NOT NULL DEFAULT 5,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS users`);
  }
}
