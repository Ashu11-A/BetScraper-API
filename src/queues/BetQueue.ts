import { Queue } from '@/controllers/queue.js'
import Bet from '@/database/entity/Bet.js'
import { Cron } from '@/database/entity/Cron.js'
import { Task } from '@/database/entity/Task.js'
import { User } from '@/database/entity/User.js'
import { storagePath } from '@/index.js'
import { Scraper } from '@/lib/scraper.js'
import { advisementRulesKeywords, bonusKeywords, legalAgeAdvisementKeywords } from '@/shared/consts/keywords/index.js'
import { Job } from 'bull'
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

  static inQueue: number = 0
  static processed: number = 0

  static async addToQueue({ bet, user, cron }: AddBetQueue) {
    const task = await Task.create({
      bet,
      user,
      cron,
      status: 'scheduled',
    }).save()
    BetQueue.inQueue = BetQueue.inQueue + 1
    return BetQueue.queue.add({ task })
  }
}
BetQueue.queue.process(async (job: Job<BetQueueType>, done) => {
  const saveDir = join(storagePath, `/tasks/${job.data.task.id}/bets/${job.data.task.bet.id}/${job.data.task.createdAt}`)
  await mkdir(saveDir, { recursive: true })
  try {
    console.log(`Starting Job ID: ${job.id}`)

    const scraper = new Scraper(job.data.task.bet.url, [...bonusKeywords, ...legalAgeAdvisementKeywords, ...advisementRulesKeywords])
    await scraper.loadPage()
    await scraper.savePageContent(saveDir)
    const initImage = await scraper.getScreenshotHomePage()
    await scraper.closePopUp()
    await scraper.scan()
    await scraper.filter()
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
      path: join(process.cwd(), `/${index}.png`),
      pathName: `${index}.png`
    }))
    await writeFile(join(saveDir, '/metadata.json'), JSON.stringify(jsonData, null, 2))

    done(null)
  } catch (error) {
    console.error(`Erro no Job ID ${job.id}:`, error)
    done(error as Error)
  }
})

BetQueue.queue.on('completed', async (job: Job<BetQueueType>) => {
  console.error(`Job ID ${job.id} completado.`)
  const task = await Task.findOneByOrFail({ id: job.data.task.id })

  await Task.update({ id: job.data.task.id }, {
    status: 'completed',
    finishedAt: new Date(),
    duration: (new Date().getTime() - task.scheduledAt!.getTime()) / 1000
  })
})
BetQueue.queue.on('active', async (job: Job<BetQueueType>) => {
  console.error(`Job ID ${job.id} ativado.`)
  await Task.update({ id: job.data.task.id }, {
    status: 'running',
    scheduledAt: new Date()
  })
})
BetQueue.queue.on('paused', async (job: Job<BetQueueType>) => {
  console.error(`Job ID ${job.id} pausado.`)

  await Task.update({ id: job.data.task.id }, {
    status: 'paused'
  })
})
BetQueue.queue.on('failed', async (job: Job<BetQueueType>, error) => {
  console.error(`Job ID ${job.id} falhou:`, error.message)
  await Task.update({ id: job.data.task.id }, {
    status: 'failed',
    errorMessage: error.message
  })
})
