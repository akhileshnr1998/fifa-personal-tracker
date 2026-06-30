import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { FixtureEntity } from '../../fixtures/entities/fixture.entity';
import { TeamEntity } from '../../teams/entities/team.entity';

export type MatchEventType =
  | 'goal'
  | 'own_goal'
  | 'penalty_goal'
  | 'penalty_miss'
  | 'yellow_card'
  | 'red_card'
  | 'shootout_goal'
  | 'shootout_miss';

@Entity('match_events')
@Unique('uq_match_events_fixture_order', ['fixture_id', 'event_order'])
export class MatchEventEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index('idx_match_events_fixture_id')
  @Column({ type: 'int' })
  fixture_id!: number;

  @ManyToOne(() => FixtureEntity, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'fixture_id' })
  fixture!: FixtureEntity;

  @Column({ type: 'int', default: 0 })
  event_order!: number;

  @Column({ type: 'varchar', length: 20 })
  type!: MatchEventType;

  @Column({ type: 'int', nullable: true })
  team_id!: number | null;

  @ManyToOne(() => TeamEntity, { onDelete: 'SET NULL', eager: false, nullable: true })
  @JoinColumn({ name: 'team_id' })
  team!: TeamEntity | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  player_name!: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  assist_name!: string | null;

  @Column({ type: 'int', nullable: true })
  minute!: number | null;

  @Column({ type: 'int', nullable: true })
  shot_number!: number | null;

  @Column({ type: 'boolean', default: false })
  is_extra_time!: boolean;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
