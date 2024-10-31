import { Router } from '@/controllers/router.js'
import Bet from '@/database/entity/Bet.js'
import { MethodType } from '@/types/router.js'
import { z } from 'zod'

const schema = z.object({
  id: z.number(),
  name: z.string().optional(),
  url: z.string().url().optional()
})

export default new Router({
  name: 'Bet create',
  description: 'Bet manager',
  method: [
    {
      type: MethodType.Put,
      authenticate: ['bearer'],
      async run(request, reply) {
        const parsed = schema.safeParse(request.body)

        if (!parsed.success) {
          return reply.status(500).send(JSON.stringify(parsed.error))
        }

        const exist = await Bet.findOneBy({ id: parsed.data.id })

        if (exist === null) {
          return reply.status(422).send(new Error('Bet not found'))
        }

        const bet = await Bet.update({ id: exist.id }, { ...parsed.data })

        return reply.send(JSON.stringify(bet))
      }
    }
  ]
})