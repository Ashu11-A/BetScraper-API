import { BaseEntity, Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn, type Relation } from 'typeorm'
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
  @Column()
    name!: string
  @Column('varchar')
    url!: string

  @Column({
    type: 'enum',
    enum: BetStatusEnum,
    default: BetStatusEnum.None
  })
    status!: 'none' | 'suspect' | 'approved' | 'disapproved'

  @Column('int')
    score!: number

  @OneToMany(() => Task, (task) => task.bet)
    tasks!: Relation<Task[]>

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)' })
    updatedAt!: number
  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)', onUpdate: 'CURRENT_TIMESTAMP(6)' })
    createdAt!: number
}
