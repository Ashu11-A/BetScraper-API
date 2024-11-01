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
  message: 'É necessário que pelo menos betId ou cronId seja definido.',
  path: ['betId', 'cronId']
})

const Error = {
  validationError: (error: z.ZodError<z.infer<typeof schema>>) => ({ status: 400, message: JSON.stringify(error) }),
  betNotFound: { status: 404, message: 'Bet não encontrado.' },
  userNotFound: { status: 404, message: 'User não encontrado.' },
  cronNotFound: { status: 404, message: 'Cron não encontrado.' }
}

export default new Router({
  name: 'Scraping',
  description: 'Adiciona uma tarefa de scraping à fila',
  method: [
    {
      type: MethodType.Post,
      authenticate: ['bearer'],
      async run(request, reply) {
        const parsed = schema.safeParse(request.body)
        if (!parsed.success) {
          return reply.status(Error['validationError'](parsed.error).status).send(Error['validationError'](parsed.error).message)
        }
        const { userId, betId, cronId } = parsed.data

        const [bet, user, cron] = await Promise.all([
          betId ? Bet.findOneBy({ id: betId }) : Promise.resolve(null),
          User.findOneBy({ id: userId }),
          cronId ? Cron.findOneBy({ id: cronId }) : Promise.resolve(null),
        ])

        if (!bet) return reply.status(Error['betNotFound'].status).send(Error['betNotFound'].message)
        if (!user) return reply.status(Error['userNotFound'].status).send(Error['userNotFound'].message)
        if (!cron && cronId) return reply.status(Error['cronNotFound'].status).send(Error['cronNotFound'].message)

        const queue = await BetQueue.addToQueue({
          user,
          bet,
          cron: cron === null ? undefined : cron
        })

        return reply.send(JSON.stringify(queue))
      }
    }
  ]
})
