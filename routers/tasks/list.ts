import { Router } from '@/controllers/router.js'
import { tasksRepository } from '@/database/index.js'
import { paginate, paginateSchema } from '@/database/pagination.js'
import { MethodType } from '@/types/router.js'
import { z } from 'zod'

const schema = z.object({
  betId: z.string().optional().transform((value) => value ? parseInt(value) : undefined)
}).merge(paginateSchema)

export default new Router({
  name: 'list',
  description: 'List all tasks',
  method: [
    {
      type: MethodType.Get,
      authenticate: ['bearer'],
      async run(request, reply) {
        const parsed = schema.safeParse(request.query)
        if (!parsed.success) return reply.status(422).send(JSON.stringify(parsed.error))
        const { interval, page, pageSize, day, betId } = parsed.data

        const tasks = await paginate({
          repository: tasksRepository, 
          interval,
          page,
          pageSize,
          day,
          bet: betId !== undefined ? { id: betId } : undefined,
        })

        return reply.send(JSON.stringify(tasks))
      },
    }
  ]
})