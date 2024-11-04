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
  name: 'UpdateBet',
  description: 'Updates existing bet records in the database',
  method: [
    {
      type: MethodType.Put,
      authenticate: ['bearer'],
      async run(request, reply) {
        const validation = schema.safeParse(request.body)
        if (!validation.success) {
          return reply.code(400).send({
            message: 'Invalid request data. Please check your input.',
            zod: validation.error
          })
        }

        const { id, ...updateFields } = validation.data

        const existingBet = await Bet.findOneBy({ id })
        if (!existingBet) {
          return reply.code(404).send({ message: 'Bet not found' })
        }

        try {
          await Bet.update({ id }, updateFields)
          const updatedBet = await Bet.findOneBy({ id })

          return reply.code(200).send({
            message: 'Bet successfully updated!',
            data: updatedBet
          })
        } catch (error) {
          console.error('Error updating bet:', error)
          return reply.code(500).send({
            message: 'An error occurred while updating the bet. Please try again later.'
          })
        }
      }
    }
  ]
})
