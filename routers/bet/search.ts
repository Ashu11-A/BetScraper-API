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
  name: 'Search Bets',
  description: 'Consult in Database',
  method: [
    {
      type: MethodType.Post,
      authenticate: ['bearer'],
      async run(request, reply) {
        const parsed = schema.safeParse(request.body)

        if (!parsed.success) {
          return reply.status(404).send(JSON.stringify(parsed.error))
        }
        
        const bets = await Bet.find({
          where: [
            // Isso irá pegar todos as bets que tenham os elementos passados pelo body
            ...Object.entries(parsed.data).map(([name, value]) => ({ [name]: value }))
          ]
        })

        return reply.send(JSON.stringify(bets))
      },
    }
  ]
})