import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFixtureDecidedByAndPenaltyScores1749750000000
  implements MigrationInterface
{
  name = 'AddFixtureDecidedByAndPenaltyScores1749750000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE fixtures
        ADD COLUMN decided_by VARCHAR(20) NOT NULL DEFAULT 'regulation',
        ADD COLUMN home_penalty_score INT,
        ADD COLUMN away_penalty_score INT
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE fixtures
        DROP COLUMN IF EXISTS away_penalty_score,
        DROP COLUMN IF EXISTS home_penalty_score,
        DROP COLUMN IF EXISTS decided_by
    `);
  }
}
