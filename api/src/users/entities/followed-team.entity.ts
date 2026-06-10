import {
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('followed_teams')
export class FollowedTeamEntity {
  @PrimaryColumn({ type: 'uuid' })
  user_id!: string;

  @Index('idx_followed_teams_team_name')
  @PrimaryColumn({ type: 'varchar', length: 100 })
  team_name!: string;

  @ManyToOne(() => UserEntity, (user) => user.followed_teams, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;
}
