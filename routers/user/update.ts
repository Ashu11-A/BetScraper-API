import { Router } from '@/controllers/router.js'
import { User } from '@/database/entity/User.js'
import { MethodType } from '@/types/router.js'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(4).max(100).optional(),
  username: z.string().min(4).optional(),
  password: z.string().min(8).max(30).optional(),
  language: z.string().optional()
})

export default new Router({
  name: 'Update User',
  description: 'Maneger user',
  method: [
    {
      type: MethodType.Put,
      authenticate: ['bearer'],
      async run(request, reply) {
        const userId = request.user!.id
        const parsed = schema.safeParse(request.body)
        if (!parsed.success) return reply.code(400).send({ message: parsed.error.message, zod: parsed.error })

        await User.update({ id: userId }, { ...parsed.data })
      
        return reply.code(200).send({ message: 'User successfully updated' })
      },
    }
  ]
})