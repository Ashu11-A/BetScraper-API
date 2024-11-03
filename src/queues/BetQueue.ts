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

type AddBetQueue = {
  bet: Bet,
  user?: User,
  cron?: Cron
}
type BetQueueType = {
  task: Task
}

export class BetQueue {
  static queue = new Queue<BetQueueType>('bets')

  static async addToQueue({ bet, user, cron }: AddBetQueue) {
    const task = await Task.create({
      bet,
      user,
      cron,
      status: 'scheduled',
    }).save()

    return BetQueue.queue.add({ task })
  }

  static initialize () {
    this.queue.process(this.process)
    this.queue.on('completed', this.onCompleted)
    this.queue.on('active', this.onActive)
    this.queue.on('paused', this.onPaused)
    this.queue.on('failed', this.onFailed)
  }

  static async process (job: Job<BetQueueType>, done: DoneCallback) {
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
      
      await scraper.closePopUp()
      const screenshots = await scraper.getScreenshots()
      const filteredScreenshots = await scraper.filterScreenshots(screenshots)
  
      await writeFile(join(saveDir, '/initial.png'), initImage)
      for (const [number, evidence] of Object.entries(filteredScreenshots)) {
        await writeFile(join(saveDir, `/${number}.png`), evidence.print)
      }
      
      await scraper.browser.close()
  
      const jsonData = filteredScreenshots.map((evidence, index) => ({
        ...evidence,
        print: undefined,
        grayScalePrint: undefined,
        pathName: `${index}.png`
      }))
      await writeFile(join(saveDir, '/metadata.json'), JSON.stringify(jsonData, null, 2))
  
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
}

BetQueue.initialize()