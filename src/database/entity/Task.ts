import { BaseEntity, Column, CreateDateColumn, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn, type Relation, UpdateDateColumn } from 'typeorm'
import Bet from './Bet.js'
import Compliance from './Compliance.js'
import { User } from './User.js'
import { Property } from './Property.js'

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
  @Column({ type: 'text' })
    uuid!: string

  @ManyToOne(() => Bet, (bet) => bet.tasks)
    bet!: Relation<Bet>
  @ManyToOne(() => User, (user) => user.tasks, { nullable: true })
    user?: Relation<User>
  @OneToMany(() => Property, (property) => property.task, { nullable: true})
    properties?: Relation<Property[]>
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