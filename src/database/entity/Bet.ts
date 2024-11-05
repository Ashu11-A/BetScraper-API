import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn, type Relation } from 'typeorm'
import { Cron } from './Cron.js'
import { Task } from './Task.js'

export enum BetStatusEnum {
  None = 'none',
  Suspect = 'suspect',
  Approved = 'approved',
  Disapproved = 'disapproved'
}

@Entity({ name: 'bets' })
export default class Bet extends BaseEntity {
  @PrimaryGeneratedColumn()
    id!: number
  @Column('varchar')
    name!: string
  @Column('varchar')
    url!: string

  @Column({
    type: 'enum',
    enum: BetStatusEnum,
    default: BetStatusEnum.None
  })
    status!: 'none' | 'suspect' | 'approved' | 'disapproved'

  @Column({ type: 'int', default: 0 })
    score!: number

  @OneToMany(() => Task, (task) => task.bet)
    tasks!: Relation<Task[]>
  @ManyToOne(() => Cron, (cron) => cron.expression, { nullable: true, cascade: true })
    cron?: Relation<Cron>

  @UpdateDateColumn()
    updatedAt!: Date
  @CreateDateColumn()
    createdAt!: Date
}