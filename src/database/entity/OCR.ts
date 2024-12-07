import { type BoundingBox, type Viewport } from 'puppeteer'
import { BaseEntity, Column, Entity, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn, type Relation } from 'typeorm'
import Compliance from './Compliance.js'
import { Task } from './Task.js'
import { Image } from './Image.js'

@Entity({ name: 'ocrs' })
export class OCR extends BaseEntity {
    @PrimaryGeneratedColumn()
      id!: number

    @ManyToOne(() => Task, (task) => task.ocrs)
      task!: Relation<Task>
    @ManyToMany(() => Compliance)
    @JoinTable()
      compliances!: Relation<Compliance[]>
    @ManyToMany(() => Image, (image) => image.ocrs)
      images!: Relation<Image[]>

    @Column('float')
      proportionPercentage!: number
    @Column('float')
      scrollPercentage!: number
    @Column('float')
      distanceToTop!: number
  
    @Column('bool')
      isIntersectingViewport!: boolean
    @Column('bool')
      isVisible!: boolean
    @Column('bool')
      isHidden!: boolean
    @Column('bool')
      isInViewport!: boolean

    @Column('simple-json', {
      transformer: {
        to(value: string): string {
          return JSON.stringify(value)
        },
        from(value: string) {
          return JSON.parse(value)
        },
      }
    })
      viewport!: Viewport
    @Column('simple-json', {
      transformer: {
        to(value: string): string {
          return JSON.stringify(value)
        },
        from(value: string) {
          return JSON.parse(value)
        },
      }
    })
      pageDimensions!: { width: number, height: number }
    @Column('simple-json', {
      transformer: {
        to(value: string): string {
          return JSON.stringify(value)
        },
        from(value: string) {
          return JSON.parse(value)
        },
      }
    })
      elementBox!: BoundingBox
}