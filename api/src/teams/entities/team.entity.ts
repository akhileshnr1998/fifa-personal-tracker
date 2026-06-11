import {
  Column,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('teams')
export class TeamEntity {
  @PrimaryColumn({ type: 'int' })
  id!: number;

  @Index('idx_teams_name', { unique: true })
  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Index('idx_teams_is_placeholder')
  @Column({ type: 'boolean', default: false })
  is_placeholder!: boolean;

  @Column({ type: 'int', nullable: true })
  espn_team_id!: number | null;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
