import { Router } from '@/controllers/router.js'
import { User } from '@/database/entity/User.js'
import { MethodType } from '@/types/router.js'
import { compare } from 'bcrypt'
import jwt from 'jsonwebtoken'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
})

export type LoginType = z.infer<typeof schema>

export default new Router({
  name: 'UserLogin',
  description: 'Handles user authentication by validating credentials and issuing JWT tokens for secure access',
  method: [
    {
      type: MethodType.Post,
      async run(request, reply) {
        console.log(request.body)
        const parsed = schema.safeParse(request.body)
        if (!parsed.success) return reply.code(400).send({ message: parsed.error.message, zod: parsed.error })

        const user = await User.findOne({ where: { email: parsed.data.email } })
        if (!user) return reply.code(403).send({ message: 'Invalid email or password' })

        if (!(await compare(parsed.data.password, user.password))) {
          return reply.code(403).send({ message: 'Invalid email or password' })
        }

        const token = jwt.sign(
          { ...user, password: undefined },
          process.env.JWT_TOKEN as string,
          {
            expiresIn: process.env.JWT_EXPIRE,
          }
        )

        console.log(token)

        reply.setCookie('Bearer', token, {
          path: '/',
          httpOnly: true,
          domain: process.env['PRODUCTION'] === 'true' ? process.env['FRONT_END_URL'] : undefined,
        })

        return reply.code(200).send({ message: 'Login successful', data: token })
      },
    }
  ]
})
