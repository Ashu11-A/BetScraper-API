import Bet from '@/database/entity/Bet.js'
import { Cron } from '@/database/entity/Cron.js'
import { parse } from 'csv'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { BetsDataset } from './types/dataset.js'

const datasetPath = join(process.cwd(), 'dataset/18-10-24.csv')
const dataset = await readFile(datasetPath, { encoding: 'utf-8' })
const headers = [
  'Número', 'Marcas', 'Domínios', 'símbolo "18+"', 'aviso "proibido para menores de 18 anos"',
  'Jogue com responsabilidade', 'Apostas são atividades com riscos de perdas financeiras.',
  'Apostar pode levar à perda de dinheiro.',
  'As chances são de que você está prestes a perder',
  'Aposta não é investimento.', 'Apostar pode causar dependência.',
  'Apostas esportivas: pratique o jogo seguro.', 'Apostar não deixa ninguém rico.',
  'Saiba quando apostar e quando parar.', 'Aposta é assunto para adultos.',
  'Informação Clara (acesso direto pelo usuário)',
  'Ostensiva (chama atenção do usuário)', 'Proporcional (minimo 10%)',
  'Destacada (contraste com a cor de fundo)', 'Site acessado em DD/MM/AAAA'
]

const formatURL = (url: string) => {
  // Verifica se o link já começa com 'http://' ou 'https://'
  if (!/^https?:\/\//i.test(url)) {
    return `https://${url}`
  }
  return url
}

export async function registerBets() {
  const getCron = async () => {
    const cron = await Cron.findOneBy({ expression: '0 */3 * * *' })
    if (cron === null) {
      return await Cron.create({ expression: '0 */3 * * *' }).save()
    }
    return cron
  }
  
  const existsBy = async (url: string) => await Bet.existsBy({ url })
  const register = async (name: string, url: string) => {
    if (!(await existsBy(url))) {
      await Bet.create({
        name,
        url,
        cron
      }).save()
    }
  }

  const cron = await getCron()
  return new Promise<boolean>((resolve, reject) => {
    parse(dataset, {
      delimiter: ',',
      columns: headers,
      fromLine: 2,
      cast: (columnValue, context) => {
        if (['true', 'false'].includes(columnValue)) return Boolean(columnValue)
        if (context.column === 'Número') return Number(columnValue)
        return columnValue
      }
    }, async (error, result: BetsDataset[]) => {
      if (error) reject(error)
      const process: Array<Promise<void>> = []
    
      for (const bet of result) {
        process.push(register(bet.Marcas, formatURL(bet.Domínios)))
      }
      await Promise.all(process)
      resolve(true)
    })
  })
}