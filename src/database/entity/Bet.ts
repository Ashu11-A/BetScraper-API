import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn, type Relation } from 'typeorm'
import Infraction from './Infraction.js'
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

  @OneToMany(() => Infraction, (infraction) => infraction.bets)
    infractions!: Relation<Infraction[]>
  @OneToMany(() => Task, (task) => task.bet)
    tasks!: Relation<Task[]>
}
