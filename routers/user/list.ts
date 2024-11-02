import { Router } from '@/controllers/router.js'
import { userRepository } from '@/database/index.js'
import { paginate, paginateSchema } from '@/database/pagination.js'
import { MethodType } from '@/types/router.js'

export default new Router({
  name: 'Users',
  description: 'Users Manager',
  path: '/users',
  method: [
    {
      type: MethodType.Get,
      authenticate: ['bearer'],
      async run(request, reply) {
        const parsed = paginateSchema.safeParse(request.query)
        if (!parsed.success) return reply.code(400).send({ message: parsed.error.message, zod: parsed.error })

        const { interval, page, pageSize, day } = parsed.data
        const paginated = (await paginate({
          repository: userRepository,
          interval,
          page,
          pageSize,
          day
        }))

        const data = {
          ...paginated,
          data: paginated.data.map((user) => ({ ...user, password: undefined }))
        }
        return reply.code(200).send({
          message: 'Request realizado com sucesso',
          data
        })
      },
    }
  ]
})