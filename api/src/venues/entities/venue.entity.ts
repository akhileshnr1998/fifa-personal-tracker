import {
  Column,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('venues')
export class VenueEntity {
  @PrimaryColumn({ type: 'int' })
  id!: number;

  @Index('idx_venues_name', { unique: true })
  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country!: string | null;

  @Column({ type: 'int', nullable: true })
  espn_venue_id!: number | null;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
