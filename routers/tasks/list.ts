import { Router } from '@/controllers/router.js'
import { tasksRepository } from '@/database/index.js'
import { paginate, paginateSchema } from '@/database/pagination.js'
import { MethodType } from '@/types/router.js'
import { z } from 'zod'

const querySchema = z.object({
  betId: z.string().optional().transform((value) => value ? parseInt(value) : undefined)
}).merge(paginateSchema)

export default new Router({
  name: 'ListTasks',
  description: 'Retrieves a paginated list of tasks, optionally filtered by bet ID.',
  method: [
    {
      type: MethodType.Get,
      authenticate: ['bearer'],
      async run(request, reply) {
        const validation = querySchema.safeParse(request.query)
        if (!validation.success) {
          return reply.code(400).send({
            message: 'Invalid query parameters.',
            zod: validation.error
          })
        }

        const { interval, page, pageSize, day, betId } = validation.data
        const taskList = await paginate({
          repository: tasksRepository, 
          interval,
          page,
          pageSize,
          day,
          bet: betId !== undefined ? { id: betId } : undefined,
        })

        return reply.code(200).send({
          message: 'Tasks retrieved successfully.',
          ...taskList
        })
      },
    }
  ]
})