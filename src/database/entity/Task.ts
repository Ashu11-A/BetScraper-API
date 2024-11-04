import { BaseEntity, Column, CreateDateColumn, Entity, Generated, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn, type Relation, UpdateDateColumn } from 'typeorm'
import Bet from './Bet.js'
import Compliance from './Compliance.js'
import { Cron } from './Cron.js'
import { User } from './User.js'

enum StatusTask {
  Scheduled = 'scheduled',
  Running = 'running',
  Paused = 'paused',
  Failed = 'failed',
  Completed = 'completed'
}

@Entity({ name: 'tasks' })
export class Task extends BaseEntity {
  @PrimaryGeneratedColumn()
    id!: number
  @Generated('uuid')
    uuid!: string

  @ManyToOne(() => Bet, (bet) => bet.tasks, { cascade: true, onDelete: 'CASCADE' })
    bet!: Relation<Bet>
  @ManyToOne(() => User, (user) => user.tasks, { nullable: true, cascade: true })
    user?: Relation<User>
  @ManyToOne(() => Cron, (cron) => cron.expression, { nullable: true, cascade: true })
    cron?: Relation<Cron>
  @ManyToMany(() => Compliance)
  @JoinTable()
    compliances!: Relation<Compliance[]>
  
  @Column({
    type: 'enum',
    enum: StatusTask,
    default: StatusTask.Scheduled
  })
    status!: 'scheduled' | 'running' | 'paused' | 'failed' | 'completed'

  @Column({ type: 'text', nullable: true })
    errorMessage?: string
  @Column({ type: 'int', nullable: true })
    duration?: number

  @Column({ type: 'timestamp', nullable: true })
    scheduledAt?: Date
  @Column('timestamp', { nullable: true })
    finishedAt?: Date
  @UpdateDateColumn()
    updatedAt!: Date
  @CreateDateColumn()
    createdAt!: Date
}