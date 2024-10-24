import { Router } from '@/controllers/router.js'
import Bet from '@/database/entity/Bet.js'
import { MethodType } from '@/types/router.js'
import { z } from 'zod'

const schema = z.object({
  name: z.string(),
  url: z.string().url()
})

export default new Router({
  name: 'Bet create',
  description: 'Bet manager',
  method: [
    {
      type: MethodType.Post,
      authenticate: ['bearer'],
      async run(request, reply) {
        const parsed = schema.safeParse(request.body)
        if (!parsed.success) return reply.status(500).send(JSON.stringify(parsed.error))

        const exist = await Bet.findOne({
          where: [
            { name: parsed.data.name },
            { url: parsed.data.url }
          ]
        })

        if (exist !== null) {
          return reply.status(422).send(new Error('Name or URL already registered in the database'))
        }

        const bet = Bet.create({
          ...parsed.data,
          status: 'none',
          score: 0
        })
        await bet.save()

        return reply.send(JSON.stringify(bet))
      }
    }
  ]
})