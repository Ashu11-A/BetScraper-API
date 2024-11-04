 
import { MethodType, RouterOptions } from '@/types/router.js'
import { glob } from 'glob'
import { basename, dirname, extname, join } from 'path'
import { Fastify, fastifyPassport } from './fastify.js'
import chalk from 'chalk'

export class Router {
  static all: Router[] = []

  constructor(public options: RouterOptions) {
    Router.all.push(this)
  }

  static async register () {
    const pathRouter = join(import.meta.dirname, '../../routers')
    const routers = await glob('**/*.ts', { cwd: pathRouter })

    for (const file of routers) {
      const filePath = join(pathRouter, file)
      const { default: router } = await import(filePath) as { default: Router }

      if (router === undefined) continue
      
      router.options = Object.assign(router.options, { path: router.options?.path ?? file })
    }

    for (const router of Router.all) {
      let path = router.options.path as string

      // <-- Formata o PATH
      const regexBrackets = /\(([^)]+)\)/g

      // Remove o nome do arquivo da rota
      if (['.ts', '.js'].includes(extname(path))) {
        path = join(dirname(path), basename(path, extname(path)))
      }
      
      // Caso a rota seja do tipo index, deixe ele com o nome da rota da pasta
      if (path.includes('index')) {
        path = path.replace(basename(path), '')
      }

      // Caso a rota tenha algum diretório entre () parênteses, eles serão removidos do path
      if (regexBrackets.test(path)) {
        path = path.replace(regexBrackets, '')
      }
      // Remove a barra final, se existir
      if (path.endsWith('/')) {
        path = path.slice(0, -1)
      }

      path = join('/', path)
      
      for (const method of router.options.method) {
        const auth = method.authenticate ? { preValidation: fastifyPassport.authenticate(method.authenticate) } : {}

        switch(method.type) {
        case MethodType.Get: {
          Fastify.server.get(path, auth, method.run)
          break
        }
        case MethodType.Post: {
          Fastify.server.post(path, auth, method.run)
          break
        }
        case MethodType.Put: {
          Fastify.server.put(path, auth, method.run)
          break
        }
        case MethodType.Delete: {
          Fastify.server.delete(path, auth, method.run)
          break
        }
        case MethodType.Websocket: {
          Fastify.server.get(path, { websocket: true, ...auth }, method.run)
        }
        }
      }

      console.log(chalk.green(`
📡 The route ${chalk.blueBright(path)} has been successfully registered!
    🏷️  Route Name: ${chalk.cyan(router.options.name)}
    📃 Description: ${chalk.yellow(router.options.description)}
    📋 Methods: ${chalk.magenta(router.options.method.map((method) => method.type).join(', '))}
      `))
      
    }
  }
}