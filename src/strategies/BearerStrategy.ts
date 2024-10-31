import { Strategy } from '@fastify/passport'
import { FastifyRequest } from 'fastify'
import jwt from 'jsonwebtoken'

export class BearerStrategy extends Strategy {
  constructor() {
    super('bearer')
  }

  async authenticate(request: FastifyRequest, /*options*/) {
    if (!request.passport) {
      return this.error(new Error('passport.initialize() plugin not in use'))
    }
    const cookie = request.cookies['Bearer']
    if (!cookie) return this.fail('Session coockie undefined', 403)
    
    try {
      const userData = jwt.verify(cookie, process.env.JWT_TOKEN as string)

      console.log(userData)
      this.success(userData)
      this.pass()
    } catch (err) {
      console.log(err)
      return this.fail(JSON.stringify(err))
    }

  }
}