import { Queue } from '@/controllers/queue.js'
import Bet from '@/database/entity/Bet.js'
import { Cron } from '@/database/entity/Cron.js'
import Compliance from '@/database/entity/Compliance.js'
import { Task } from '@/database/entity/Task.js'
import { User } from '@/database/entity/User.js'
import { storagePath } from '@/index.js'
import { Scraper } from '@/lib/scraper.js'
import { DoneCallback, Job } from 'bull'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'

export type AddBetQueue = {
  bet: Bet,
  user?: User,
  cron?: Cron
}
export type BetQueueType = {
  task: Task
}

export class BetQueue {
  static queue = new Queue<BetQueueType>('bets')

  constructor() {
    BetQueue.initialize()
  }

  async addToQueue({ bet, user, cron }: AddBetQueue) {
    const task = await Task.create({
      bet,
      user,
      status: 'scheduled',
    }).save()
    
    BetQueue.queue.add({ task })
    const queue = BetQueue.queue.add({ task }, {
      jobId: cron !== undefined ? task.bet.id : undefined,
      repeat: cron !== undefined ? { cron: cron.expression,  } : undefined,
      removeOnComplete: cron === undefined ? true : false,
      removeOnFail: cron === undefined ? true : false
    })
    return queue
  }

  static initialize() {
    console.log('Initialize')
    BetQueue.queue.process(this.process)
    BetQueue.queue.on('completed', this.onCompleted)
    BetQueue.queue.on('active', this.onActive)
    BetQueue.queue.on('paused', this.onPaused)
    BetQueue.queue.on('failed', this.onFailed)
  }

  static async process(job: Job<BetQueueType>, done: DoneCallback) {
    const saveDir = join(storagePath, `/tasks/${job.data.task.id}/bets/${job.data.task.bet.id}/${job.data.task.createdAt}`)
    await mkdir(saveDir, { recursive: true })
    try {
      console.log(`Starting Job ID: ${job.id}`)
      const compliance = await Compliance.find()
      const keywords = compliance.map((compliance) => compliance.value)
      if (keywords.length === 0) throw new Error('No compliances recorded in the database')

      const scraper = new Scraper(job.data.task.bet.url, keywords)
      await scraper.loadPage()
      await scraper.savePageContent(saveDir)
      const initImage = await scraper.getScreenshotHomePage()
      await scraper.scan()
      const compliancesFound = await scraper.filter()

      if (compliancesFound.length > 0) {
        await scraper.closePopUp()
        const screenshots = await scraper.getScreenshots()
        const filteredScreenshots = await scraper.filterScreenshots(screenshots)
  
        await writeFile(join(saveDir, '/initial.png'), initImage)
        for (const [number, evidence] of Object.entries(filteredScreenshots)) {
          await writeFile(join(saveDir, `/${number}.png`), evidence.print)
        }

        const jsonData = filteredScreenshots.map((evidence, index) => ({
          ...evidence,
          print: undefined,
          grayScalePrint: undefined,
          pathName: `${index}.png`
        }))
        await writeFile(join(saveDir, '/metadata.json'), JSON.stringify(jsonData, null, 2))
      }

      await scraper.browser.close()

      // Isso vai para BetQueue.queue.on('completed'), aqui é passado um array de IDs, onde serão processados na conclusão
      done(null, {
        compliances: compliance.filter((compliance) => compliancesFound.includes(compliance.value))
          .map((compliance) => compliance.id)
      })
    } catch (error) {
      console.error(`Erro no Job ID ${job.id}:`, error)
      done(error as Error)
    }
  }

  static async onCompleted(job: Job<BetQueueType>, result: { compliances: number[] }) {
    console.error(`Job ID ${job.id} completado.`)
    const task = await Task.findOneByOrFail({ id: job.data.task.id })
    const compliances = (
      await Promise.all(result.compliances.map((id) => Compliance.findOneBy({ id })))
    ).filter((compliance) => compliance !== null)

    task.status = 'completed'
    task.compliances = compliances
    task.finishedAt = new Date()
    task.duration = (new Date().getTime() - task.scheduledAt!.getTime()) / 1000

    await task.save()
  }

  static async onActive(job: Job<BetQueueType>) {
    console.error(`Job ID ${job.id} ativado.`)
    await Task.update({ id: job.data.task.id }, {
      status: 'running',
      scheduledAt: new Date()
    })
  }

  static async onPaused(job: Job<BetQueueType>) {
    console.error(`Job ID ${job.id} pausado.`)

    await Task.update({ id: job.data.task.id }, {
      status: 'paused'
    })
  }

  static async onFailed(job: Job<BetQueueType>, error: Error) {
    console.error(`Job ID ${job.id} falhou:`, error.message)

    await Task.update({ id: job.data.task.id }, {
      status: 'failed',
      errorMessage: error.message
    })
  }

  static async checkAllCrons() {
    const queue = BetQueue.queue
    const newQueue =  new BetQueue()
    const jobs = await queue.getRepeatableJobs()
    const process: Array<Promise<void>> = []
  
    for (const job of jobs) {
      if (job.id === undefined) continue

      process.push(
        (async () => {
          const bet = await Bet.findOneBy({ id: Number(job.id) })
          if (bet === null) return
  
          const cron = await Cron.findOneBy({ bets: { id: bet.id } })
          if (cron === null) return
  
          if (job.cron !== cron.expression) {
            console.log(chalk.red(`[${bet.name}] Teve o cron alterado`))
            // await queue.job
            await queue.removeRepeatableByKey(job.key)
            await newQueue.addToQueue({ bet, cron })
          }
        })()
      )
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
}