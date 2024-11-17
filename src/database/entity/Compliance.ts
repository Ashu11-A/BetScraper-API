import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

export enum ComplianceType {
  Bunus = 'bunus',
  Advisement = 'advisement',
  LegalAgeAdvisement = 'legalAgeAdvisement'
}

@Entity({ name: 'compliances' })
export default class Compliance extends BaseEntity {
  @PrimaryGeneratedColumn()
    id!: number

  @Column({ type: 'text' })
    value!: string
  @Column({ type: 'enum', enum: ComplianceType })
    type!: ComplianceType

  @UpdateDateColumn()
    updatedAt!: number
  @CreateDateColumn()
    createdAt!: number
}