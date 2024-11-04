import { Router } from '@/controllers/router.js'
import Bet from '@/database/entity/Bet.js'
import { MethodType } from '@/types/router.js'
import { z } from 'zod'

const schema = z.object({
  name: z.string(),
  url: z.string().url()
})

export default new Router({
  name: 'CreateBet',
  description: 'Handles the creation of new bet entries, including input validation and duplicate checks',
  method: [
    {
      type: MethodType.Post,
      authenticate: ['bearer'],
      async run(request, reply) {
        const parsed = schema.safeParse(request.body)
        if (!parsed.success) {
          return reply.code(400).send({ 
            message: 'Invalid input data. Please correct the errors and try again.', 
            zod: parsed.error
          })
        }

        const existingBet = await Bet.findOneBy({ url: parsed.data.url })
        if (existingBet) {
          return reply.code(422).send({
            message: 'A bet with the provided name or URL already exists. Please use different details.'
          })
        }

        const bet = Bet.create({
          ...parsed.data,
          status: 'none',
          score: 0
        })
        await bet.save()

        return reply.code(201).send({
          message: 'Bet successfully created!',
          data: {
            id: bet.id,
            name: bet.name,
            url: bet.url,
            status: bet.status,
            score: bet.score,
            createdAt: bet.createdAt,
            updatedAt: bet.updatedAt
          }
        })
      }
    }
  ]
})
