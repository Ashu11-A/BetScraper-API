import { Router } from '@/controllers/router.js'
import Bet from '@/database/entity/Bet.js'
import { MethodType } from '@/types/router.js'
import { z } from 'zod'

const schema = z.object({
  id: z.number(),
})

export default new Router({
  name: 'DeleteBet',
  description: 'Handles the deletion of bet entries, ensuring validation and existence checks',
  method: [
    {
      type: MethodType.Delete,
      authenticate: ['bearer'],
      async run(request, reply) {
        const validation = schema.safeParse(request.body)
        if (!validation.success) {
          return reply.code(400).send({
            message: 'Invalid request data. Please ensure the input is correct.',
            zod: validation.error
          })
        }

        const betToDelete = await Bet.findOneBy({ id: validation.data.id })
        if (!betToDelete) {
          return reply.code(404).send({ 
            message: 'Bet not found. Please verify the ID and try again.' 
          })
        }

        await betToDelete.remove()
        return reply.code(200).send({
          message: 'Bet successfully deleted.',
          data: {
            id: betToDelete.id,
            name: betToDelete.name,
            url: betToDelete.url,
            status: betToDelete.status,
            score: betToDelete.score,
            deletedAt: new Date().toISOString()
          }
        })
      }
    }
  ]
})
