import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { PlayerEntity } from './player.entity';
import { TeamEntity } from './team.entity';

@Entity('team_squad_members')
export class TeamSquadMemberEntity {
  @PrimaryColumn({ type: 'int' })
  team_id!: number;

  @PrimaryColumn({ type: 'int' })
  player_id!: number;

  @Column({ type: 'varchar', length: 10, nullable: true })
  jersey!: string | null;

  @Index('idx_team_squad_members_team_id')
  @ManyToOne(() => TeamEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'team_id' })
  team!: TeamEntity;

  @ManyToOne(() => PlayerEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'player_id' })
  player!: PlayerEntity;
}
