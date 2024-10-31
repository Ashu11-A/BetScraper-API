import { BaseEntity, Column, CreateDateColumn, Entity, Generated, OneToMany, PrimaryGeneratedColumn, type Relation, UpdateDateColumn } from 'typeorm'
import { Task } from './Task.js'

@Entity({ name: 'users' })
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
    id!: number
  @Column({ type: 'uuid' })
  @Generated('uuid')
    uuid!: string

  @Column({ type: 'text' })
    name!: string
  @Column({ type: 'text' })
    username!: string
  @Column({ type: 'varchar' })
    email!: string

  @OneToMany(() => Task, (task) => task.user)
    tasks!: Relation<Task[]>

  @Column({ type: 'varchar' })
    language!: string

  @Column({ type: 'text' })
    password!: string

  @Column('timestamp', { nullable: true })
    lastExecutedAt?: Date
  @Column('timestamp', { nullable: true })
    nextExecutionAt?: Date
  @UpdateDateColumn()
    updated_at!: Date
  @CreateDateColumn()
    created_at!: Date
}
