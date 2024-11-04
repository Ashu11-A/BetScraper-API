import { Router } from '@/controllers/router.js'
import { User } from '@/database/entity/User.js'
import { MethodType } from '@/types/router.js'

export default new Router({
  name: 'UserProfile',
  description: 'Retrieve user profile information including name, email, username, and preferred language.',
  method: [
    {
      type: MethodType.Get,
      authenticate: ['bearer'],
      async run(request, reply) {
        const currentUserId = request.user!.id

        const userProfile = await User.findOne({
          where: { id: currentUserId },
          select: {
            name: true,
            email: true,
            username: true,
            language: true
          }
        })

        if (!userProfile) {
          return reply.code(404).send({
            message: 'User profile not found.'
          })
        }

        return reply.code(200).send({
          message: 'User profile retrieved successfully.',
          data: userProfile
        })
      }
    }
  ]
})
