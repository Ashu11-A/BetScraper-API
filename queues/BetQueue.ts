import { Queue } from '@/controllers/queue.js'
import Bet from '@/database/entity/Bet.js'
import { Cron } from '@/database/entity/Cron.js'
import { Task } from '@/database/entity/Task.js'
import { User } from '@/database/entity/User.js'
import { storagePath } from '@/index.js'
import { Scraper } from '@/libs/scraper.js'
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

const keywords = [
  'créditos', 'bônus', 'crédito', 'bônu',
  'incentivo', 'gratificação',
  'bonificação', 'abono', 'saldo extra',
]

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
  try {
    console.log(`Starting Job ID: ${job.id}`)

    const scraper = new Scraper(job.data.task.bet.url, keywords)
    await scraper.loadPage()

    const initImage = await scraper.getScreenshotInitPage()
    await writeFile('initial.png', initImage)

    await scraper.closePopUp()
    await scraper.scan()
    await scraper.filter()

    const evidences = await scraper.getScreenshots()
    const filteredEvidences = await scraper.filterScreenshots(evidences)
  
    await scraper.browser.close()
    
    const dirToSave = join(storagePath, `/tasks/${job.data.task.id}/bets/${job.data.task.bet.id}/${job.data.task.createdAt}`)
    await mkdir(dirToSave, { recursive: true })
  
    for (const [number, evidence] of Object.entries(filteredEvidences)) {
      await writeFile(join(dirToSave, `/${number}.png`), evidence.print)
    }

    const jsonData = filteredEvidences.map((evidence, index) => ({
      ...evidence,
      print: undefined,
      path: join(dirToSave, `/${index}.png`),
      pathName: `${index}.png`
    }))
    await writeFile(join(dirToSave, '/metadata.json'), JSON.stringify(jsonData, null, 2))

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