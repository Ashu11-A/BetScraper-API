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
        if (!parsed.success) return reply.code(400).send({ message: parsed.error.message, zod: parsed.error })

        const exist = await Bet.findOneBy({ id: parsed.data.id })
        if (exist === null) return reply.code(404).send({ message: 'Bet not found' })

        const bet = await Bet.update({ id: exist.id }, { ...parsed.data })
        return reply.code(200).send({ 
          message: 'Bet registrado com sucesso no banco de dados!',
          data: bet
        })
      }
    }
  ]
})