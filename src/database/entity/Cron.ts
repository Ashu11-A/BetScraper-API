import { BaseEntity, Column, Entity, Generated, OneToMany, PrimaryGeneratedColumn, type Relation } from 'typeorm'
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
}