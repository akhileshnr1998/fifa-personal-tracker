import {
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { TeamEntity } from '../../teams/entities/team.entity';
import { UserEntity } from './user.entity';

@Entity('followed_teams')
export class FollowedTeamEntity {
  @PrimaryColumn({ type: 'uuid' })
  user_id!: string;

  @Index('idx_followed_teams_team_id')
  @PrimaryColumn({ type: 'int' })
  team_id!: number;

  @ManyToOne(() => UserEntity, (user) => user.followed_teams, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @ManyToOne(() => TeamEntity, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'team_id' })
  team!: TeamEntity;
}
