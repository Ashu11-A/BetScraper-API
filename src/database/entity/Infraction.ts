import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, type Relation } from 'typeorm'
import Bet from './Bet.js'

@Entity()
export default class Infraction {
  @PrimaryGeneratedColumn()
    id!: number

  @Column()
    value!: string

  @ManyToOne(() => Bet, (bet) => bet.infractions)
    bets!: Relation<Bet[]>
}