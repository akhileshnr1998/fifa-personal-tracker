import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSummaryFetchedToFixtures1749650000000
  implements MigrationInterface
{
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE fixtures ADD COLUMN IF NOT EXISTS summary_fetched BOOLEAN NOT NULL DEFAULT FALSE`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE fixtures DROP COLUMN IF EXISTS summary_fetched`,
    );
  }
}
