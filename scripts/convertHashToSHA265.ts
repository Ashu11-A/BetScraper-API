import Database from '@/database/dataSource.js'
import { Image } from '@/database/entity/Image.js'
import { sha256 } from '@/scraper/lib/hash.js'
import chalk from 'chalk'
import cliProgress from 'cli-progress'
import { existsSync } from 'fs'
import { readFile, rm, writeFile } from 'fs/promises'
import pLimit from 'p-limit'
import { join } from 'path'

await Database.initialize()

const processLimit = pLimit(100)
const images = await Image.find()
let actual = 1

// Criar uma barra de progresso
const progressBar = new cliProgress.SingleBar(
  {
    format: 'Progresso | {bar} | {percentage}% | {value}/{total} imagens | Log: {log}',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591'
  },
  cliProgress.Presets.shades_classic
)

// Inicializar a barra de progresso
progressBar.start(images.length, 0)

async function processImage(image: Image, index: number) {
  const path = join(process.cwd(), '/images/')
  const imagePath = join(path, `${image.hash}.png`)
  
  if (!existsSync(imagePath)) {
    progressBar.update(actual, { log: chalk.bgRed(`[${index}] Imagem não existe: ${path}`) })
    return
  }
    
  try {
    const imageBuffer = await readFile(imagePath)
    const hash = sha256(imageBuffer)
    const newPath = join(path, `${hash}.png`)

    if (image.hash === hash) progressBar.update(actual, { log: chalk.bgYellow(`Imagem já Processada: ${imagePath} Hash: ${hash}`) })
  
    await writeFile(newPath, imageBuffer)
      .then(async () => {
        image.hash = hash
        await image.save()

        await rm(imagePath)
      })

    progressBar.update(actual, { log: chalk.bgGreen(`Imagem Processada: ${imagePath} Hash: ${hash}`) })
  } catch (e) {
    console.log(e)
  } finally {
    progressBar.update(++actual) // Incrementa a barra após cada imagem processada
  }
}

const tasks = images.map((image, index) => processLimit(() => processImage(image, index)))
await Promise.all(tasks)

// Finalizar a barra de progresso
progressBar.stop()

await Database.destroy()
