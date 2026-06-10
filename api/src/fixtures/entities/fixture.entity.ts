import {
  Column,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('fixtures')
export class FixtureEntity {
  @PrimaryColumn({ type: 'int' })
  id!: number;

  @Column({ type: 'int', nullable: true })
  match_number!: number | null;

  @Index('idx_fixtures_date')
  @Column({ type: 'timestamptz' })
  match_date_time!: Date;

  @Column({ type: 'int' })
  stage_id!: number;

  @Column({ type: 'varchar', length: 100 })
  home_team!: string;

  @Column({ type: 'varchar', length: 100 })
  away_team!: string;

  @Column({ type: 'varchar', length: 150, default: 'TBD' })
  venue!: string;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
