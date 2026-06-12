import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { FixtureEntity } from '../../fixtures/entities/fixture.entity';
import { UserEntity } from './user.entity';

@Entity('reminder_dispatches')
export class ReminderDispatchEntity {
  @PrimaryColumn({ type: 'uuid' })
  user_id!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @PrimaryColumn({ type: 'int' })
  fixture_id!: number;

  @ManyToOne(() => FixtureEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'fixture_id' })
  fixture!: FixtureEntity;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  sent_at!: Date;
}
