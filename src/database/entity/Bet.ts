import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn, type Relation } from 'typeorm'
import Infraction from './Infraction.js'

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
    @Column()
      url!: string

    @Column({ type: 'enum', enum: BetStatusEnum })
      status!: 'none' | 'suspect' | 'approved' | 'disapproved'

    @Column()
      score!: number

    @OneToMany(() => Infraction, (infraction) => infraction.bets)
      infractions!: Relation<Infraction[]>
}
