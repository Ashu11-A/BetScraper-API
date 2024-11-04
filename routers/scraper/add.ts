import { Router } from '@/controllers/router.js'
import Bet from '@/database/entity/Bet.js'
import { Cron } from '@/database/entity/Cron.js'
import { User } from '@/database/entity/User.js'
import { MethodType } from '@/types/router.js'
import { BetQueue } from '@/queues/BetQueue.js'
import { z } from 'zod'

const schema = z.object({
  betId: z.number(),
  userId: z.number().optional(),
  cronId: z.number().optional()
}).refine((data) => data.betId || data.cronId, {
  message: 'At least betId or cronId must be set.',
  path: ['betId', 'cronId']
})

export default new Router({
  name: 'AddScrapingTask',
  description: 'Queues a new scraping task associated with a bet, user, and optionally a cron task.',
  method: [
    {
      type: MethodType.Post,
      authenticate: ['bearer'],
      async run(request, reply) {
        const validation = schema.safeParse(request.body)
        if (!validation.success) {
          return reply.code(400).send({
            message: 'Validation error in input parameters.',
            zod: validation.error
          })
        }

        const { userId, betId, cronId } = validation.data

        try {
          const [betRecord, userRecord, cronRecord] = await Promise.all([
            betId ? Bet.findOneBy({ id: betId }) : Promise.resolve(null),
            userId ? User.findOneBy({ id: userId }) : Promise.resolve(null),
            cronId ? Cron.findOneBy({ id: cronId }) : Promise.resolve(null),
          ])

          if (!betRecord) return reply.code(404).send({ message: 'Bet not found.' })
          if (!userRecord)  return reply.code(404).send({ message: 'User not found.' })
          if (cronId && !cronRecord) return reply.code(404).send({ message: 'Cron task not found.' })

          const queueTask = await BetQueue.addToQueue({
            user: userRecord,
            bet: betRecord,
            cron: cronRecord || undefined,
          })

          return reply.code(200).send({
            message: 'Scraping task successfully queued!',
            data: queueTask
          })
        } catch (error) {
          console.error('Error queuing the scraping task:', error)
          return reply.code(500).send({
            message: 'Internal error when trying to add the task to the queue. Please try again later.'
          })
        }
      }
    }
  ]
})
