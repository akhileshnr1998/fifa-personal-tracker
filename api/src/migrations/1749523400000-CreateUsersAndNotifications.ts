import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersAndNotifications1749523400000
  implements MigrationInterface
{
  name = 'CreateUsersAndNotifications1749523400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        user_name VARCHAR(100) NOT NULL,
        push_subscription JSONB,
        push_notifications_enabled BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS followed_teams (
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        team_name VARCHAR(100) NOT NULL,
        PRIMARY KEY (user_id, team_name)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_followed_teams_team_name
      ON followed_teams(team_name)
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS reminder_dispatches (
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        fixture_id INT NOT NULL,
        sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, fixture_id)
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS reminder_dispatches`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_followed_teams_team_name`);
    await queryRunner.query(`DROP TABLE IF EXISTS followed_teams`);
    await queryRunner.query(`DROP TABLE IF EXISTS users`);
  }
}
