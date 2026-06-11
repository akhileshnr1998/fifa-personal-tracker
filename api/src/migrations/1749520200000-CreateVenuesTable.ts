import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateVenuesTable1749520200000 implements MigrationInterface {
  name = 'CreateVenuesTable1749520200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE venues (
        id INT PRIMARY KEY,
        name VARCHAR(150) NOT NULL UNIQUE,
        city VARCHAR(100),
        country VARCHAR(100),
        espn_venue_id INT,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await queryRunner.query(`
      INSERT INTO venues (id, name, city, country, espn_venue_id)
      VALUES (0, 'TBD', NULL, NULL, NULL)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS venues`);
  }
}
