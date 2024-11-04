import { Router } from '@/controllers/router.js'
import Bet from '@/database/entity/Bet.js'
import { MethodType } from '@/types/router.js'
import { z } from 'zod'

const schema = z.object({
  id: z.number().optional(),
  name: z.string().optional(),
  url: z.string().url().optional()
})

export default new Router({
  name: 'SearchBets',
  description: 'Performs a search for bets in the database based on provided criteria',
  method: [
    {
      type: MethodType.Post,
      authenticate: ['bearer'],
      async run(request, reply) {
        const validation = schema.safeParse(request.body)
        if (!validation.success) {
          return reply.code(400).send({
            message: 'Invalid request body. Please verify your input.',
            zod: validation.error
          })
        }

        try {
          const searchCriteria = validation.data
          const foundBets = await Bet.find({
            where: Object.entries(searchCriteria).map(([field, value]) => ({ [field]: value }))
          })

          return reply.code(200).send({
            message: 'Bets successfully retrieved.',
            data: foundBets
          })
        } catch (error) {
          console.error('Error searching for bets:', error)
          return reply.code(500).send({
            message: 'An error occurred while searching for bets. Please try again later.'
          })
        }
      }
    }
  ]
})