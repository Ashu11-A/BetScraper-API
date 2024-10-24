import { Router } from '@/controllers/router.js'
import Bet from '@/database/entity/Bet.js'
import { MethodType } from '@/types/router.js'
import { z } from 'zod'

const schema = z.object({
  id: z.number(),
})

export default new Router({
  name: 'Bet delete',
  description: 'Bet manager',
  method: [
    {
      type: MethodType.Delete,
      authenticate: ['bearer'],
      async run(request, reply) {
        const parsed = schema.safeParse(request.body)
        if (!parsed.success) {
          return reply.status(500).send(JSON.stringify(parsed.error))
        }

        const exist = await Bet.findOne({ where: { id: parsed.data.id } })
        if (exist === null) return reply.status(404).send(new Error('Bet not found'))

        await exist.remove()
        return reply.status(200).send(JSON.stringify({ message: 'Successfully removed' }))
      }
    }
  ]
})