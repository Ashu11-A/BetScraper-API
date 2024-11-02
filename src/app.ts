import 'dotenv/config'
import 'reflect-metadata'

import { execSync } from 'child_process'
import { Fastify } from './controllers/fastify.js'
import { Router } from './controllers/router.js'
import Database from './database/dataSource.js'

execSync('bun run migration:run || true', { stdio: 'inherit' })

const fastify = new Fastify({ port: 3000, host: '0.0.0.0' })
await Database.initialize()

fastify.init()
await Router.register()
fastify.listen()

// await Database.dropDatabase()