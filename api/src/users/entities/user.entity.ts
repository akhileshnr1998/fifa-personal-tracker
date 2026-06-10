import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { FollowedTeamEntity } from './followed-team.entity';

export interface PushSubscriptionJson {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

@Entity('users')
export class UserEntity {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  user_name!: string;

  @Column({ type: 'jsonb', nullable: true })
  push_subscription!: PushSubscriptionJson | null;

  @Column({ type: 'boolean', default: false })
  push_notifications_enabled!: boolean;

  @Column({ type: 'int', default: 5 })
  reminder_minutes_before!: number;

  @OneToMany(() => FollowedTeamEntity, (team) => team.user, {
    cascade: true,
  })
  followed_teams!: FollowedTeamEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
