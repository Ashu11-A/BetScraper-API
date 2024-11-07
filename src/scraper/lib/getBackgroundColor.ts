import { ElementHandle } from 'puppeteer'

export async function findBackgroundColor(element: ElementHandle): Promise<string> {
  let currentElement = element
  
  while (currentElement) {
    // Verifica se currentElement é um elemento do tipo `Element`
    const isElement = await currentElement.evaluate((el) => el instanceof Element)
    if (!isElement) break // Se não for um `Element`, sai do loop
  
    const backgroundColor = await currentElement.evaluate((el) => {
      const style = window.getComputedStyle(el)
      return style.backgroundColor
    })
  
    if (
      backgroundColor &&
        !/rgba\(0, 0, 0, 0\)/g.test(backgroundColor) &&
        backgroundColor !== 'transparent'
    ) {
      return backgroundColor
    }
  
    // Move para o elemento pai
    currentElement = await currentElement.getProperty('parentNode') as ElementHandle
  }
  return 'rgb(0, 0, 0)'
}