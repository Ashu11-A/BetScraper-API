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
    viewport,
    elementBox,
    compliances,
    isInViewport,
    distanceToTop,
    pageDimensions,
    scrollPercentage,
    proportionPercentage,
  }: OCRs) {
    this.viewport = viewport
    this.elementBox = elementBox
    this.compliances = compliances
    this.isInViewport = isInViewport
    this.distanceToTop = distanceToTop
    this.pageDimensions = pageDimensions
    this.scrollPercentage = scrollPercentage
    this.proportionPercentage = proportionPercentage
  }
}