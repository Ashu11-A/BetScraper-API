import { advisementRulesKeywords, bonusKeywords, legalAgeAdvisementKeywords } from '@/shared/consts/keywords/index.js'
import { Criteria } from '@/types/evidence-criteria.interface.js'
import { existsSync } from 'fs'
import { mkdir, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import { dirname, join } from 'path'
import puppeteer, { Browser, ElementHandle, Page } from 'puppeteer'
import sharp from 'sharp'
import { createWorker } from 'tesseract.js'

const woker = await createWorker('por', 2, { gzip: true })

class Evidence {
  isVisible: boolean
  isHidden: boolean
  isIntersectingViewport: boolean
  print: Uint8Array
  grayScalePrint: Buffer
  gambleAdictAdvisement?: boolean = false
  legalAgeAdvisement?: boolean = false
  hasBonuses?: boolean = false
  hasIrregularity?: boolean = false

  constructor({ isHidden, isIntersectingViewport, isVisible, print, grayScalePrint, gambleAdictAdvisement, hasBonuses, hasIrregularity, legalAgeAdvisement }: Evidence) {
    this.isHidden = isHidden
    this.isIntersectingViewport = isIntersectingViewport
    this.isVisible = isVisible
    this.print = print
    this.grayScalePrint = grayScalePrint
    this.gambleAdictAdvisement = gambleAdictAdvisement
    this.hasBonuses = hasBonuses
    this.hasIrregularity = hasIrregularity
    this.legalAgeAdvisement = legalAgeAdvisement
  }
}

export class Scraper {
  private page?: Page
  public elements: Array<ElementHandle<Element>> = []
  public browser!: Browser

  constructor(public readonly url: string, public readonly keywords: string[]) { }

  async loadPage() {
    this.browser = await puppeteer.launch({
      headless: false,

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
        '--window-size=1366,768',
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
    //     if(!fileName.endsWith('.png')) return

    //     const filePath = resolve(__dirname, fileName)
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
    await page.setViewport({ width: 1366, height: 768, deviceScaleFactor: 1 })
    await page.goto(this.url, { waitUntil: 'networkidle2' })
    this.disableNavigation()

    return this
  }

  private disableNavigation() {
    const page = this.page
    if (page === undefined) throw new Error('Page is undefined, try loadPage function before')


    page.on('request', (req) => {
      console.log(`Request: ${req.url()}`)

      if (req.isNavigationRequest() && req.frame() === page.mainFrame()) {
        console.log('Abort')
        req.abort('aborted')
        return
      }
      req.continue()
    })
    page.setRequestInterception(true)
  }

  async closePopUp() {
    if (this.page === undefined) throw new Error('Page is undefined, try loadPage function before')

    await this.page.waitForNetworkIdle()
    await this.page.mouse.move(100, 100)
    await this.page.mouse.move(200, 200, { steps: 20 })

    // Define a posição para mover o mouse
    let moveX = 150
    let moveY = 200
    let overDiv = false

    while (overDiv) {
      const isDiv = await this.page.evaluate(({ x, y }) => {
        const element = document.elementFromPoint(x, y)
        console.log(element?.tagName)
        return element && element.tagName === 'DIV'
      }, { x: moveX, y: moveY })
      if (isDiv) overDiv = true

      moveX += 10
      moveY += 10
    }
    await this.page.mouse.click(moveX, moveY)
  }

  async scan() {
    if (this.page === undefined) throw new Error('Page is undefined, try loadPage function before')

    this.elements = await this.page.$$('*')
    return this
  }

  async filter() {
    if (this.elements.length === 0) {
      await this.page?.close()
      throw new Error('Execute scan function firt')
    }

    const filteredElements = []

    for (const element of this.elements) {
      const textContent = await element.evaluate(el => el?.textContent || '')
      const foundKeywords = this.keywords.filter(keyword => textContent.includes(keyword))

      if (foundKeywords.length > 0) filteredElements.push(element)
    }

    this.elements = filteredElements
  }

  async getScreenshotHomePage(): Promise<Uint8Array> {
    if (this.page === undefined) throw new Error('Page is undefined, try loadPage function before')

    return await this.page.screenshot()
  }

  async getScreenshots() {
    if (this.elements.length === 0) {
      await this.page?.close()
      throw new Error('variable elements is empty')
    }
    const evidences: Evidence[] = []

    for await (const element of this.elements) {
      if (element.asElement() === null) continue
      try {
        // 500 KB em bytes
        const sizeInBytes = 500 * 1024
        const image = await element.screenshot({ captureBeyondViewport: false })

        // verify this if
        if (image.byteLength > sizeInBytes) continue

        evidences.push(new Evidence({
          isHidden: await element.isHidden(),
          isIntersectingViewport: await element.isIntersectingViewport({ threshold: 1 }),
          isVisible: await element.isVisible(),
          print: image,
          grayScalePrint: await this.convertToGrayscale(image),
        }))
      } catch (err) {
        console.log(err)
      }
    }

    return evidences
  }

  async convertToGrayscale(image: Uint8Array): Promise<Buffer> {
    return sharp(image).greyscale().png().toBuffer()
  }

  async filterScreenshots(evidences: Evidence[]) {
    const filteredEvidences: Evidence[] = []

    for (const evidence of evidences) {
      try {
        // Salva o buffer como arquivo temporário
        const tempImagePath = join(tmpdir(), `temp-image-${Date.now()}.png`)
        await writeFile(tempImagePath, evidence.grayScalePrint)

        // Realiza OCR na imagem temporária
        const { data } = await woker.recognize(tempImagePath, {}, { text: true })
        const imgText = data.text
        const criterias = await this.filterBasedOnCriterias(imgText)

        if (criterias.hasIrregularity) {
          filteredEvidences.push({
            ...evidence,
            ...criterias
          })
        }

        console.log('OCR:', data.text)
        console.log(this.keywords.filter(keyword => data.text.includes(keyword)).length)
      } catch (err) {
        console.log(err)
      }
    }

    return filteredEvidences
  }

  async filterBasedOnCriterias(text: string) {
    text = text.toLowerCase()
    const reason: Criteria = {
      gambleAdictAdvisement: false,
      legalAgeAdvisement: false,
      hasBonuses: false,
      hasIrregularity: false
    }

    if (legalAgeAdvisementKeywords.some(keyword => text.includes(keyword.toLowerCase()))) {
      reason.legalAgeAdvisement = true
      reason.hasIrregularity = true
    }

    if (advisementRulesKeywords.some(keyword => text.includes(keyword.toLowerCase()))) {
      reason.gambleAdictAdvisement = true
      reason.hasIrregularity = true
    }

    if (bonusKeywords.some(keyword => text.includes(keyword.toLowerCase()))) {
      reason.hasBonuses = true
      reason.hasIrregularity = true
    }

    return reason
  }

  async savePageContent(path: string) {
    if (this.page === undefined) throw new Error('Page is undefined, try loadPage function before')

    const content = await this.page.content()
    const filename = 'page.html'
  
    if (!existsSync(dirname(path))) await mkdir(dirname(path))
    await writeFile(join(path, filename), content)
  }
}
