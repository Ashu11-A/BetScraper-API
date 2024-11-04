import { Router } from '@/controllers/router.js'
import { betRepository } from '@/database/index.js'
import { paginate, paginateSchema } from '@/database/pagination.js'
import { MethodType } from '@/types/router.js'

export default new Router({
  name: 'ListBets',
  description: 'Retrieves a paginated list of bets with optional filtering and date range',
  path: '/bets',
  method: [
    {
      type: MethodType.Get,
      authenticate: ['bearer'],
      async run(request, reply) {
        const validation = paginateSchema.safeParse(request.query)
        if (!validation.success) {
          return reply.code(400).send({ 
            message: 'Invalid query parameters. Please check your input.',
            zod: validation.error 
          })
        }

        const { page, pageSize, interval, day } = validation.data

        try {
          const paginatedBets = await paginate({
            repository: betRepository,
            page,
            pageSize,
            interval,
            day
          })

          return reply.code(200).send({
            message: 'Bets retrieved successfully.',
            data: paginatedBets
          })
        } catch (error) {
          console.error('Error retrieving bets:', error)
          return reply.code(500).send({
            message: 'An error occurred while fetching bets. Please try again later.'
          })
        }
      },
    },
  ],
})
