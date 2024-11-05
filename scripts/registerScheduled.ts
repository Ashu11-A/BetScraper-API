import Bet from '@/database/entity/Bet.js'
import { BetQueue } from '@/queues/BetQueue.js'

export async function registerScheduled () {
  const betsInScheduled = await BetQueue.queue.getRepeatableJobs()
  const bets = await Bet.find({
    relations: ['cron']
  })
    
  // const process: Promise<Job<BetQueueType>>[] = []
    
  for (const bet of bets) {
    const isScheduled = betsInScheduled.some((betScheduled) => Number(betScheduled?.id) === bet.id)
    
    if (!isScheduled) {
      console.log(`Adicionando na Fila: ${bet.name}`)
      new BetQueue().addToQueue({ bet, cron: bet.cron })
      await new Promise((resolve) => setTimeout(() => resolve(true), 15000))
    }
  }
  // await Promise.all(process)
}
