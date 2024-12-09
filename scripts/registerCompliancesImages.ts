import Database from '@/database/dataSource.js'
import Compliance from '@/database/entity/Compliance.js'
import { OCR } from '@/database/entity/OCR.js'
import { normalizeText } from '@/scraper/lib/normalizer.js'
import chalk from 'chalk'
import cliProgress from 'cli-progress'
import pLimit from 'p-limit'
import stringSimilarity from 'string-similarity'

await Database.initialize()

const processLimit = pLimit(500)
const OCRs = await OCR.find({ relations: ['images', 'compliances'] })
const compliances = await Compliance.find()
let actual = 1

// Criar uma barra de progresso
const progressBar = new cliProgress.SingleBar(
  {
    format: 'Progresso | {bar} | {percentage}% | {value}/{total} OCRs processados | Log: {log}',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
  },
  cliProgress.Presets.shades_classic
)

// Inicializar a barra de progresso
progressBar.start(OCRs.length, 0)

function findSimilarMessages(input: string, messages: string[], threshold: number = 0.6): string[] {
  const matches = messages.filter((message) => {
    const similarity = stringSimilarity.compareTwoStrings(normalizeText(input), normalizeText(message))
    return similarity >= threshold
  })
  return matches
}

async function processOCRElement(ocr: OCR) {
  const complianceMap = new Map<number, Compliance>()

  try {
    for (const image of ocr.images) {
      if (!image.content || image.content.length === 0) {
        console.log(chalk.yellow(`[IGNORADO] Imagem sem conteúdo no OCR ID: ${ocr.id}`))
        continue
      }

      const imageContent = image.content
      const combinedAllContent = imageContent.join(' ')

      const processContentOrder = (contentArray: string[], order: string) => {
        for (let index = 0; index < contentArray.length; index++) {
          const currentContent = contentArray[index]
          const previousContent = contentArray[index - 1] ?? ''
          const nextContent = contentArray[index + 1] ?? ''

          const combinedContent = [previousContent, currentContent, nextContent].join(' ')
          const pairPrevious = [previousContent, currentContent].join(' ')
          const pairNext = [currentContent, nextContent].join(' ')

          for (const compliance of compliances) {
            const complianceValue = compliance.value

            const isCombinedMatch = findSimilarMessages(combinedContent, [complianceValue]).length > 0
            const isPreviousPairMatch = findSimilarMessages(pairPrevious, [complianceValue]).length > 0
            const isNextPairMatch = findSimilarMessages(pairNext, [complianceValue]).length > 0
            const isSingleMatch = findSimilarMessages(currentContent, [complianceValue]).length > 0
            const isStringMath = combinedAllContent.includes(complianceValue)

            if (isCombinedMatch || isSingleMatch || isStringMath || isPreviousPairMatch || isNextPairMatch) {
              console.log(
                chalk.green(
                  `[COMPLIANCE ENCONTRADO] OCR ID: ${ocr.id} | Compliance ID: ${compliance.id} | Valor: "${complianceValue}" | Ordem: "${order}"`
                ),
                chalk.green(`Conteudo: "${combinedAllContent}"`)
              )
              complianceMap.set(compliance.id, compliance)
            }
          }
        }
      }

      processContentOrder(imageContent, 'normal')
      processContentOrder([...imageContent].reverse(), 'invertido')
    }

    const uniqueCompliances = Array.from(complianceMap.values())

    // if (ocr?.compliances?.length === uniqueCompliances.length) {
    //   progressBar.update(actual, {
    //     log: chalk.yellow(`OCR ID: ${ocr.id}, sem mudanças.`),
    //   })
    //   return
    // }

    // Adicionar compliances detectados ao OCR
    ocr.compliances = uniqueCompliances
    await ocr.save()

    progressBar.update(actual, {
      log: chalk.green(`OCR ID: ${ocr.id} processado com ${uniqueCompliances.length} compliances detectados.`),
    })
  } catch (e) {
    console.error(
      chalk.bgRed(`[ERRO] OCR ID: ${ocr.id} -> ${(e as Error | undefined)?.message ?? e}`)
    )
    progressBar.update(actual, {
      log: chalk.bgRed(`Erro no OCR ID ${ocr.id}: ${(e as Error | undefined)?.message ?? e}`),
    })
  } finally {
    progressBar.update(++actual)
  }
}

const tasks = OCRs.map((ocr) => processLimit(() => processOCRElement(ocr)))
await Promise.all(tasks)

progressBar.stop()
await Database.destroy()
