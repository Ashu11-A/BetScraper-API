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
import Compliance from '@/database/entity/Compliance.js'

const woker: Worker = await createWorker('por', 2, { gzip: true })
/**
 * Tamanho da viewport da página.
 * Define a resolução de visualização da página carregada no navegador.
 */
const viewport = {
  width: 1920,
  height: 1080
} as const

/**
 * Classe responsável por realizar o Web Scraping em sites de apostas.
 *
 * Essa classe gerencia a navegação, extração de elementos, análise de texto e processamento de screenshots.
 *
 * @export
 * @class Scraper
 * @typedef {Scraper}
 */
export class Scraper {
  private page?: Page
  public browser!: Browser

  /**
   * Lista de elementos HTML extraídos da página.
   * Esses elementos são filtrados para encontrar conteúdos que correspondam às palavras de interesse.
   *
   * @public
   * @type {Array<ElementHandle<Element>>}
   */
  public elements: Array<ElementHandle<Element>> = []

  /**
   * Cria uma instância da classe Scraper.
   *
   * @constructor
   * @param {string} url - URL da página a ser carregada.
   * @param {Compliance[]} compliances - Lista de critérios de conformidade a serem usados para análise.
   */
  constructor(public readonly url: string, public readonly compliances: Compliance[]) {}

  /**
   * Carrega a página inicial e a prepara para a execução de scripts e análises.
   *
   * @async
   * @returns {Promise<Scraper>} - A instância atual de `Scraper` após a página ser carregada.
   */
  async loadPage(): Promise<Scraper> {
    console.log(chalk.yellow(`Bet: ${this.url} entrou na fila de processamento`))
    this.browser = await puppeteer.launch({
      defaultViewport: {
        height: viewport.height,
        width: viewport.width
      },
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
    //     const file = await response.buffer()
    //     const fileName = url.split('/').pop()

    //     if (!fileName) {
    //       console.log(`Esse link não há o nome da imagem: ${url}`)
    //       return
    //     }
    //     if(!['png', 'jpeg', 'jpg'].some((format) => fileName.endsWith(format))) return
    //     console.log(`⬇️ Fazendo o Download: ${url}`)

    //     const filePath = resolve(tmpdir(), fileName)
    //     await writeFile(filePath, file)
    //   }
    // })

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36')
    await page.setCacheEnabled(true)
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
    })
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false })
      Object.defineProperty(navigator, 'languages', { get: () => ['pt-BR', 'en-US', 'en'] })
      Object.defineProperty(navigator, 'plugins', { get: () => [{ name: 'Chrome PDF Plugin' }, { name: 'Chrome PDF Viewer' }, { name: 'Native Client' }] })
      Object.defineProperty(navigator, 'platform', { get: () => 'Win32' })
    })
    await page.setViewport({ width: viewport.width, height: viewport.height, deviceScaleFactor: 1 })
    await page.goto(this.url, { waitUntil: 'networkidle2' })

    return this
  }

  /**
   * Realiza a varredura da página e armazena todos os elementos DOM.
   *
   * @async
   * @returns {Promise<this>} - A instância atual de `Scraper` com os elementos carregados.
   */
  async scan(): Promise<this> {
    console.log(chalk.yellow(`Bet: ${this.url} scaneando elementos`))
    if (this.page === undefined) throw new Error('Page is undefined, try loadPage function before')

    this.elements = await this.page.$$('*')
    console.log(chalk.yellow(`Bet: ${this.url} ${this.elements.length} elementos foram encontrados`))
    return this
  }

  /**
   * Filtra os elementos encontrados durante a varredura com base em palavras-chave definidas.
   *
   * @async
   * @param {ElementHandle<Element>[]} [elements] - Lista opcional de elementos a serem filtrados.
   * @returns {Promise<ElementHandle<Element>[]>} - Lista de elementos que contêm palavras de interesse.
   */
  async filter(elements?: ElementHandle<Element>[]): Promise<ElementHandle<Element>[]> {
    elements = elements ?? this.elements

    const filteredElements = (
      await Promise.all(
        elements.map(async (element) => {
          const textContent = await element.evaluate((el) => el.textContent)
          if (typeof textContent !== 'string') return null

          const hasKeywords = this.compliances.some((compliance) => textContent.includes(compliance.value))
          return hasKeywords ? element : null
        })
      )
    ).filter((element) => element !== null)

    this.elements = filteredElements
    console.log(chalk.yellow(`Bet: ${this.url} ${filteredElements.length} elementos restantes depois da filtragem`))

    return filteredElements
  }

  /**
   * Procura palavras de interesse em elementos HTML.
   *
   * @async
   * @param {ElementHandle<Element>[]} [elements] - Lista opcional de elementos para análise.
   * @returns {Promise<Compliance[]>} - Lista de instâncias de `Compliance` com as palavras encontradas.
   */
  async find(elements?: ElementHandle<Element>[]): Promise<Compliance[]> {
    elements = elements ?? this.elements
    const compliances: Compliance[] = []

    await Promise.all(
      elements.map(async (element) => {
        const textContent = await element.evaluate((el) => el.textContent)
        if (typeof textContent !== 'string') return

        for (const compliance of this.compliances) {
          if (textContent.includes(compliance.value)) {
            console.log(chalk.bgBlue(`Palavra ${compliance.value} encontrada`))
            compliances.push(compliance)
          }
        }
      })
    )

    console.log(chalk.yellow(`Bet: ${this.url} ${compliances.length} strings encontradas`))
    return compliances
  }

  /**
 * Coleta as propriedades de elementos selecionados da página, analisando atributos como cor do texto, cor de fundo,
 * contraste, proporção em relação à viewport, e visibilidade na página.
 *
 * @async
 * @param {ElementHandle<Element>[]} [elementsData] - Lista opcional de elementos a serem analisados. Se não fornecida, serão usados os elementos previamente escaneados.
 * @returns {Promise<{ properties: Properties[], elements: ElementHandle<Element>[] }>} - Um objeto contendo as propriedades analisadas dos elementos e os próprios elementos.
 * @throws {Error} - Lança um erro se a página não tiver sido inicializada.
 */
  async getProprieties(): Promise<{ properties: Properties[], elements: ElementHandle<Element>[] }> {
    if (this.page === undefined) throw new Error('A variável page não foi inicializada ou elementos estão vazios.')
    console.log(chalk.yellow(`Bet: ${this.url} coletando propriedades de ${(this.elements).length} elementos`))

    const properties = new Set<Properties>()
    const elements = new Set<ElementHandle<Element>>()

    const isPropertyDuplicate = (existingProperties: Properties[], newProperty: Properties) => {
      return existingProperties.some(prop => 
        prop.elementBox.width === newProperty.elementBox.width &&
        prop.distanceToTop === newProperty.distanceToTop
      )
    }

    const getProps = async (elementsData?: ElementHandle<Element>[]) => {
      console.log(chalk.bgYellow(`Bet: ${this.url} coletando subPropriedades de ${(elementsData ?? this.elements).length} elementos`))
      for await (const element of (elementsData ?? this.elements)) {
        if (elements.has(element)) { console.log(chalk.bgRed('Elemento duplicado em: getProprieties')); continue } // Ignora duplicatas
  
        const text = await element.evaluate((el) => el.textContent)
        if (!text || !this.compliances.some((compliance) => text.includes(compliance.value))) continue
        if (!element.asElement()) continue
  
        const viewport = this.page!.viewport()
        if (!viewport) continue
  
        const childrenHandle = await element.evaluateHandle((e) => Array.from(e.children), element)
        const children = await childrenHandle.getProperties()
        const childElements = Array.from(children.values()) as ElementHandle<Element>[]
        const hasChildNodes = childElements.length > 0
  
        // Processa elementos filhos, se existirem
        if (hasChildNodes) {
          const elementsChild = await this.filter(childElements)
          await getProps(elementsChild)
          continue
        }
  
        const compliances = await this.find([element])
        const replaceValue = compliances.map((compliance) => compliance.value).join(', ')
        await element.evaluate((el, replaceValue) => (el.textContent = replaceValue), replaceValue)
        const textContent = await element.evaluate((el) => el.textContent)
        if (!textContent) continue
  
        const box = await element.boxModel()
        if (!box) continue
  
        // Calcula a distância do elemento até o topo da página
        const distanceToTop = await element.evaluate((el) => {
          const elementRect = el.getBoundingClientRect()
          const scrollTop = window.scrollY || document.documentElement.scrollTop
          return elementRect.top + scrollTop
        })
  
        const textColor = await element.evaluate((el) => window.getComputedStyle(el).color)
        const backgroundColor = await findBackgroundColor(element)
        const [r2, g2, b2] = parseRGB(backgroundColor)
        const [r1, g1, b1] = parseRGB(textColor, [r2, g2, b2])
        const contrastRatio = calculateContrastRatio([r1, g1, b1], [r2, g2, b2])
  
        const pageDimensions = await this.getSize()
        const isInViewport = distanceToTop <= viewport.height
  
        // Coleta as propriedades de cada elemento e adiciona à lista de propriedades
        const newProperty = new Properties({
          compliances,
          contrast: contrastRatio,
          proportionPercentage: calculateProportion(box.width, viewport.width),
          scrollPercentage: calculateProportion(distanceToTop, pageDimensions.height),
          colors: {
            text: {
              value: textColor,
              color: [r1, g1, b1]
            },
            backgroundColor: {
              value: backgroundColor,
              color: [r2, g2, b2]
            }
          },
  
          isIntersectingViewport: await element.isIntersectingViewport(),
          isVisible: await element.isVisible(),
          isHidden: await element.isHidden(),
          hasChildNodes,
          isInViewport,
  
          elementBox: box,
          pageDimensions,
          distanceToTop,
          viewport
        })
  
        if (!isPropertyDuplicate(Array.from(properties), newProperty)) {
          properties.add(newProperty)
          return
        }
        console.log(chalk.bgMagenta('Elemento duplicado, ignorando...'))
      }
    }

    await getProps()


    return {
      properties: Array.from(properties),
      elements: Array.from(elements)
    }
  }

  /**
   * Pega o tamanho maximo do website
   *
   * @async
   * @returns {Promise<{ width: number, height: number }>}
   */
  async getSize (): Promise<{
    width: number,
    height: number
  }> {
    const elements = await this.page!.$$('*') ?? []
    let height = 0

    const width = await this.page!.evaluate(() => Math.max(
      document.body.scrollWidth,
      document.documentElement.scrollWidth,
      document.body.offsetWidth,
      document.documentElement.offsetWidth,
      document.documentElement.clientWidth
    ))

    for (const element of elements) {
      const pageDimensions = await element.evaluate((el) => {
        const height = Math.max(
          document.body.scrollHeight,
          document.documentElement.scrollHeight,
          document.body.offsetHeight,
          document.documentElement.offsetHeight,
          document.documentElement.clientHeight,
          el.scrollHeight,
          el.clientHeight
        )
      
        return { height }
      })

      if (pageDimensions.height > height) height = pageDimensions.height
    }
    return { width, height }
  }

  /**
   * Screenshot da tela rederizada atualmente
   *
   * @async
   * @returns {Promise<Uint8Array>}
   */
  async getScreenshot(): Promise<Uint8Array | undefined> {
    if (this.page === undefined) throw new Error('Page is undefined, try loadPage function before')
  
    console.log(chalk.yellow(`Bet: ${this.url} fazendo screenshot da pagina inicial`))
    try {
      return await this.page.screenshot()
    } catch (err) {
      console.log(err)
      return
    }
  }
  
  /**
   * Retorna todas as imagens dos elementos de interresse
   *
   * @async
   * @param {?ElementHandle<Element>[]} [elements]
   * @returns {Promise<Map<number, Screenshot>>}
   */
  async getScreenshots(elements?: ElementHandle<Element>[]): Promise<Map<number, Screenshot>> {
    elements = elements ?? this.elements
    const screenshots = new Map<number, Screenshot>()
    console.log(chalk.yellow(`Bet: ${this.url} fazendo a screenshot dos ${elements.length} elementos`))

    for (const [index, element] of Object.entries(elements)) {
      if (element.asElement() === null) continue
      try {
        // 500 KB em bytes
        const box = await element.boundingBox()
        if (box === null || (box && box.width === 0 && box.height === 0)) continue

        const sizeInBytes = 500 * 1024
        const image = await element.screenshot({ captureBeyondViewport: false })
        if (image.byteLength > sizeInBytes) continue

        screenshots.set(Number(index), new Screenshot(image))
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
  async filterScreenshots(screenshots: Map<number, Screenshot>): Promise<Map<number, Screenshot>> {
    const filteredScreenshot = new Map<number, Screenshot>()
    console.log(chalk.yellow(`Bet: ${this.url} filtrado as ${screenshots.size} screenshots`))

    for (const [index, screenshot] of screenshots) {
      try {
        // Salva o buffer como arquivo temporário
        const tempImagePath = join(tmpdir(), `temp-image-${Date.now()}.png`)
        await writeFile(tempImagePath, await screenshot.greyscale().gaussian().toBuffer())

        // Realiza OCR na imagem temporária
        const { data } = await woker.recognize(tempImagePath, {}, { text: true })
        const imgText = data.text
        const criterias = new Criteria({}).setCriterias(imgText)
        if (criterias.hasIrregularity) filteredScreenshot.set(Number(index), new Screenshot(screenshot.image))

        const countKeywords = this.compliances.filter((compliance) => data.text.includes(compliance.value)).length
        console.log(chalk.red(`${countKeywords} palavras/frases foram encontradas na pagina: ${this.url}`))
      } catch (err) {
        console.log(err)
      }
    }

    console.log(chalk.yellow(`Bet: ${this.url} ${screenshots.size} screenshots depois da filtragem`))
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
    const filename = 'page.pdf'
      
    if (!existsSync(dirname(path))) await mkdir(dirname(path))
    await this.page.pdf({
      format: 'A4',
      path: join(path, filename)
    })
  }

  /**
   * Fecha o navegador e limpa a memória associada à instância.
   *
   * @async
   * @returns {Promise<void>}
   */
  async destroy(): Promise<void> {
    console.log(chalk.red(`Bet: ${this.url} memória desalocada`))
    await this.page?.close()
    await this.browser.close()
  }


  // /**
  //  * Desabilita a possibilidade de clicar em URLs
  //  * Isso irá interceptar todos os requests e aborta-los
  //  *
  //  * @private
  //  */
  // private disableNavigation() {
  //   console.log(chalk.yellow(`Bet: ${this.url} navegação disabilitado`))
  //   const page = this.page
  //   if (page === undefined) throw new Error('Page is undefined, try loadPage function before')


  //   page.on('request', (req) => {
  //     console.log(chalk.red(`⛔ Ignoring requests: ${req.url()}`))

  //     if (req.isNavigationRequest() && req.frame() === page.mainFrame()) {
  //       console.log('Abort')
  //       req.abort('aborted')
  //       return
  //     }
  //     req.continue()
  //   })
  //   page.setRequestInterception(true)
  // }

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
}
