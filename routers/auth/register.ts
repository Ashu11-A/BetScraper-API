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
  name: 'UserRegistration',
  description: 'Handles new user registration, including validation and secure password storage',
  method: [
    {
      type: MethodType.Post,
      async run(request, reply) {
        const parsed = schema.safeParse(request.body)
        if (!parsed.success) {
          return reply.code(400).send({ 
            message: 'Validation error. Please check the input data.', 
            zod: parsed.error 
          })
        }

        const existUser = await User.findOne({
          where: [
            { username: parsed.data.username },
            { email: parsed.data.email }
          ]
        })
        if (existUser) {
          return reply.code(422).send({
            message: 'A user with the provided email or username already exists. Please use different credentials.'
          })
        }

        const password = await hash(parsed.data.password, saltRounds)
        const user = await User.create({
          ...parsed.data,
          password
        }).save()

        return reply.code(201).send({
          message: 'User registered successfully!',
          data: {
            id: user.id,
            name: user.name,
            username: user.username,
            email: user.email,
            language: user.language,
          }
        })
      }
    }
  ]
})