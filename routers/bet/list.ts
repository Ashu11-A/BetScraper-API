import { Router } from '@/controllers/router.js'
import Bet from '@/database/entity/Bet.js'
import { MethodType } from '@/types/router.js'

export default new Router({
  name: 'List',
  description: 'List all Bets',
  path: '/bets',
  method: [
    {
      type: MethodType.Get,
      authenticate: ['bearer'],
      async run(__request, reply) {
        const bets = await Bet.find()

        return reply.send(JSON.stringify(bets))
      },
    }
  ]
})