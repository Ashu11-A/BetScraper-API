import { calculateContrastRatio } from '@/scraper/lib/contrast.js'
import { calculateProportion } from '@/scraper/lib/proportion.js'
import { parseRGB } from '@/scraper/lib/rgb.js'
import chalk from 'chalk'
import { existsSync } from 'fs'
import { mkdir, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import { dirname, join } from 'path'
import puppeteer, { Browser, ElementHandle, Page } from 'puppeteer'
import { createWorker, Worker } from 'tesseract.js'
import { Criteria } from './criteria.js'
import { findBackgroundColor } from './lib/getBackgroundColor.js'
import { Properties } from './properties.js'
import { Screenshot } from './screenshots.js'

const woker: Worker = await createWorker('por', 2, { gzip: true })
const width = 1920 as const
const height = 1080 as const

export class Scraper {
  private page?: Page
  public browser!: Browser
  public elements: Array<ElementHandle<Element>> = []

  constructor(public readonly url: string, public readonly keywords: string[]) { }

  async loadPage() {
    this.browser = await puppeteer.launch({
      // headless: false,
      args: [
        // Performance
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disk-cache-size=0',
        '--media-cache-size=0',
        '--disable-site-isolation-trials',

        // Security & privacy
        '--incognito',
        '--disable-client-side-phishing-detection',
        '--no-default-browser-check',
        '--no-first-run',

        // Better screenshot
        '--run-all-compositor-stages-before-draw',
        '--disable-features=PaintHolding',
        '--force-device-scale-factor=1',
        '--hide-scrollbars',

        // Anti-bot
        `--window-size=${width},${height}`,
        '--disable-blink-features=AutomationControlled',

        '--disable-accelerated-2d-canvas',
        '--disable-gpu',

        // Fix: NSS error code: -8018
        '--ignore-certificate-errors',
        '--ignore-certificate-errors-skip-list',

        //Fix Fallback WebGL
        '--enable-unsafe-swiftshader'
      ]
    })

    const page = await this.browser.newPage()
    this.page = page

    // page.on('response', async (response) => {
    //   const url = response.url()

    //   if (response.request().resourceType() === 'image') {
    //     console.log(tmpdir())
    //     const dirname = join(tmpdir(), this.url)
    //     const file = await response.buffer()
    //     const fileName = url.split('/').pop()

    //     if (!fileName) {
    //       console.log(`Esse link não há o nome da imagem: ${url}`)
    //       return
    //     }
    //     if(!fileName.endsWith('.png')) return

    //     const filePath = resolve(dirname, fileName)
    //     const writeStream = createWriteStream(filePath)

    //     writeStream.write(file)
    //   }
    // })

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36')
    await page.setCacheEnabled(true)
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
    })
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false })   // Remove a indicação de automação
      Object.defineProperty(navigator, 'languages', { get: () => ['pt-BR', 'en-US', 'en'] })  // Define idiomas comuns
      Object.defineProperty(navigator, 'plugins', { get: () => [{ name: 'Chrome PDF Plugin' }, { name: 'Chrome PDF Viewer' }, { name: 'Native Client' }] })
      Object.defineProperty(navigator, 'platform', { get: () => 'Win32' })  // Define o sistema operacional
    })
    await page.setViewport({ width, height, deviceScaleFactor: 1 })
    await page.goto(this.url, { waitUntil: 'networkidle2' })
    this.disableNavigation()

    return this
  }

  /**
   * Desabilita a possibilidade de clicar em URLs
   * Isso irá interceptar todos os requests e aborta-los
   *
   * @private
   */
  private disableNavigation() {
    const page = this.page
    if (page === undefined) throw new Error('Page is undefined, try loadPage function before')


    page.on('request', (req) => {
      console.log(chalk.red(`⛔ Ignoring requests: ${req.url()}`))

      if (req.isNavigationRequest() && req.frame() === page.mainFrame()) {
        console.log('Abort')
        req.abort('aborted')
        return
      }
      req.continue()
    })
    page.setRequestInterception(true)
  }

  // async closePopUp() {
  //   if (this.page === undefined) throw new Error('Page is undefined, try loadPage function before')

  //   await this.page.waitForNetworkIdle()
  //   await this.page.mouse.move(100, 100)
  //   await this.page.mouse.move(200, 200, { steps: 20 })

  //   // Define a posição para mover o mouse
  //   let moveX = 150
  //   let moveY = 200
  //   let overDiv = false

  //   while (overDiv) {
  //     const isDiv = await this.page.evaluate(({ x, y }) => {
  //       const element = document.elementFromPoint(x, y)
  //       console.log(element?.tagName)
  //       return element && element.tagName === 'DIV'
  //     }, { x: moveX, y: moveY })
  //     if (isDiv) overDiv = true

  //     moveX += 10
  //     moveY += 10
  //   }
  //   await this.page.mouse.click(moveX, moveY)
  // }

  /**
   * Lista todos os elementos da pagina, e seta eles na variavel local da class
   *
   * @async
   * @returns {Promise<this>}
   */
  async scan(): Promise<this> {
    if (this.page === undefined) throw new Error('Page is undefined, try loadPage function before')

    this.elements = await this.page.$$('*')
    return this
  }

  /**
   * Filtra os elementos que foram encontrados em this.scan.
   * Usa as keywords para procurar os elementos que contêm as palavras de interesse.
   *
   * @async
   * @returns {Promise<string[]>} - Retorna uma lista de keywords encontradas nos elementos.
   */
  async filter(): Promise<string[]> {
    if (this.elements.length === 0) {
      await this.page?.close()
      throw new Error('Execute scan function first')
    }

    const stringsFound = new Set<string>()

    const filteredElements = (
      await Promise.all(
        this.elements.map(async (element) => {
          const textContent = await element.evaluate(el => el.textContent)
          if (typeof textContent !== 'string') return null

          // Verificar e coletar keywords encontradas
          const hasKeywords = this.keywords.some((keyword) => {
            if (textContent.includes(keyword)) {
              stringsFound.add(keyword)
              return true
            }
            return false
          })

          // Se encontrou keywords, verificar se tem filhos
          if (hasKeywords) {
            // Retornar o elemento apenas se não tiver filhos
            // if (!((await element.$$('*')).length > 0)) 
            return element
          }
          return null
        })
      )
    ).filter((element) => element !== null) // Filtrar elementos não nulos

    this.elements = filteredElements
    return Array.from(stringsFound) // Retorna keywords encontradas
  }


  /**
   * Screenshot da tela rederizada atualmente
   *
   * @async
   * @returns {Promise<Uint8Array>}
   */
  async getScreenshot(): Promise<Uint8Array> {
    if (this.page === undefined) throw new Error('Page is undefined, try loadPage function before')

    return await this.page.screenshot()
  }

  /**
   * Retorna todas as propriedades dos elementos encontrados e filtrados
   * Isso retornará apenas os elementos que não tenha 'filhos'
   *
   * @async
   * @returns {Promise<Properties[]>}
   */
  async getProprieties(): Promise<Properties[]> {
    if (this.elements.length === 0 || this.page === undefined) {
      await this.page?.close()
      throw new Error('variable elements is empty or page not initialized')
    }
    
    const properties: Properties[] = []
    
    for await (const element of this.elements) {
      if (element.asElement() === null) continue
      
      const box = await element.boxModel()
      if (box === null) continue

      const textContent = await element.evaluate((el) => el.textContent)
      if (textContent === null) continue
      
      const viewport = this.page.viewport()
      if (!viewport) continue
    
      const distanceToTop = await (async () => {
        return await element.evaluate((el) => {
          const elementRect = el.getBoundingClientRect()
          const scrollTop = window.scrollY || document.documentElement.scrollTop
          return elementRect.top + scrollTop
        }, element)
      })()
      
      const isInViewport = (distanceToTop <= viewport.height)
      const color = await element.evaluate((el) => {
        const style = window.getComputedStyle(el)
        return {
          color: style.color,
          backgroundColor: style.backgroundColor,
        }
      })
  
      const backgroundColor = (/^rgba?\(0,\s*0,\s*0,\s*0\)$/.test(color.backgroundColor) || color.backgroundColor === 'transparent')
        ? await findBackgroundColor(element)
        : color.backgroundColor
  
      const contrastRatio = (() => {
        const [r1, g1, b1] = parseRGB(color.color)
        const [r2, g2, b2] = parseRGB(backgroundColor)
        return calculateContrastRatio([r1, g1, b1], [r2, g2, b2])
      })()
    
      const hasChildNodes = (await element.$$('*')).length > 0
      // Obter a altura total da página
      const pageDimensions = await this.page.evaluate(() => {
        const width = Math.max(
          document.body.scrollWidth,
          document.documentElement.scrollWidth,
          document.body.offsetWidth,
          document.documentElement.offsetWidth,
          document.documentElement.clientWidth
        )
      
        const height = Math.max(
          document.body.scrollHeight,
          document.documentElement.scrollHeight,
          document.body.offsetHeight,
          document.documentElement.offsetHeight,
          document.documentElement.clientHeight
        )
      
        return { width, height }
      })
      
      const scrollPercentage = (distanceToTop / pageDimensions.height) * 100

      properties.push(new Properties({
        textContent,
        scrollPercentage,
        contrast: contrastRatio,
        proportion: calculateProportion(box.width, viewport.width),
      
        isIntersectingViewport: await element.isIntersectingViewport(),
        isVisible: await element.isVisible(),
        isHidden: await element.isHidden(),
        hasChildNodes,
        isInViewport,
      
        backgroundColor,
        color: color.color,

        distanceToTop,
        viewport,
      }))
    }
  
    return properties
  }

  async getScreenshots(): Promise<Screenshot[]> {
    if (this.elements.length === 0) {
      await this.page?.close()
      throw new Error('Variable elements is empty')
    }
    const screenshots: Screenshot[] = []

    for (const element of this.elements) {
      if (element.asElement() === null) continue
      try {
        // 500 KB em bytes
        const sizeInBytes = 500 * 1024
        const image = await element.screenshot({ captureBeyondViewport: false })
        if (image.byteLength > sizeInBytes) continue

        screenshots.push(new Screenshot(image))
      } catch (err) {
        console.log(err)
      }
    }

    return screenshots
  }

  /**
   * Filtra as imagens com OCR
   * após o OCR, o resultado é passado por uma checagem de criterios
   *
   * @async
   * @param {Screenshot[]} screenshots
   * @returns {Promise<Screenshot[]>}
   */
  async filterScreenshots(screenshots: Screenshot[]): Promise<Screenshot[]> {
    const filteredScreenshot: Screenshot[] = []

    for (const screenshot of screenshots) {
      try {
        // Salva o buffer como arquivo temporário
        const tempImagePath = join(tmpdir(), `temp-image-${Date.now()}.png`)
        await writeFile(tempImagePath, await screenshot.grayscale())

        // Realiza OCR na imagem temporária
        const { data } = await woker.recognize(tempImagePath, {}, { text: true })
        const imgText = data.text
        const criterias = new Criteria({}).setCriterias(imgText)
        if (criterias.hasIrregularity) filteredScreenshot.push(new Screenshot(screenshot.image))

        const countKeywords = this.keywords.filter(keyword => data.text.includes(keyword)).length
        console.log(chalk.red(`${countKeywords} palavras/frases foram encontradas na pagina: ${this.url}`))
      } catch (err) {
        console.log(err)
      }
    }

    return filteredScreenshot
  }

  /**
   * Salva o html no path especificado
   * - Não salva o css.
   * - Não salva imagens
   *
   * @async
   * @param {string} path
   * @returns {Promise<void>}
   */
  async savePageContent(path: string): Promise<void> {
    if (this.page === undefined) throw new Error('Page is undefined, try loadPage function before')

    const content = await this.page.content()
    const filename = 'page.html'
  
    if (!existsSync(dirname(path))) await mkdir(dirname(path))
    await writeFile(join(path, filename), content)
  }
}
