import { Router } from '@/controllers/router.js'
import { betRepository } from '@/database/index.js'
import { paginate, paginateSchema } from '@/database/pagination.js'
import { MethodType } from '@/types/router.js'


export default new Router({
  name: 'List',
  description: 'List all Bets',
  path: '/bets',
  method: [
    {
      type: MethodType.Get,
      authenticate: ['bearer'],
      async run(request, reply) {
        const parsed = paginateSchema.safeParse(request.query)
        if (!parsed.success) return reply.code(400).send({ message: parsed.error.message, zod: parsed.error })
        const { page, pageSize, interval, day } = parsed.data

        try {
          const bets = await paginate({
            repository: betRepository,
            page,
            pageSize,
            interval,
            day
          })

          return reply.code(200).send(bets)
        } catch (error) {
          console.error('Error fetching bets:', error)
          return reply.code(500).send({
            message: 'Failed to fetch bets',
          })
        }
      },
    },
  ],
})
