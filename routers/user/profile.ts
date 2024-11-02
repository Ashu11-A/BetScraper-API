import { Router } from '@/controllers/router.js'
import { User } from '@/database/entity/User.js'
import { MethodType } from '@/types/router.js'

export default new Router({
  name: 'Profile',
  description: 'Show profile infos',
  method: [
    {
      type: MethodType.Get,
      authenticate: ['bearer'],
      async run(request, reply) {
        const userId = request.user!.id

        const user = await User.findOne({ where: { id: userId }, select: {
          name: true,
          email: true,
          username: true,
          language: true
        } })

        return reply.code(200).send({
          message: 'Request realizado com sucesso!',
          data: user
        })
      }
    }
  ]
})
