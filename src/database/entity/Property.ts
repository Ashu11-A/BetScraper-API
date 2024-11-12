import { type BoxModel, type Viewport } from 'puppeteer'
import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn, type Relation } from 'typeorm'
import { Task } from './Task.js'
import { Properties } from '@/scraper/properties.js'

type Colors = {
  text: {
    value: string,
    color: [number, number, number]
  },
  backgroundColor: {
    value: string
    color: [number, number, number]
  }
}

@Entity({ name: 'properties' })
export class Property extends BaseEntity implements Properties {
    @PrimaryGeneratedColumn()
      id!: number

    @ManyToOne(() => Task, (task) => task.properties)
      task!: Relation<Task>

    @Column('text')
      content!: string

    @Column('float')
      contrast!: number
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
      hasChildNodes!: boolean
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
      colors!: Colors
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
      elementBox!: BoxModel
}