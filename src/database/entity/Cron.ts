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

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)' })
    updatedAt!: number
  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)', onUpdate: 'CURRENT_TIMESTAMP(6)' })
    createdAt!: number
}