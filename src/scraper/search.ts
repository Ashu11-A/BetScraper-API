import Compliance from '@/database/entity/Compliance.js'
import { Image } from '@/database/entity/Image.js'
import { OCR } from '@/database/entity/OCR.js'
import { Task } from '@/database/entity/Task.js'
import { calculateContrastRatio } from '@/scraper/lib/contrast.js'
import { calculateProportion } from '@/scraper/lib/proportion.js'
import { parseRGB } from '@/scraper/lib/rgb.js'
import { cloudflareKeywords } from '@/shared/consts/keywords/cloudflare.js'
import { parkingKeywords } from '@/shared/consts/keywords/parking.js'
import axios from 'axios'
import chalk from 'chalk'
import { existsSync } from 'fs'
import { mkdir, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import pLimit from 'p-limit'
import { dirname, join } from 'path'
import puppeteer, { Browser, ElementHandle, HTTPResponse, Page, PuppeteerError } from 'puppeteer'
import { createWorker, Worker } from 'tesseract.js'
import { Criteria } from './criteria.js'
import { findBackgroundColor } from './lib/getBackgroundColor.js'
import { imageHash } from './lib/hash.js'
import { Properties } from './properties.js'
import { Screenshot } from './screenshots.js'

const woker: Worker = await createWorker('por', 2, { gzip: true })
const processOCRLimit = pLimit(10)

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

  public images: string[] = []

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
        '--enable-unsafe-swiftshader',
    
        // Fix: Navigating frame was detached
        '--disable-features=site-per-process',
    
        '--disable-dev-shm-usage'
      ]
    })

    const page = await this.browser.newPage()
    this.page = page

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36')
    await page.setCacheEnabled(true)
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'pt-BR,pt;q=0.9'
    })
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false })
      Object.defineProperty(navigator, 'languages', { get: () => ['pt-BR'] })
      Object.defineProperty(navigator, 'plugins', { get: () => [{ name: 'Chrome PDF Plugin' }, { name: 'Chrome PDF Viewer' }, { name: 'Native Client' }] })
      Object.defineProperty(navigator, 'platform', { get: () => 'Win32' })
    })
    await page.setViewport({ width: viewport.width, height: viewport.height, deviceScaleFactor: 1 })
  
    // this.page.on('load', () => console.log('Página carregada.'))
    // this.page.on('error', (err) => console.error('Erro na página:', err))
    // this.page.on('framenavigated', (frame) => console.log('Frame navegou:', frame.url()))
    try {
      const response = await this.page.goto(this.url, { waitUntil: 'networkidle0', timeout: 120_000,  })
      await this.checkWebsiteStatus(response)
    } catch (error) {
      console.log(error)

      if (error instanceof PuppeteerError) {
        if (error.message.includes('Navigation timeout') || error.name == 'TimeoutError') return this
        throw new Error(error?.message ?? error?.name)
      }
      throw new Error(String(error))
    }
    // this.disableNavigation()

    return this
  }

  private async checkWebsiteStatus (response: HTTPResponse | null) {
    if (!response) {
      console.log('Error: Unable to get a response from the server.')
      throw new Error('Unable to get a response from the server.')
    }

    const status = response.status()
    const content = await this.page!.content()
    console.log(chalk.bgGreen(`HTTP Status: ${status}`))

    for (const keyword of parkingKeywords) {
      if (content.includes(keyword)) {
        console.log(chalk.bgRed(`The website is a parked domain. Matched keyword: ${keyword}`))
        throw new Error(`Domain parked: ${keyword}`)
      }
    }

    for (const keyword of cloudflareKeywords) {
      if (content.includes(keyword)) {
        console.log(chalk.bgRed(`The website appears to be protected by Cloudflare or similar services. Matched keyword: ${keyword}`))
        throw new Error(`Cloudflare protected or blocked: ${keyword}`)
      }
    }

    console.log(chalk.bgGreen('The website appears to be active and accessible.'))
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

  findInString(text: string) {
    // Pré-processamento do texto
    const normalizedText = text.replace(/\s+/g, '').toLowerCase()
    
    console.log(normalizedText)
    const compliances: Compliance[] = []
  
    for (const compliance of this.compliances) {
      if (normalizedText.includes(compliance.value.toLowerCase())) {
        console.log(chalk.bgBlue(`Palavra ${compliance.value} encontrada`))
        compliances.push(compliance)
      }
    }
  
    console.log(chalk.yellow(`Bet: ${this.url} ${compliances.length} strings encontradas`))
    return compliances
  }

  async getParentElementSafely(element: ElementHandle): Promise<ElementHandle<Element> | null> {
    try {
      const parent = await element.evaluateHandle((el) => {
        const parent = el.parentElement ?? el.parentNode
        return parent instanceof Element ? parent : null
      }) as ElementHandle<Element> | null

      if (parent && parent.asElement()) return parent
      return null
    } catch (error) {
      console.error('Erro ao tentar acessar o elemento pai:', error)
      return null
    }
  }
  
  
  async saveProprietiesImage(task: Task) {
    if (!this.page) throw new Error('A variável page não foi inicializada ou elementos estão vazios.')
    if (!existsSync(join(process.cwd(), 'images'))) await mkdir(join(process.cwd(), 'images'))

    const elements = await this.page.$$('*')

    const elementsWithImageOrSVG = (await Promise.all(
      elements.map(async (el) => {
        const hasChildImageOrSvg = await el.evaluate(
          (element) => {
            if (element.querySelector('img')) return 'img'
            if (element.querySelector('svg')) return 'svg'
            
            return null
          }
        )
        
        if (!hasChildImageOrSvg) return null
        console.log(chalk.bgGreen(`Elemento ${await this.getElementHierarchy(el)} contém uma imagem ou svg de interesse!`))
          
        if (hasChildImageOrSvg === 'svg') return await this.getParentElementSafely(el)
        return el
      }))).filter((el) => el !== null)
    console.log(`Elementos relevantes encontrados: ${elementsWithImageOrSVG.length}`)

    const processElement = async (element: ElementHandle<Element>) => {
      const elementKey = await this.getElementHierarchy(element)
      const distanceToTop = await this.getDistanceToTop(element)
      const isInViewport = distanceToTop <= viewport.height
      const pageDimensions = await this.getSize()
      const box = await element.boundingBox()
      if (!box || box.height === 0 || box.width === 0) return
      if (box.width > viewport.width || box.height > viewport.height) return

      const imageURl = await element.evaluate((el) => el.querySelector('img')?.src)
      const imagesProcessed = new Set<string>()

      let image: Buffer | null = null

      console.log(imageURl)
      console.log(elementKey)

      if (imagesProcessed.has(imageURl ?? elementKey)) {
        console.log(chalk.bgRed(`Imagem já processada: ${imageURl ?? elementKey}`))
        return
      }
      imagesProcessed.add(imageURl ?? elementKey)

      try {
        if (imageURl) {
          console.log(chalk.bgCyan(`Imagem detectada: ${imageURl}`))
          const response = await axios.get(imageURl, { responseType: 'arraybuffer' })
          const fileData = Buffer.from(response.data, 'binary')
  
          image = await new Screenshot(fileData).toBuffer().catch(() => null)
        } else {
          const screenshot = await element.screenshot()

          image = await new Screenshot(screenshot).toBuffer().catch(() => null)
        }
      } catch (err) {
        console.log(err)
        image = null
      }
  
      if (!image) return
      console.log(chalk.bgWhite(`Gerando Hash da Imagem: ${imageURl ?? elementKey}`))
      const hash = await imageHash(image)
      if (!hash || hash instanceof Error) { console.log(hash); return }

      const property = OCR.create()
      let dataset = await Image.findOne({ where: { hash } })
      if (!dataset) dataset = Image.create()
    
      const imagePath = join(process.cwd(), '/images/', `${hash}.png`)

      if (!dataset.hash) {
        await writeFile(imagePath, image)
        dataset.hash = hash
      }

      console.log(chalk.bgWhite('Criando componentes'))
      try {
        property.task = task
        property.isHidden = await element.evaluate((el) => {
          const style = window.getComputedStyle(el)
          return style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0'
        }, element)
        property.isVisible = await element.isVisible()
        property.isInViewport = isInViewport
        property.isIntersectingViewport = await element.evaluate((el) => {
          const rect = el.getBoundingClientRect()
          return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
          )
        }, element)
  
        property.viewport = viewport
        property.elementBox = box
  
        property.distanceToTop = distanceToTop
        property.pageDimensions = pageDimensions
        property.scrollPercentage = calculateProportion(distanceToTop, pageDimensions.height)
        property.proportionPercentage = calculateProportion(box.width, viewport.width)
      } catch(e) {
        console.log(chalk.bgRedBright(e))
        return
      }

      console.log(chalk.bgWhite('Escrevendo componente no banco de dados'))
      const write = async () => {
        try {
          await property.save().then(async (ocr) => {
            if (!dataset.ocrs) dataset.ocrs = []
            dataset.ocrs.push(ocr)
            await dataset.save()
          })

        } catch (e) {
          console.log(e)
          await write()
        }
      }

      await write()
    }

    // Executa 2 OCRs simultaneamente
    const tasks = elementsWithImageOrSVG.map((element) => processOCRLimit(() => processElement(element)))
    await Promise.all(tasks)
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
    const processedKeys = new Set()
  
    const isPropertyDuplicate = (existingProperties: Properties[], newProperty: Properties) => {
      return existingProperties.some(prop => 
        prop.elementBox.width === newProperty.elementBox.width &&
        prop.distanceToTop === newProperty.distanceToTop
      )
    }
    
    const nextChildren = async (element: ElementHandle<Element>) => {
      const childrenHandle = await element.evaluateHandle((el) => Array.from(el.children))
      const children = await childrenHandle.getProperties()
      const childElements = Array.from(children.values()) as ElementHandle<Element>[]
      const elementsChild = await this.filter(childElements)

      // Processar filhos recursivamente
      await getProps(elementsChild)
    }
    
    const getProps = async (elementsData?: ElementHandle<Element>[]) => {
      console.log(chalk.bgYellow(`Bet: ${this.url} coletando subPropriedades de ${(elementsData ?? this.elements).length} elementos`))
    
      for await (const element of (elementsData ?? this.elements)) {
        if (!element.asElement()) continue
  
        const elementKey = await this.getElementHierarchy(element)
        if (processedKeys.has(elementKey)) {
          console.log(chalk.bgRed(`Elemento duplicado em getProprieties: ${elementKey}`))
          continue
        }
    
        const text = await element.evaluate((el) => el.textContent?.trim() || '')
        if (!text || !this.compliances.some((compliance) => text.includes(compliance.value))) continue
    
        const viewport = this.page!.viewport()
        if (!viewport) continue
    
        // Verificar se o elemento possui filhos e ignorar o processamento se for o caso
        const hasChildren = await element.evaluate((el) => el.children.length > 0)
        if (hasChildren) {
          await nextChildren(element)
          continue
        }
    
        // Substituir o texto diretamente e reavaliar o boxModel
        const compliances = await this.find([element])
        const replaceValue = compliances.map((compliance) => compliance.value).join(', ')
        await element.evaluate((el, replaceValue) => (el.textContent = replaceValue), replaceValue)
    
        const updatedText = await element.evaluate((el) => el.textContent)
        if (!updatedText) continue
    
        const box = await this.getTextSize(element)
        if (!box || box.width === 0 || box.height === 0) continue
    
        // Calcular distância do topo
        const distanceToTop = await this.getDistanceToTop(element)
    
        // Processar estilo e contraste
        const { color: textColor, opacity } = await element.evaluate((el) => {
          const style = window.getComputedStyle(el)
          return {
            color: style.color || style.getPropertyValue('color'),
            opacity: parseFloat(style.opacity) || 1,
          }
        })
    
        const backgroundColor = await findBackgroundColor(element)
        const [r2, g2, b2] = parseRGB(backgroundColor, 1)
        const [r1, g1, b1] = parseRGB(textColor, opacity, [r2, g2, b2])
        const contrastRatio = calculateContrastRatio([r1, g1, b1], [r2, g2, b2])
    
        const pageDimensions = await this.getSize()
        const isInViewport = distanceToTop <= viewport.height
    
        console.log(chalk.bgRed(`Proporção: ${calculateProportion(box.width, viewport.width)}, ${box.width}, ${viewport.width}`))
    
        // Criar propriedades do elemento
        const newProperty = new Properties({
          compliances,
          contrast: contrastRatio,
          proportionPercentage: calculateProportion(box.width, viewport.width),
          scrollPercentage: calculateProportion(distanceToTop, pageDimensions.height),
          colors: {
            text: {
              value: textColor,
              color: [r1, g1, b1],
            },
            backgroundColor: {
              value: backgroundColor,
              color: [r2, g2, b2],
            },
          },
          isIntersectingViewport: await element.isIntersectingViewport(),
          isVisible: await element.isVisible(),
          isHidden: await element.isHidden(),
          hasChildNodes: hasChildren,
          isInViewport,
          elementBox: box,
          pageDimensions,
          distanceToTop,
          viewport,
        })
    
        if (!isPropertyDuplicate(Array.from(properties), newProperty)) {
          properties.add(newProperty)
          elements.add(element)
          processedKeys.add(elementKey)
          continue
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

  async getTextSize (element: ElementHandle<Element>) {
    return await element.evaluate((el) => {
      const range = document.createRange()
      const textNode = el.firstChild
  
      if (!textNode || textNode.nodeType !== Node.TEXT_NODE) {
        return null // Sem texto direto no elemento
      }
  
      // Define o range para abranger apenas o texto do elemento
      range.selectNodeContents(textNode)
  
      const rect = range.getBoundingClientRect()
      return {
        width: rect.width,
        height: rect.height,
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
      }
    })
  }

  async getDistanceToTop (element: ElementHandle<Element>) {
    return await element.evaluate((el) => {
      const rect = el.getBoundingClientRect()
      const scrollTop = window.scrollY || document.documentElement.scrollTop
      return rect.top + scrollTop
    })
  }

  async getElementHierarchy (element: ElementHandle<Element>) {
    return await element.evaluate((el) => {
      const getPath = (node: Element | null): string => {
        if (!node || node.tagName.toLowerCase() === 'html') return 'html'
  
        const parentPath = node.parentElement ? getPath(node.parentElement) : 'html'
        const tagName = node?.tagName ?? ''
        const className = node.classList?.length ? `.${Array.from(node.classList).join('.')}` : ''
        return (`${parentPath}.${tagName}${className}`.toLowerCase())
      }
  
      return getPath(el)
    })
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
    try {
      if (this.page === undefined) throw new Error('Page is undefined, try loadPage function before')
        
      if (!existsSync(dirname(path))) await mkdir(dirname(path))
      await this.page.pdf({
        format: 'A4',
        path: join(path, 'page.pdf'),
        printBackground: true,
        displayHeaderFooter: true
      })
      console.log(chalk.bgWhite('Pagina salva em PDF.'))
  
      await this.page.screenshot({ path: join(path, 'fullpage.png'), fullPage: true })
      console.log(chalk.bgWhite('Screenshot salva.'))
      
      const html = await this.page.content()
      await writeFile(join(path, 'page.html'), html)
      console.log(chalk.bgWhite('Conteúdo da pagina salva.'))
    } catch (e) {
      console.log(e)
    }
  }

  /**
   * Fecha o navegador e limpa a memória associada à instância.
   *
   * @async
   * @returns {Promise<void>}
   */
  async destroy(): Promise<void> {
    if(this.page && !this.page.isClosed()) {
      console.log(chalk.red('Closing page...'))
      await this.page.close()
    }

    console.log(chalk.red(`Bet: ${this.url} memória desalocada`))
  }

  /**
   * Desabilita a possibilidade de clicar em URLs
   * Isso irá interceptar todos os requests e aborta-los
   *
   * @private
   */
  /*
  private disableNavigation() {
    console.log(chalk.yellow(`Bet: ${this.url} navegação disabilitado`))
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
  */

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

  /*
  async getImagesOCR () {
    const imagesFiltered = new Map<string, Compliance[]>()
    const imagesHasError: string[] = []

    for (const path of this.images) {
      console.log(path)
      try {
        const request = await axios.post(
          'http://localhost:5000/ocr',
          { imagePath: path },
          { timeout: 0 }
        )

        if (request.status !== 200) {
          imagesHasError.push(path)
          continue
        }

        console.log(request.data)

        const compliances = this.findInString(request.data.result)
        if (compliances.length > 0) imagesFiltered.set(path, compliances)
      } catch (e) {
        if (e instanceof AxiosError) {
          console.log(e.response?.data)
        }
        imagesHasError.push(path)
      }
    }

    return { elements: imagesFiltered, errors: imagesHasError }

  }
  */

  // Ocultar sobreposições antes do OCR
  /*
    console.log(chalk.bgMagenta('Disabilitando popup'))
    await this.page.evaluate(() => {
      const elements = document.querySelectorAll('*')
      elements.forEach((el) => {
        if (!(el instanceof HTMLElement)) return
  
        const style = window.getComputedStyle(el)
        if (style.position === 'fixed' || style.position === 'absolute') {
          el.setAttribute('data-original-display', style.display)
          el.style.display = 'none'
        }
      })
    })
    */

  /*
    // Restaurar estilos originais
    await this.page.evaluate(() => {
      const elements = document.querySelectorAll('*[data-original-display]')
      elements.forEach((el) => {
        if (!(el instanceof HTMLElement)) return
    
        const originalDisplay = el.getAttribute('data-original-display')
        if (originalDisplay !== null) {
          el.style.display = originalDisplay
          el.removeAttribute('data-original-display')
        }
      })
    })
    */

  /*
    page.on('response', async (response) => {
      const url = response.url()
    
      function extractImageName(url: string): string {
        try {
          const decodedUrl = decodeURIComponent(url) // Decodifica os caracteres da URL
          const segments = decodedUrl.split('/') // Divide a URL em segmentos
          return segments.pop() || '' // Retorna o último segmento como o nome do arquivo
        } catch (error) {
          console.error(`Erro ao extrair o nome da imagem: ${error}`)
          return ''
        }
      }
    
      if (response.request().resourceType() === 'image') {
        const file = await response.buffer()
    
        const fileName = extractImageName(url)
        if (!fileName) {
          console.log(`Esse link não há o nome da imagem: ${url}`)
          return
        }
    
        console.log(chalk.bgBlue(`⬇️ Fazendo o Download: ${url}`))
    
        const filePath = resolve(tmpdir(), fileName)
        await writeFile(filePath, file)
        this.images.push(filePath)
      }
    })
      */
}
