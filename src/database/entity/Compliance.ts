import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

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
}