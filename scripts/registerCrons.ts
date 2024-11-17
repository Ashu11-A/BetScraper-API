import { Cron } from '@/database/entity/Cron.js'

export async function registerCrons() {
  const crons: string[] = [
    '0 0 * * *',    // A cada 24 horas
    '0 */12 * * *',  // A cada 12 horas
    '0 */6 * * *',   // A cada 6 horas
    '0 */3 * * *',    // A cada 3 horas
  ]
  const register = async (cron: string) => {
    if (!(await Cron.existsBy({ expression: cron }))) {
      await Cron.create({
        expression: cron   
      }).save()
    }
  }
  
  await Promise.all(crons.map(register))
}