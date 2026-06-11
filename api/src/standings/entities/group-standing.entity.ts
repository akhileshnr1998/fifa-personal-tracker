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
import { TournamentGroupEntity } from './tournament-group.entity';

@Entity('group_standings')
@Index('idx_group_standings_group_rank', ['group_id', 'rank'])
export class GroupStandingEntity {
  @PrimaryColumn({ type: 'int' })
  group_id!: number;

  @ManyToOne(() => TournamentGroupEntity, { eager: false })
  @JoinColumn({ name: 'group_id' })
  group!: TournamentGroupEntity;

  @Index('idx_group_standings_team_id')
  @PrimaryColumn({ type: 'int' })
  team_id!: number;

  @ManyToOne(() => TeamEntity, { eager: false })
  @JoinColumn({ name: 'team_id' })
  team!: TeamEntity;

  @Column({ type: 'smallint', default: 0 })
  rank!: number;

  @Column({ type: 'smallint', default: 0 })
  rank_change!: number;

  @Column({ type: 'smallint', default: 0 })
  games_played!: number;

  @Column({ type: 'smallint', default: 0 })
  wins!: number;

  @Column({ type: 'smallint', default: 0 })
  draws!: number;

  @Column({ type: 'smallint', default: 0 })
  losses!: number;

  @Column({ type: 'smallint', default: 0 })
  goals_for!: number;

  @Column({ type: 'smallint', default: 0 })
  goals_against!: number;

  @Column({ type: 'smallint', default: 0 })
  goal_diff!: number;

  @Column({ type: 'smallint', default: 0 })
  points!: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  qualification_label!: string | null;

  @Column({ type: 'varchar', length: 7, nullable: true })
  qualification_color!: string | null;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
