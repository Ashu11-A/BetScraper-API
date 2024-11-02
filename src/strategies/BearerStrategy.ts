import { User } from '@/database/entity/User.js'
import { Strategy } from '@fastify/passport'
import { FastifyRequest } from 'fastify'
import jwt from 'jsonwebtoken'

export class BearerStrategy extends Strategy {
  constructor() {
    super('bearer')
  }

  async authenticate(request: FastifyRequest) {
    if (!request.passport) {
      console.error('passport.initialize() plugin não está em uso')
      return this.error(new Error('Erro interno no servidor'))
    }

    const secret = process.env.JWT_TOKEN
    if (!secret) {
      throw new Error('A chave JWT_TOKEN não está definida nas variáveis de ambiente')
    }

    const cookie = request.cookies['Bearer']
    if (!cookie) {
      console.log('Token de autenticação ausente')
      return this.fail(null, 403)
    }

    const { valid, value: token } = request.unsignCookie(cookie)
    if (token === null) {
      console.log('Token vazio!')
      return this.fail(null, 403)
    }

    if (!valid) {
      console.log('Token inválido!')
      return this.fail(null, 403)
    }

    try {
      const userData = jwt.verify(token, secret)
      if (typeof userData !== 'object' || !userData) {
        console.log('Formato de token inválido')
        return this.fail(null, 403)
      }

      const { id, uuid } = userData as { id: number, uuid: string }
      if (!id || !uuid) {
        console.log('Token com informações incompletas')
        return this.fail(null, 403)
      }

      const user = await User.findOneBy({ id, uuid })
      if (!user) {
        console.log('Usuário não encontrado')
        return this.fail(null, 404)
      }

      this.success(user)
    } catch (err) {
      if (err instanceof jwt.JsonWebTokenError) {
        console.log('Token JWT inválido ou expirado')
        return this.fail(null, 401)
      } else if (err instanceof jwt.TokenExpiredError) {
        console.log('Token JWT expirado')
        return this.fail(null, 401)
      } else if (err instanceof jwt.NotBeforeError) {
        console.log('Token JWT não é válido ainda')
        return this.fail(null, 401)
      } else {
        console.error('Erro durante a autenticação:', err)
        return this.error(new Error('Erro interno no servidor'))
      }
    }
  }
}
