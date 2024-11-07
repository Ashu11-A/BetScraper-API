import { Viewport } from 'puppeteer'

export class Properties {
  textContent: string
  /**
   * Contranste feito com base na ISO-9241-3 e ANSI-HFES-100-1988
   * 
   * @link https://www.accessibility-developer-guide.com/knowledge/colours-and-contrast/how-to-calculate/
   * @link https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html
   * @type {number}
   */
  contrast: number
  proportion: number
  scrollPercentage: number
  
  isHidden: boolean
  isVisible: boolean
  /**
   * Caso o elemento esteja na renderização inicial da pagina
   *
   * @type {boolean}
   */
  isInViewport: boolean
  hasChildNodes: boolean
  /**
   * Caso o elemento esteja escondido em alguma sub-elemento que não está visivel para o usuário.
   *
   * @type {boolean}
   */
  isIntersectingViewport: boolean
  
  color: string
  backgroundColor: string

  viewport: Viewport
  
  /**
   * Localização do elemento
   */
  distanceToTop: number
    
  constructor({
    color,
    contrast,
    viewport,
    isHidden,
    isVisible,
    isInViewport,
    proportion,
    textContent,
    distanceToTop,
    hasChildNodes,
    backgroundColor,
    scrollPercentage,
    isIntersectingViewport,
  }: Properties) {
    this.color = color
    this.contrast = contrast
    this.viewport = viewport
    this.isHidden = isHidden
    this.isVisible = isVisible
    this.proportion = proportion
    this.textContent = textContent
    this.isInViewport = isInViewport
    this.distanceToTop = distanceToTop
    this.hasChildNodes = hasChildNodes
    this.backgroundColor = backgroundColor
    this.scrollPercentage = scrollPercentage
    this.isIntersectingViewport = isIntersectingViewport
  }
}