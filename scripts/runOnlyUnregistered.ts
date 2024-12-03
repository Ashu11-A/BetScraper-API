import Bet from '@/database/entity/Bet.js'
import { Task } from '@/database/entity/Task.js'
import { BetQueue } from '@/queues/BetQueue.js'

export async function runOnlyUnregistered () {
  const bets = await Bet.find()
  const tasks = await Task.find({ relations: ['bet'] })

  await Promise.all(bets.map(async (bet) => {
    const hasTaskCompleted = tasks.some((task) => {
      if (task.bet.id !== bet.id) return false
      if (task.status !== 'completed') return false
    
      return true
    })    
    
    if (!hasTaskCompleted) {
      console.log(`Adicionando na Fila: ${bet.name}`)
      await new BetQueue().addToQueue({ bet })
    }
  }))
}
