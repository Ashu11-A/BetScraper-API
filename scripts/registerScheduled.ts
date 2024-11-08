import Bet from '@/database/entity/Bet.js'
import { BetQueue } from '@/queues/BetQueue.js'

export async function registerScheduled () {
  const betsInScheduled = await BetQueue.queue.getRepeatableJobs()
  const bets = await Bet.find({
    relations: ['cron']
  })

  await Promise.all(bets.map(async (bet) => {
    const isScheduled = betsInScheduled.some((betScheduled) => {
      const [betIdStr, idTask] = String(betScheduled.id).split('-')
      const betId = Number(betIdStr)
      if (Number.isNaN(betId)) return
      if (typeof idTask === 'string' && idTask === '') return
  
      return betId === bet.id
    })
    
    if (!isScheduled) {
      console.log(`Adicionando na Fila: ${bet.name}`)
      await new BetQueue().addToQueue({ bet, cron: bet.cron })
    }
  }))
}
