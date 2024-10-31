import { BearerStrategy } from '@/strategies/BearerStrategy.js'
import cookie from '@fastify/cookie'
import multipart from '@fastify/multipart'
import { Authenticator } from '@fastify/passport'
import SecureSession from '@fastify/secure-session'
import websocket from '@fastify/websocket'
import { execSync } from 'child_process'
import fastify, { FastifyInstance } from 'fastify'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

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

    if (!existsSync(join(process.cwd(), 'secret-key'))) {
      console.log('🔑 secret-key not found, generating with the command “npx @fastify/secure-session > secret-key”')
      execSync('npx @fastify/secure-session > secret-key', { stdio: 'inherit' })
    }

    server
      .register(cookie, {
        secret: process.env['COOKIE_TOKEN']
      })
      .register(multipart, {
      // attachFieldsToBody: true,
        limits: {
          fileSize: 1024 * 1024 * 10
        }
      })
      .register(websocket)
      .register(SecureSession, { key: readFileSync(join(process.cwd(), 'secret-key')) })
      .register(fastifyPassport.initialize())
      .register(fastifyPassport.secureSession())
  
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
