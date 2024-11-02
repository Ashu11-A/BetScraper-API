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
        if (!parsed.success) return reply.code(400).send({ message: parsed.error.message, zod: parsed.error })

        const exist = await Bet.findOneBy({ url: parsed.data.url })

        if (exist !== null) {
          return reply.code(422).send({
            message: 'Name or URL already registered in the database'
          })
        }

        const bet = Bet.create({
          ...parsed.data,
          status: 'none',
          score: 0
        })
        await bet.save()

        return reply.code(200).send({
          message: 'Bet criado com sucesso!',
          data: bet
        })
      }
    }
  ]
})