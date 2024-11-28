import Compliance from '@/database/entity/Compliance.js'
import { Viewport } from 'puppeteer'

export class OCRs {
  compliances: Compliance[]
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
  elementBox: {
      width: number;
      height: number;
      top: number;
      left: number;
  }
  pageDimensions: {
    width: number;
    height: number;
  }
    
  constructor({
    isHidden,
    viewport,
    isVisible,
    elementBox,
    compliances,
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
    this.compliances = compliances
    this.isInViewport = isInViewport
    this.distanceToTop = distanceToTop
    this.pageDimensions = pageDimensions
    this.scrollPercentage = scrollPercentage
    this.proportionPercentage = proportionPercentage
    this.isIntersectingViewport = isIntersectingViewport
  }
}