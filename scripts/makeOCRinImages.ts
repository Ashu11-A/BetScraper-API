import Database from '@/database/dataSource.js'
import { Image } from '@/database/entity/Image.js'
import { Screenshot } from '@/scraper/screenshots.js'
import axios, { AxiosError } from 'axios'
import chalk from 'chalk'
import { existsSync } from 'fs'
import { writeFile } from 'fs/promises'
import { readFile } from 'fs/promises'
import { tmpdir } from 'os'
import pLimit from 'p-limit'
import { join } from 'path'
import cliProgress from 'cli-progress'

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
  const path = join(process.cwd(), '/images/', `${image.hash}.png`)
  const pathTmp = join(tmpdir(), `/${image.hash}.png`)

  if (image.content !== null) {
    progressBar.update(++actual, { log: chalk.bgBlue(`Imagem já processada: ${path}`) })
    return
  }

  if (!existsSync(path)) {
    console.log(index)
    progressBar.update(++actual, { log: chalk.bgRed(`[${index}] Imagem não existe: ${path}`) })
    return
  }

  const imageBuffer = await readFile(path)
  let processedImage: Buffer | null = null
  try {
    processedImage = await new Screenshot(imageBuffer).greyscale().gaussian().toBuffer().catch(() => null)
  } catch (error) {
    console.error(error)
    processedImage = null
  }
  if (!processedImage) {
    progressBar.increment()
    return
  }

  await writeFile(pathTmp, processedImage)

  try {
    const request = await axios.post(
      'http://localhost:5000/ocr',
      { imagePath: pathTmp },
      { timeout: 0 }
    )

    const text = request.data.result as string[] | undefined
    console.log(text)
    progressBar.update(actual, { log: chalk.bgGreen(`Imagem Processada: ${pathTmp} Texto: ${text}`) })

    image.content = text ?? null
    await image.save()
  } catch (e) {
    if (e instanceof AxiosError) {
      // if (String(e?.response?.data?.error).includes('Nenhum texto detectado na imagem.')) {
      //   image.content = null
      //   await image.save()
      // }

      progressBar.update(actual, { log: chalk.bgRed(`Status: ${e?.response?.data?.error ?? e?.message ?? e.status}`) })
    } else {
      console.error(e)
    }
  } finally {
    progressBar.update(++actual) // Incrementa a barra após cada imagem processada
  }
}

const tasks = images.map((image, index) => processLimit(() => processImage(image, index)))
await Promise.all(tasks)

// Finalizar a barra de progresso
progressBar.stop()

await Database.destroy()
