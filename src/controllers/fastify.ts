import { fastifyCookie } from '@fastify/cookie'
import { fastifyMultipart } from '@fastify/multipart'
import { Authenticator } from '@fastify/passport'
import { fastifyStatic } from '@fastify/static'
import { fastifyWebsocket } from '@fastify/websocket'
import fastify, { FastifyInstance } from 'fastify'
// import fastifySecureSession from '@fastify/secure-session'
import { fastifySession } from '@fastify/session'

import { BearerStrategy } from '@/strategies/BearerStrategy.js'

import { User } from '@/database/entity/User.js'
import { storagePath } from '@/index.js'

export const fastifyPassport = new Authenticator()

interface Options {
  host: string
  port: number
}

export class Fastify {
  static server: FastifyInstance
  constructor(public options: Options){}

  init () {
    const server = fastify({ logger: true })
    const cookieToken = process.env['COOKIE_TOKEN']
    const sessionToken = process.env['SESSION_TOKEN']

    if (cookieToken === undefined || sessionToken === undefined) throw new Error('Session token or cookie token are undefined')

    server
      .register(fastifyMultipart, {
      // attachFieldsToBody: true,
        limits: {
          fileSize: 1024 * 1024 * 10
        }
      })
      .register(fastifyStatic, {
        root: storagePath,
      })
      .register(fastifyWebsocket)
      .register(fastifyCookie, {
        secret: cookieToken
      })
      .register(fastifySession, {
        secret: sessionToken,
        logLevel: 'debug',
        cookie: {
          path: '/',
          maxAge: 60 * 60 * 24 * 7 
        }
      })
      .register(fastifyPassport.initialize())
    
    fastifyPassport.registerUserSerializer<User, string>(async (user) => {
      console.log('registerUserSerializer', user)
      return user.uuid
    })
    fastifyPassport.registerUserDeserializer<string, User | null>(async (uuid) => {
      console.log('registerUserDeserializer', uuid)
      return await User.findOneBy({ uuid })
    })
    fastifyPassport.use('bearer', new BearerStrategy())

    Fastify.server = server
    return this
  }

  listen () {
    Fastify.server.listen({
      port: this.options.port,
      host: this.options.host
    }, (err, address) => {
      if (err !== null) {
        console.log(`Port unavailable: ${this.options.port}`)
        console.log(err)
        this.options.port = this.options.port + 1
        return this.listen()
      }
          
      console.log(`Server listening at ${address}`)
    })
  }
}