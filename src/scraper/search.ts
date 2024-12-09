import Compliance from '@/database/entity/Compliance.js'
import { Image } from '@/database/entity/Image.js'
import { OCR } from '@/database/entity/OCR.js'
import { Task } from '@/database/entity/Task.js'
import { calculateContrastRatio } from '@/scraper/lib/contrast.js'
import { calculateProportion } from '@/scraper/lib/proportion.js'
import { parseRGB } from '@/scraper/lib/rgb.js'
import { cloudflareKeywords } from '@/shared/consts/keywords/cloudflare.js'
import { parkingKeywords } from '@/shared/consts/keywords/parking.js'
import axios, { AxiosError } from 'axios'
import chalk from 'chalk'
import { existsSync } from 'fs'
import { mkdir, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import pLimit from 'p-limit'
import { dirname, join } from 'path'
import puppeteer, { Browser, ElementHandle, HTTPResponse, Page, PuppeteerError } from 'puppeteer'
import { Criteria } from './criteria.js'
import { findBackgroundColor } from './lib/getBackgroundColor.js'
import { sha256 } from './lib/hash.js'
import { Properties } from './properties.js'
import { Screenshot } from './screenshots.js'
import { LRUCache } from 'lru-cache'
import { normalizeText } from './lib/normalizer.js'

const processLimit = pLimit(10)

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

  private imagesCache = new LRUCache({
    max: 1024, // Limite de itens no cache
    maxSize: 1024 * 1024 * 1024, // Limite em MB
    sizeCalculation: (value: Buffer) => value.length,
    ttl: 1000 * 60 * 10 // 10 minutos
  })

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
      headless: false,
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
    this.saveImagesInCache()
    // this.page.on('load', () => console.log('Página carregada.'))
    // this.page.on('error', (err) => console.error('Erro na página:', err))
    // this.page.on('framenavigated', (frame) => console.log('Frame navegou:', frame.url()))
    try {
      const response = await this.page.goto(this.url, { waitUntil: 'networkidle0', timeout: 60_000,  })
      await this.checkWebsiteStatus(response)
    } catch (error) {
      console.log(error)

      if (error instanceof PuppeteerError || error instanceof Error) {
        if (error.message.includes('Navigation timeout') || error.name == 'TimeoutError') return this
        throw new Error(error?.message ?? error?.name)
      }
      throw new Error(String(error))
    }
    // this.disableNavigation()

    return this
  }

  private saveImagesInCache () {
    this.page!.on('response', async (response) => {
      try {
        const url = response.url()
        if (this.imagesCache.has(url)) return
    
        if (response.request().resourceType() === 'image') {
          const buffer = await response.buffer()
    
          this.imagesCache.set(url, buffer)
        }
      } catch (err) {
        console.error(chalk.bgRed(`Erro ao salvar imagem no cache: ${response?.url()}`, err))
      }
    })
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
  async find(elements?: ElementHandle<Element>[]): Promise<{
    type: 'text' | 'attributes';
    compliance: Compliance;
}[]> {
    elements = elements ?? this.elements
    const compliances: {type: 'text' | 'attributes', compliance: Compliance}[] = []

    
    await Promise.all(
      elements.map(async (element) => {
        const text = normalizeText(await this.page!.evaluate(el => el.textContent, element) ?? undefined)
        const attributes = (await this.page!.evaluate(
          el => Array.from(el.attributes).map(attr => attr.value),
          element
        )).map((values) => normalizeText(values))
        
        for (const compliance of this.compliances) {
          if (
            (text && text.includes(normalizeText(compliance.value)))
            || attributes.some(attr => attr.includes(normalizeText(compliance.value)))
          ) {
            console.log(chalk.bgBlue(`Palavra ${compliance.value} encontrada`))
            compliances.push({
              type: text ? 'text' : 'attributes',
              compliance: compliance
            })
          }
        }
      })
    )

    if (compliances.length > 0) console.log(chalk.yellow(`Bet: ${this.url} ${compliances.length} strings encontradas`))
    return compliances
  }

  async filterElementsByText(searchStrings: string[]): Promise<ElementHandle<Element>[]> {
    const filteredElements: ElementHandle<Element>[] = []
  
    for (const element of this.elements) {
      // Avaliar o texto e os atributos do elemento atual
      const textContent = normalizeText(await this.page!.evaluate(el => el.textContent, element) ?? undefined)
      const attributes = (await this.page!.evaluate(
        el => Array.from(el.attributes).map(attr => attr.value),
        element
      )).map((value) => normalizeText(value))
  
      const matches = searchStrings.some(
        str =>
          (textContent && normalizeText(textContent).includes(normalizeText(str))) ||
          attributes.some(attr => attr.includes(normalizeText(str)))
      )
  
      // Se não há correspondência, continuar para o próximo elemento
      if (!matches) continue
  
      // Verificar se este elemento é redundante (ou seja, se é coberto por um filho)
      const isCoveredByChild = await this.page!.evaluate(
        (el, searchStrings) =>
          Array.from(el.querySelectorAll('*')).some((child) => {
            function normalizeText<T extends string | undefined>(text: T): T {
              if (!text) return text
          
              return text
                .normalize('NFD') // Remove diacríticos
                .replace(/[\u0300-\u036f]/g, '') // Remove os acentos
                .replace(/\s+/g, ' ') // Substitui múltiplos espaços por um único espaço
                .trim() // Remove espaços no início e no fim
                .toLowerCase() as T // Converte para minúsculas
            }
            return searchStrings.some(str =>
              normalizeText(child.textContent ?? undefined)?.includes(str) ||
              Array.from(child.attributes).some(attr => normalizeText(attr.value).includes(str))
            )
          }
          ),
        element,
        searchStrings.map((value) => normalizeText(value))
      )
  
      if (!isCoveredByChild) {
        filteredElements.push(element)
      }
    }
  
    return filteredElements
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
        return el.parentElement ?? el.parentNode
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
        
    const imagesProcessed = new Set<string>()
    const svgElements = await this.page.$$('svg')
    const imgElements = await this.page.$$('img')

    const svgs = (
      (await Promise.all(
        svgElements.map(async (element) => {
          const parent = await this.getParentElementSafely(element)
          if (!parent) return

          return ({
            type: 'svg',
            element: parent,
          } as const)
        })
      )).filter((e) => e !== undefined)
    )
    

    const images = [
      ...imgElements.map((element) => ({
        type: 'img',
        element
      } as const)),
      ...svgs
    ]
    console.log(`Elementos relevantes encontrados: ${images.length}`)

    const processElement = async (element: ElementHandle<Element> | ElementHandle<HTMLImageElement>) => {
      const elementKey = await this.getElementHierarchy(element)
      const imageURL = await (element as ElementHandle<HTMLImageElement>).evaluate((el) => el?.src)

      const box = await this.getElementDimensions(element)
      if (!box || box.height === 0 || box.width === 0) {
        console.log(chalk.bgRed(`[saveProprietiesImage]: box is null, image: ${imageURL ?? elementKey}`, JSON.stringify(box, null, 2)))
        return
      }
      if (box.width > viewport.width || box.height > viewport.height) {
        console.log(chalk.bgRed(`[saveProprietiesImage]: box é maior que a tela, (image: ${imageURL ?? elementKey}) (width: ${box.width}, height: ${box.height}, viewport: (${viewport.width}x${viewport.height}))`, JSON.stringify(box, null, 2)))
        return
      }

      const distanceToTop = await this.getDistanceToTop(element)
      const isInViewport = distanceToTop <= viewport.height
      const pageDimensions = await this.getViewport()
      let image: Buffer | null = null
      
      if (imagesProcessed.has(imageURL ?? elementKey)) {
        console.log(chalk.bgRed(`Imagem já processada: ${imageURL ?? elementKey}`))
        return
      }
      imagesProcessed.add(imageURL ?? elementKey)

      try {
        if (imageURL) {
          console.log(chalk.bgCyan(`Imagem detectada: ${imageURL}`))

          let fileData =  this.imagesCache.get(imageURL)
          if (!fileData) {
            const response = await axios.get(imageURL, { responseType: 'arraybuffer' })
            fileData = Buffer.from(response.data, 'binary')
            this.imagesCache.set(imageURL, fileData)
          }

          image = await new Screenshot(fileData).toBuffer().catch(() => null)
        } else {
          const svgContent = await (element as ElementHandle<SVGSVGElement>).evaluate((el) =>
            el.tagName.toLowerCase() === 'svg' ? el.outerHTML : null
          )

          const screenshot = svgContent ?? await element.screenshot()
          image = await new Screenshot(screenshot).toBuffer().catch(() => null)
        }
      } catch (err) {
        console.log(err)
        image = null
      }
  
      if (!image) return
      console.log(chalk.bgGreen(`Gerando Hash da Imagem: ${imageURL ?? elementKey}`))
      const hash = sha256(image)
      if (!hash) { console.log(hash); return }

      const property = OCR.create()
      let dataset = await Image.findOne({ where: { hash } })
      if (!dataset) {
        dataset = Image.create()
      } else {
        console.log(chalk.bgBlue(`Imagem já foi processada anteriormente: ${imageURL ?? elementKey}`))
      }
    
      const imagePath = join(process.cwd(), '/images/', `${hash}.png`)
      if (!existsSync(imagePath)) await writeFile(imagePath, image)

      if (!dataset.hash) {
        dataset.hash = hash
        await dataset.save()
      }

      try {
        property.task = task
        property.isHidden = await element.isHidden()
        property.isVisible = await element.isVisible()
        property.isInViewport = isInViewport
        property.isIntersectingViewport = await element.isIntersectingViewport()
  
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

    const tasks = images.map(({ element }) => processLimit(() => processElement(element)))
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
    
    const getProps = async (elementsData?: ElementHandle<Element>[]) => {
      console.log(chalk.bgYellow(`Bet: ${this.url} coletando subPropriedades de ${(elementsData ?? this.elements).length} elementos`))
    
      for await (const element of (elementsData ?? this.elements)) {
        if (!element.asElement()) continue
  
        const elementKey = await this.getElementHierarchy(element)
        if (processedKeys.has(elementKey)) {
          console.log(chalk.bgRed(`Elemento duplicado em getProprieties: ${elementKey}`))
          continue
        }
    
        const viewport = this.page!.viewport()
        if (!viewport) {
          console.log(chalk.bgRed('viewport é null!'))
          continue
        }
    
        // Substituir o texto diretamente e reavaliar o boxModel
        const compliances = await this.find([element])
        if (compliances.length === 0) continue
      
        const hasCompliancesInAttributes = compliances.some((data) => data.type === 'attributes')
        let box: Properties['elementBox'] | undefined = undefined
        let contrastRatio: number | undefined = undefined
        let colors: Properties['colors'] | undefined = undefined
      
        /**
         * Elementos que tenham attributes, são elementos que foram identificadas as palavras chaves em seus atributos
         * e não devem ser passados para textContent
         */
        if (!hasCompliancesInAttributes) {
          const replaceValue = compliances.map((data) => data.compliance.value).join(', ')
          await element.evaluate((el, replaceValue) => (el.textContent = replaceValue), replaceValue)
          await element.evaluate((el) => el.textContent)

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

          box = await this.getTextDimensions(element) ?? undefined
          contrastRatio = calculateContrastRatio([r1, g1, b1], [r2, g2, b2])
          colors = {
            text: {
              value: textColor,
              color: [r1, g1, b1],
            },
            backgroundColor: {
              value: backgroundColor,
              color: [r2, g2, b2],
            },
          }
        } else {
          box = await this.getElementDimensions(element)
        }
        if (!box || box.width === 0 || box.height === 0) {
          console.log(chalk.bgRed('Tamanho da box é 0!', JSON.stringify(box, null, 2)))
          continue
        }

    
        // Calcular distância do topo
        const distanceToTop = await this.getDistanceToTop(element)
        const hasChildren = await element.evaluate((el) => el.children.length > 0)
    
        const pageDimensions = await this.getViewport()
        const isInViewport = distanceToTop <= viewport.height
    
        // Criar propriedades do elemento
        const newProperty = new Properties({
          compliances: compliances.map((data) => data.compliance),
          contrast: contrastRatio,
          proportionPercentage: calculateProportion(box.width, viewport.width),
          scrollPercentage: calculateProportion(distanceToTop, pageDimensions.height),
          colors,
          isIntersectingViewport: await element.isIntersectingViewport().catch(() => undefined),
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

    const filteredElements = Array.from((await this.filterElementsByText(this.compliances.map((compliance) => compliance.value))).values())
    console.log(chalk.bgMagenta(`Elementos HTML encontrados: ${filteredElements.length}`))
    await getProps(filteredElements)

    return {
      properties: Array.from(properties),
      elements: Array.from(elements)
    }
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
  async getViewport (): Promise<{
    width: number,
    height: number
  }> {
    const elements = await this.page!.$$('*') ?? []
    let height = 0

    const width = await this.page!.evaluate(() => Math.max(
      document?.body?.scrollWidth,
      document?.documentElement?.scrollWidth,
      document?.body?.offsetWidth,
      document?.documentElement?.offsetWidth,
      document?.documentElement?.clientWidth
    ))

    for (const element of elements) {
      const pageDimensions = await element.evaluate((el) => {
        const height = Math.max(
          document?.body?.scrollHeight,
          document?.documentElement?.scrollHeight,
          document?.body?.offsetHeight,
          document?.documentElement?.offsetHeight,
          document?.documentElement?.clientHeight,
          el?.scrollHeight,
          el?.clientHeight
        )
      
        return { height }
      })

      if (pageDimensions.height > height) height = pageDimensions.height
    }
    return { width, height }
  }

  async getDistanceToTop (element: ElementHandle<Element>) {
    return await element.evaluate((el) => {
      const rect = el.getBoundingClientRect()
      const scrollTop = window.scrollY || document.documentElement.scrollTop
      return rect.top + scrollTop
    })
  }

  async getElementDimensions(element: ElementHandle<Element>) {
    const boundingBox = await element.boundingBox()
  
    const boxWidth = boundingBox?.width || null
    const boxHeight = boundingBox?.height || null
  
    return await element.evaluate((el, { boxWidth, boxHeight }) => {
      const rect = el.getBoundingClientRect()
  
      let width = boxWidth && boxWidth !== 0 ? boxWidth : rect.width
      let height = boxHeight && boxHeight !== 0 ? boxHeight : rect.height
  
      // Para imagens
      if (el instanceof HTMLImageElement) {
        if (width === 0) width = el.naturalWidth
        if (height === 0) height = el.naturalHeight
      }

      // Para SVGs
      if (el instanceof SVGGraphicsElement || typeof (el as SVGGraphicsElement)?.getBBox === 'function') {
        const bbox = (el as SVGGraphicsElement).getBBox()
        if (width === 0) width = bbox.width
        if (height === 0) height = bbox.height
      }
  
      // Fallbacks adicionais
      if (width === 0 && el?.scrollWidth !== null) width = el.scrollWidth
      if (height === 0 && el?.scrollHeight !== null) height = el.scrollHeight
  
      return {
        width,
        height,
        top: rect.top + window.scrollY, // Considera o deslocamento do scroll
        left: rect.left + window.scrollX, // Considera o deslocamento do scroll
      }
    }, { boxWidth, boxHeight })
  }
  
  

  async getTextDimensions (element: ElementHandle<Element>) {
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
        const request = await axios.post(
          'http://localhost:5000/ocr',
          { imagePath: tempImagePath },
          { timeout: 0 }
        )
        const text = request.data.result as string[]

        const criterias = new Criteria({}).setCriterias(text)
        if (criterias.hasIrregularity) filteredScreenshot.set(Number(index), new Screenshot(screenshot.image))

        const countKeywords = this.compliances.filter((compliance) => normalizeText(text).includes(normalizeText(compliance.value))).length
        console.log(chalk.red(`${countKeywords} palavras/frases foram encontradas na pagina: ${this.url}`))
      } catch (err) {
        if (err instanceof AxiosError) {
          if (String(err?.response?.data?.error).includes('Nenhum texto detectado na imagem.')) {
            console.log(chalk.bgGreen('Nenhum texto detectado na imagem.'))
          }
        }
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
    console.log(chalk.red('browser page...'))
    await this.browser.close()
    this.imagesCache.clear()

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
}
