import {
  Column,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('players')
export class PlayerEntity {
  @PrimaryColumn({ type: 'int' })
  id!: number;

  @Column({ type: 'varchar', length: 150 })
  full_name!: string;

  @Column({ type: 'varchar', length: 150 })
  display_name!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  position!: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  position_abbr!: string | null;

  @Column({ type: 'int', nullable: true })
  age!: number | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  height_display!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  weight_display!: string | null;

  @Column({ type: 'int', default: 0 })
  appearances!: number;

  @Column({ type: 'int', default: 0 })
  goals!: number;

  @Column({ type: 'int', default: 0 })
  assists!: number;

  @Column({ type: 'int', default: 0 })
  yellow_cards!: number;

  @Column({ type: 'int', default: 0 })
  red_cards!: number;

  @Index('idx_players_espn_athlete_id')
  @Column({ type: 'int', nullable: true })
  espn_athlete_id!: number | null;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
