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

@Entity('match_stats')
@Unique(['fixture_id', 'team_id'])
export class MatchStatEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index('idx_match_stats_fixture_id')
  @Column({ type: 'int' })
  fixture_id!: number;

  @ManyToOne(() => FixtureEntity, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'fixture_id' })
  fixture!: FixtureEntity;

  @Column({ type: 'int' })
  team_id!: number;

  @ManyToOne(() => TeamEntity, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'team_id' })
  team!: TeamEntity;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  possession_pct!: number | null;

  @Column({ type: 'int', nullable: true })
  shots!: number | null;

  @Column({ type: 'int', nullable: true })
  shots_on_target!: number | null;

  @Column({ type: 'int', nullable: true })
  corners!: number | null;

  @Column({ type: 'int', nullable: true })
  fouls!: number | null;

  @Column({ type: 'int', nullable: true })
  yellow_cards!: number | null;

  @Column({ type: 'int', nullable: true })
  red_cards!: number | null;

  @Column({ type: 'int', nullable: true })
  offsides!: number | null;

  @Column({ type: 'int', nullable: true })
  saves!: number | null;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
