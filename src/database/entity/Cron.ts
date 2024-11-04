import { BaseEntity, Column, CreateDateColumn, Entity, Generated, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn, type Relation } from 'typeorm'
import { Task } from './Task.js'

@Entity({ name: 'crons' })
export class Cron extends BaseEntity {
  @PrimaryGeneratedColumn()
    id!: number
  @Generated('uuid')
    uuid!: string

  @Column({ type: 'varchar' })
    expression!: string
  
  @OneToMany(() => Task, (task) => task.cron)
    tasks!: Relation<Task[]>

  @Column('timestamp', { nullable: true })
    lastExecutedAt?: Date
  @Column('timestamp', { nullable: true })
    nextExecutionAt?: Date

  @UpdateDateColumn()
    updatedAt!: number
  @CreateDateColumn()
    createdAt!: number
}