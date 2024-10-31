import { Router } from '@/controllers/router.js'
import { User } from '@/database/entity/User.js'
import { MethodType } from '@/types/router.js'
import { hash } from 'bcrypt'
import z from 'zod'

const saltRounds = 10

const schema = z.object({
  name: z.string().min(4).max(100),
  username: z.string().min(4),
  email: z.string().email(),
  language: z.string(),
  password: z.string().min(8).max(30)
})

export type RegisterType = z.infer<typeof schema>

export default new Router({
  name: 'Register',
  description: 'Registra novos usuários no banco de dados',
  method: [
    {
      type: MethodType.Post,
      async run(request, reply) {
        const parsed = schema.safeParse(request.body)
        if (!parsed.success) return reply.send(JSON.stringify(parsed.error))

        const existUser = await User.findOne({
          where: [
            { username: parsed.data.username },
            { email: parsed.data.email }
          ]
        })
        if (existUser) {
          return reply.send(new Error('Email or username already in use'))
        }

        const password = await hash(parsed.data.password, saltRounds)
        const user = await User.create({
          ...parsed.data,
          password
        }).save()

        return reply.send(JSON.stringify(user))
      }
    }
  ]
})