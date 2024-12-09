import Compliance from '@/database/entity/Compliance.js'
import { Viewport } from 'puppeteer'

export class Properties {
  compliances: Compliance[]
  /**
   * Contranste feito com base na ISO-9241-3 e ANSI-HFES-100-1988
   * 
   * @link https://www.accessibility-developer-guide.com/knowledge/colours-and-contrast/how-to-calculate/
   * @link https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html
   * @type {number}
   */
  contrast?: number
  scrollPercentage: number
  proportionPercentage: number
  
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
  isIntersectingViewport?: boolean
  
  colors?: {
    text: {
      value: string
      color: [number, number, number]
    }
    backgroundColor: {
      value: string
      color: [number, number, number]
    }
  }

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
    colors,
    contrast,
    viewport,
    isHidden,
    isVisible,
    elementBox,
    compliances,
    isInViewport,
    hasChildNodes,
    distanceToTop,
    pageDimensions,
    scrollPercentage,
    proportionPercentage,
    isIntersectingViewport,
  }: Properties) {
    this.colors = colors
    this.contrast = contrast
    this.viewport = viewport
    this.isHidden = isHidden
    this.isVisible = isVisible
    this.elementBox = elementBox
    this.compliances = compliances
    this.isInViewport = isInViewport
    this.distanceToTop = distanceToTop
    this.hasChildNodes = hasChildNodes
    this.pageDimensions = pageDimensions
    this.scrollPercentage = scrollPercentage
    this.proportionPercentage = proportionPercentage
    this.isIntersectingViewport = isIntersectingViewport
  }
}