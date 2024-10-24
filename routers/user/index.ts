import { Router } from '@/controllers/router.js'
import { User } from '@/database/entity/User.js'
import { MethodType } from '@/types/router.js'

export default new Router({
  name: 'Users',
  description: 'Users Manager',
  path: '/users',
  method: [
    {
      type: MethodType.Get,
      authenticate: ['bearer'],
      async run(__request, reply) {
        return reply.send(JSON.stringify(await User.find()))
      },
    }
  ]
})