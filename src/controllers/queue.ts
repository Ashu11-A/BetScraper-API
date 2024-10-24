import QueueBull, { QueueOptions } from 'bull'

export class Queue extends QueueBull {
  constructor(queueName: string, opts?: QueueOptions) {
    super(queueName, {
      ...opts,
      limiter: {
        max: 50,
        duration: 10000,
      },
      redis: {
        host: '127.0.0.1',
        port: 6379
      }
    })
  }
}