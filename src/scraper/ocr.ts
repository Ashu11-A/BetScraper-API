import { BoundingBox, Viewport } from 'puppeteer'

export class OCRs {
  scrollPercentage: number
  proportionPercentage: number
  /**
   * Caso o elemento esteja na renderização inicial da pagina
   *
   * @type {boolean}
   */
  isInViewport: boolean
  isHidden: boolean
  isVisible: boolean
  /**
   * Caso o elemento esteja escondido em alguma sub-elemento que não está visivel para o usuário.
   *
   * @type {boolean}
   */
  isIntersectingViewport: boolean
  
  viewport: Viewport
  /**
   * Localização do elemento
   */
  distanceToTop: number
  elementBox: BoundingBox
  pageDimensions: {
    width: number;
    height: number;
  }
    
  constructor({
    isHidden,
    viewport,
    isVisible,
    elementBox,
    isInViewport,
    distanceToTop,
    pageDimensions,
    scrollPercentage,
    proportionPercentage,
    isIntersectingViewport,
  }: OCRs) {
    this.isHidden = isHidden
    this.viewport = viewport
    this.isVisible = isVisible
    this.elementBox = elementBox
    this.isInViewport = isInViewport
    this.distanceToTop = distanceToTop
    this.pageDimensions = pageDimensions
    this.scrollPercentage = scrollPercentage
    this.proportionPercentage = proportionPercentage
    this.isIntersectingViewport = isIntersectingViewport
  }
}