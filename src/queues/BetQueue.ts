import { Queue } from '@/controllers/queue.js'
import Bet from '@/database/entity/Bet.js'
import Compliance from '@/database/entity/Compliance.js'
import { Cron } from '@/database/entity/Cron.js'
import { Task } from '@/database/entity/Task.js'
import { User } from '@/database/entity/User.js'
import { storagePath } from '@/index.js'
import { Properties } from '@/scraper/properties.js'
import { Scraper } from '@/scraper/search.js'
import { DoneCallback, Job, JobOptions } from 'bull'
import chalk from 'chalk'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import { nanoid } from 'nanoid'
import { Property } from '@/database/entity/Property.js'

export type AddBetQueue = {
  bet: Bet,
  user?: User,
  cron?: Cron
}
export type BetQueueType = {
  id: string
  bet: Bet
  user?: User
}

export type BetResult = {
  task: Task
  // compliances: number[]
  properties: Properties[]
}

export class BetQueue {
  static queue = new Queue<BetQueueType>('bets')
  static initialized = false

  constructor() {
    BetQueue.initialize()
  }

  async addToQueue({ bet, user, cron }: AddBetQueue) {
    const id = nanoid()
    const options = {
      jobId: cron !== undefined ? `${bet.id}-${id}` : undefined,
      repeat: cron !== undefined ? { cron: cron.expression } : undefined,
      removeOnComplete: cron === undefined ? true : false,
      removeOnFail: cron === undefined ? true : false
    } satisfies JobOptions

    return await BetQueue.queue.add({ bet, user, id }, options)
  }

  static initialize() {
    if (BetQueue.initialized) return
    console.log('Initialize')
    BetQueue.initialized = true
    BetQueue.queue.process(this.process)
    BetQueue.queue.on('completed', this.onCompleted)
    BetQueue.queue.on('waiting', (jobId) => console.log(chalk.red(`Task: ${jobId} está esperando`)))
    BetQueue.queue.on('removed', (job) => console.log(chalk.red(`Task: ${job.data.bet.name} foi removido`)))
    BetQueue.queue.on('paused', this.onPaused)
    BetQueue.queue.on('failed', this.onFailed)
  }

  static async process(job: Job<BetQueueType>, done: DoneCallback) {
    if (job.data.id === undefined || Number.isNaN(job.data.id)) return
    console.log(`Job ID ${job.id} ativado.`)
    let scraper: Scraper | null = null
    const task = await Task.create({
      bet: job.data.bet,
      user: job.data.user,
      uuid: job.data.id,
      scheduledAt: new Date(),
      status: 'running'
    }).save()
  
    try {
      const saveDir = join(storagePath, `/tasks/${task.id}/bets/${task.bet.id}/${task.createdAt}`)
      await mkdir(saveDir, { recursive: true })

      const compliances = await Compliance.find()
      if (compliances.length === 0) throw new Error('No compliances recorded in the database')

      scraper = new Scraper(task.bet.url, compliances)

      await scraper.loadPage()
      await scraper.savePageContent(saveDir)
      const initImage = await scraper.getScreenshot()
      if (initImage) await writeFile(join(saveDir, '/initial.png'), initImage)
      await scraper.scan()
      await scraper.getImagesOCR()
      const { elements, errors } = await scraper.getProprietiesOCR()

      // // await scraper.closePopUp()
      // const { elements, properties } = await scraper.getProprieties()
      // const screenshots = await scraper.filterScreenshots(await scraper.getScreenshots(elements))
  
      // for (const [index, evidence] of screenshots) {
      //   await writeFile(join(saveDir, `/${index}.png`), evidence.image)
      // }

      // const metadata: (Properties & { pathName: string })[] = []
      // for (const [index] of (screenshots.entries())) {
      //   const prop = properties[index]

      //   metadata.push({
      //     ...prop,
      //     pathName: `${index}.png`
      //   })
      // }
      // await writeFile(join(saveDir, '/metadata.json'), JSON.stringify(metadata, null, 2))
        
      // await scraper.destroy()
      // // Isso vai para BetQueue.queue.on('completed'), aqui é passado um array de IDs, onde serão processados na conclusão
      // done(null, {
      //   task,
      //   properties
      // })
      done()
    } catch (error) {
      await scraper?.browser.close()
      console.error(`Erro no Job ID ${job.id}:`, error)
      done(error as Error)
    }
  }

  static async onCompleted(job: Job<BetQueueType>, result: BetResult) {
    console.log(`Job ID ${job.id} completado.`)
    const task = await Task.findOneByOrFail({ id: result.task.id })
    const properties = await Promise.all(result.properties.map(async (property) => await Property.create({ ...property, task }).save()))

    task.status = 'completed'
    task.properties = properties
    task.finishedAt = new Date()
    task.duration = (new Date().getTime() - new Date(task.scheduledAt!).getTime()) / 1000
    task.save()
  }

  static async onPaused(job: Job<BetQueueType>) {
    console.error(`Job ID ${job.id} pausado.`)
    const task = await Task.findOne({
      where: { uuid: job.data.id },
      relations: ['bet'],
      order: { id: 'DESC' }
    })
  
    if (!task) {
      console.error('Task não encontrada no onPaused.')
      return
    }

    task.status = 'paused'
    task.duration = (new Date().getTime() - new Date(task.scheduledAt!).getTime()) / 1000
    await task.save()
  }

  static async onFailed(job: Job<BetQueueType>, error: Error) {
    console.error(`Job ID ${job.id} falhou.`)
    const task = await Task.findOne({
      where: { uuid: job.data.id },
      relations: ['bet'],
      order: { id: 'DESC' }
    })
  
    if (!task) {
      console.error('Task não encontrada no onFailed.')
      return
    }

    task.errorMessage = error.message
    task.status = 'failed'
    task.duration = (new Date().getTime() - new Date(task.scheduledAt!).getTime()) / 1000
    await task.save()
  }

  static async checkAllCrons() {
    const queue = BetQueue.queue
    const newQueue =  new BetQueue()
    const jobs = await queue.getRepeatableJobs()
    const process: Array<Promise<void>> = []
  
    for (const job of jobs) {
      console.log(job)
      if (job.id === undefined) continue
      const ids = BetQueue.getIds(job.id)
      if (ids === undefined) continue
      const { betId } = ids

      process.push((async () => {
        const bet = await Bet.findOneBy({ id: betId })
        if (bet === null) return
  
        const cron = await Cron.findOneBy({ bets: { id: bet.id } })
        if (cron === null) return
  
        if (job.cron !== cron.expression) {
          console.log(chalk.red(`[${bet.name}] Teve o cron alterado`))
          // await queue.job
          await queue.removeRepeatableByKey(job.key)
          await newQueue.addToQueue({ bet, cron })
        }
      })())
    }
  
    await Promise.all(process)
  }

  static async removeAllRepeatable () {
    const queue = BetQueue.queue
    const jobs = await queue.getRepeatableJobs()
  
    for (const job of jobs) {
      await queue.removeRepeatable({ cron: job.cron, jobId: job.id })
    }
  }

  static getIds (jobId: string): { betId: number, uuidTask: string } | undefined {
    const [betIdStr, uuidTask] = String(jobId).split('-')
    const betId = Number(betIdStr)
    if (Number.isNaN(betId)) {
      console.log('BetId não é um numero!')
      return undefined
    }
    if (typeof uuidTask !== 'string' && uuidTask === '') {
      console.log('uuidTask não é uma string')
      return undefined
    }

    return { betId, uuidTask }
  }
}