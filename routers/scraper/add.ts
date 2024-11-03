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
  cronId: z.number()
}).refine((data) => data.betId || data.cronId, {
  message: 'É necessário que pelo menos betId ou cronId seja definido.',
  path: ['betId', 'cronId']
})

export default new Router({
  name: 'Scraping',
  description: 'Adiciona uma tarefa de scraping à fila',
  method: [
    {
      type: MethodType.Post,
      authenticate: ['bearer'],
      async run(request, reply) {
        const parsed = schema.safeParse(request.body)
        if (!parsed.success) return reply.code(400).send({ message: parsed.error.message, zod: parsed.error })

        const { userId, betId, cronId } = parsed.data
        const [bet, user, cron] = await Promise.all([
          betId ? Bet.findOneBy({ id: betId }) : Promise.resolve(null),
          User.findOneBy({ id: userId }),
          Cron.findOneBy({ id: cronId }),
        ])

        if (!bet) return reply.code(404).send({ message: 'Bet não encontrado.' })
        if (!user) return reply.code(404).send({ message: 'User não encontrado.' })
        if (!cron) return reply.code(404).send({ message: 'Cron não encontrado.' })

        const queue = await BetQueue.addToQueue({
          user,
          bet,
          cron,
        })

        return reply.code(200).send({ message: 'Ação adicionada com sucesso a fila!', data: queue })
      }
    }
  ]
})
