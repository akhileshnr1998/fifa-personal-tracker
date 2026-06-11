import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TeamEntity } from '../../teams/entities/team.entity';
import { VenueEntity } from '../../venues/entities/venue.entity';
import { FixtureStatus } from '../fixture-status';

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

  @Index('idx_fixtures_home_team_id')
  @Column({ type: 'int' })
  home_team_id!: number;

  @ManyToOne(() => TeamEntity, { eager: false })
  @JoinColumn({ name: 'home_team_id' })
  home_team!: TeamEntity;

  @Index('idx_fixtures_away_team_id')
  @Column({ type: 'int' })
  away_team_id!: number;

  @ManyToOne(() => TeamEntity, { eager: false })
  @JoinColumn({ name: 'away_team_id' })
  away_team!: TeamEntity;

  @Index('idx_fixtures_venue_id')
  @Column({ type: 'int' })
  venue_id!: number;

  @ManyToOne(() => VenueEntity, { eager: false })
  @JoinColumn({ name: 'venue_id' })
  venue!: VenueEntity;

  @Column({ type: 'varchar', length: 20, default: 'scheduled' })
  status!: FixtureStatus;

  @Column({ type: 'int', nullable: true })
  home_score!: number | null;

  @Column({ type: 'int', nullable: true })
  away_score!: number | null;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
