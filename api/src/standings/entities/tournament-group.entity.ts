import {
  Column,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('tournament_groups')
export class TournamentGroupEntity {
  @PrimaryColumn({ type: 'int' })
  id!: number;

  @Index('idx_tournament_groups_name', { unique: true })
  @Column({ type: 'varchar', length: 30 })
  name!: string;

  @Index('idx_tournament_groups_abbr', { unique: true })
  @Column({ type: 'varchar', length: 5 })
  abbreviation!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  espn_group_id!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  last_synced_at!: Date | null;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
