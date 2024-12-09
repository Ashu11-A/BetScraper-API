import Bet from '@/database/entity/Bet.js'
import { BetQueue } from '@/queues/BetQueue.js'

export async function runQueue({ mode = 'all' }: { mode: 'primary' | 'secondary' | 'all' }) {
  const bets = await Bet.find()

  // Filtra as bets com base no modo selecionado
  let filteredBets
  switch (mode) {
  case 'primary':
    filteredBets = bets.filter((bet) => bet.id % 2 === 0) // IDs pares
    break
  case 'secondary':
    filteredBets = bets.filter((bet) => bet.id % 2 !== 0) // IDs ímpares
    break
  case 'all':
  default:
    filteredBets = bets // Todas as bets
    break
  }

  // Processa as bets filtradas
  await Promise.all(
    filteredBets.map(async (bet) => {
      console.log(`Adicionando na Fila: ${bet.name}`)
      await new BetQueue().addToQueue({ bet })
    })
  )

  console.log(`Modo '${mode}' executado com sucesso. Total de bets processadas: ${filteredBets.length}`)
}
