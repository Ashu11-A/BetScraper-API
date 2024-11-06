import QueueBull, { QueueOptions, Queue as QueueType } from 'bull'

export class Queue<T> extends QueueBull<T> {
  private queues: Record<string, QueueType> = {}

  constructor(queueName: string, opts?: QueueOptions) {
    super(queueName, {
      ...opts,
      defaultJobOptions: {
        attempts: 2,
        delay: 10000,
      },
      redis: {
        host: process.env['REDIS_HOST'],
        port: Number(process.env['REDIS_PORT']),
        password: process.env['REDIS_PASSWORD']?.length === 0 ? undefined : process.env['REDIS_PASSWORD']
      }
    })

    this.queues[this.name] = Object.assign(this, { queues: null })
  }
}