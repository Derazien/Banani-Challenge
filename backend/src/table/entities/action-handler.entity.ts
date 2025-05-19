import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * TypeORM entity for action handlers stored in the database
 */
@Entity('action_handlers')
export class ActionHandler {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  type: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  version: string;

  @Column({ default: true })
  enabled: boolean;

  @Column('simple-json', { nullable: true })
  settings: Record<string, any>;

  @Column({ nullable: true })
  icon: string;

  @Column('text', { nullable: true })
  code: string;

  @Column({ nullable: true })
  frontendVersion: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

/**
 * Data transfer object for creating/updating action handlers
 */
export class ActionHandlerDto {
  type: string;
  name: string;
  description?: string;
  version: string;
  enabled?: boolean;
  settings?: Record<string, any>;
  icon?: string;
  code?: string;
  frontendVersion?: string;
} 