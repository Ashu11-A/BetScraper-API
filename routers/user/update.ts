import { Router } from '@/controllers/router.js'
import { User } from '@/database/entity/User.js'
import { MethodType } from '@/types/router.js'
import { z } from 'zod'

const updateUserSchema = z.object({
  name: z.string().min(4).max(100).optional(),
  username: z.string().min(4).optional(),
  password: z.string().min(8).max(30).optional(),
  language: z.string().optional()
})

export default new Router({
  name: 'UpdateUserProfile',
  description: 'Update user profile information such as name, username, password, and preferred language.',
  method: [
    {
      type: MethodType.Put,
      authenticate: ['bearer'],
      async run(request, reply) {
        const currentUserId = request.user!.id
        const validation = updateUserSchema.safeParse(request.body)

        if (!validation.success) {
          return reply.code(400).send({ 
            message: 'Validation error', 
            zod: validation.error 
          })
        }

        const updateResult = await User.update({ id: currentUserId }, validation.data)

        if (updateResult.affected === 0) {
          return reply.code(404).send({ 
            message: 'User not found or no changes made.' 
          })
        }

        return reply.code(200).send({ 
          message: 'User profile updated successfully.', 
          data: updateResult
        })
      },
    }
  ]
})
