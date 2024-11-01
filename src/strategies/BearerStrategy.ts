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
      return this.error(new Error('passport.initialize() plugin não está em uso'))
    }

    const token = request.cookies['Bearer']
    if (!token) {
      return this.fail('Token de autenticação ausente', 403)
    }

    try {
      const secret = process.env.JWT_TOKEN
      if (!secret) {
        throw new Error('A chave JWT_TOKEN não está definida nas variáveis de ambiente')
      }

      const userData = jwt.verify(token, secret)
      if (typeof userData !== 'object' || !userData) {
        return this.fail('Formato de token inválido', 403)
      }

      const { id, uuid } = userData as { id: number, uuid: string }
      if (!id || !uuid) {
        return this.fail('Token com informações incompletas', 403)
      }

      const user = await User.findOneBy({ id, uuid })
      if (!user) return this.fail('Usuário não encontrado', 404)

      this.success(user)
    } catch (err) {
      switch(true) {
      case err instanceof jwt.JsonWebTokenError: {
        return this.fail('Token JWT inválido ou expirado', 401)
      }
      case (err instanceof jwt.TokenExpiredError): {
        return this.fail('Token JWT expirado', 401)
      }
      case (err instanceof jwt.NotBeforeError): {
        return this.fail('Token JWT não é válido ainda', 401)
      }
      default:
        console.error('Erro durante a autenticação:', err)
        return this.error(new Error('Erro interno no servidor'))
      }
    }
  }
}
