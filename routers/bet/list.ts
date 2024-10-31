import { Router } from '@/controllers/router.js'
import dataSource from '@/database/dataSource.js'
import Bet from '@/database/entity/Bet.js'
import { paginate, paginateSchema } from '@/database/pagination.js'
import { MethodType } from '@/types/router.js'

const betRepository = dataSource.getRepository(Bet)

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
        if (!parsed.success) return reply.status(422).send(JSON.stringify(parsed.error))
          
        const { page, pageSize, interval, day } = parsed.data

        try {
          const bets = await paginate({
            repository: betRepository,
            page,
            pageSize,
            interval,
            day
          })

          return reply.send(JSON.stringify(bets))
        } catch (error) {
          console.error('Error fetching bets:', error)
          return reply.status(500).send({
            error: 'Internal Server Error',
            message: 'Failed to fetch bets',
          })
        }
      },
    },
  ],
})
