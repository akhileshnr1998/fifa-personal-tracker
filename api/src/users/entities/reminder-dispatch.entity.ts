import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('reminder_dispatches')
export class ReminderDispatchEntity {
  @PrimaryColumn({ type: 'uuid' })
  user_id!: string;

  @PrimaryColumn({ type: 'int' })
  fixture_id!: number;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  sent_at!: Date;
}
