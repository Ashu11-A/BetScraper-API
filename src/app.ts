import 'dotenv/config'
import 'reflect-metadata'

import { execSync } from 'child_process'
import { registerBets } from 'scripts/registerBets.js'
import { registerCompliances } from 'scripts/registerCompliances.js'
import { registerCrons } from 'scripts/registerCrons.js'
import { registerScheduled } from 'scripts/registerScheduled.js'
import { Fastify } from './controllers/fastify.js'
import { Router } from './controllers/router.js'
import Database from './database/dataSource.js'
import { BetQueue } from './queues/BetQueue.js'

execSync('bun run migration:run || true', { stdio: 'inherit' })

const fastify = new Fastify({ port: 3000, host: '0.0.0.0' })
await Database.initialize()
await registerCrons()
await registerCompliances()
await registerBets()
await registerScheduled()

BetQueue.initialize()
// await BetQueue.removeAllRepeatable()

fastify.init()
await Router.register()
fastify.listen()

await BetQueue.checkAllCrons()

// console.log((await BetQueue.queue.getJobs([])))

// await Database.dropDatabase()