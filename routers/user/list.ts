import { Router } from '@/controllers/router.js'
import dataSource from '@/database/dataSource.js'
import { User } from '@/database/entity/User.js'
import { paginate, paginateSchema } from '@/database/pagination.js'
import { MethodType } from '@/types/router.js'

const userRepository = dataSource.getRepository(User)

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
        if (!parsed.success) return reply.status(422).send(JSON.stringify(parsed.error))
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
        return reply.send(JSON.stringify(data))
      },
    }
  ]
})