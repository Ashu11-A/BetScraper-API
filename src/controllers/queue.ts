import QueueBull, { QueueOptions, Queue as QueueType } from 'bull'

export class Queue<T> extends QueueBull<T> {
  private queues: Record<string, QueueType> = {}

  constructor(queueName: string, opts?: QueueOptions) {
    super(queueName, {
      ...opts,
      defaultJobOptions: {
        attempts: 2,
      },
      limiter: {
        max: 4,
        duration: 10000,
      },
      redis: {
        host: '127.0.0.1',
        port: 6379
      }
    })

    this.queues[this.name] = Object.assign(this, { queues: null })
  }
}