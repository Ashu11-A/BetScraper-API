import { BaseEntity, Column, CreateDateColumn, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn, type Relation, UpdateDateColumn } from 'typeorm'
import { OCR } from './OCR.js'

@Entity({ name: 'images' })
export class Image extends BaseEntity {
    @PrimaryGeneratedColumn()
      id!: number

    @Column({ type: 'text' })
      hash!: string

    @Column({ type: 'text', nullable: true })
      content!: string

    @ManyToMany(() => OCR, (ocr) => ocr.images, { cascade: true })
    @JoinTable()
      ocrs!: Relation<OCR[]>

    @UpdateDateColumn()
      updatedAt!: Date
    @CreateDateColumn()
      createdAt!: Date
}