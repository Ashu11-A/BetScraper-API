import { Router } from '@/controllers/router.js'
import { userRepository } from '@/database/index.js'
import { paginate, paginateSchema } from '@/database/pagination.js'
import { MethodType } from '@/types/router.js'

export default new Router({
  name: 'UserManagement',
  description: 'API for managing users, including listing and pagination.',
  path: '/users',
  method: [
    {
      type: MethodType.Get,
      authenticate: ['bearer'],
      async run(request, reply) {
        const validation = paginateSchema.safeParse(request.query)
        if (!validation.success) {
          return reply.code(400).send({
            message: 'Invalid pagination parameters.',
            zod: validation.error
          })
        }

        const { interval, page, pageSize, day } = validation.data
        const paginatedResult = await paginate({
          repository: userRepository,
          interval,
          page,
          pageSize,
          day
        })

        const usersData = paginatedResult.data.map((user) => ({ ...user, password: undefined }))

        return reply.code(200).send({
          message: 'Users retrieved successfully.',
          data: {
            ...paginatedResult,
            data: usersData
          }
        })
      },
    }
  ]
})
