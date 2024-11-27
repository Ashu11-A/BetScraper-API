import { ElementHandle } from 'puppeteer'
import chalk from 'chalk'

/**
 * Encontra a cor de fundo combinada de um elemento, considerando opacidade e hierarquia.
 */
export async function findBackgroundColor(
  element: ElementHandle
): Promise<string> {
  let currentElement: ElementHandle | null = element
  let accumulatedColor: [number, number, number, number] = [0, 0, 0, 0] // RGBA inicial

  const getParentElementSafely = async (element: ElementHandle): Promise<ElementHandle | null> => {
    return await element.evaluateHandle((el) => {
      const parent = el?.parentElement ?? el?.parentNode
      return parent instanceof Element ? parent : null
    }) as ElementHandle | null
  }
  

  while (currentElement) {
    const { backgroundColor, opacity } = await currentElement.evaluate((el) => {
      const style = window.getComputedStyle(el)
      return {
        backgroundColor: style.backgroundColor || style.getPropertyValue('background-color'),
        opacity: parseFloat(style.opacity) || 1, // Opacidade padrão 1
      }
    })
    console.log(`Processando elemento com cor: ${backgroundColor}, opacidade: ${opacity}`)

    const rgba = parseRGB(backgroundColor)
    rgba[3] *= opacity

    // Retorna a primeira cor opaca encontrada
    if (rgba[3] === 1 && !(rgba[0] === 0 && rgba[1] === 0 && rgba[2] === 0)) {
      console.log(chalk.green(`Cor opaca encontrada: rgba(${rgba.join(',')})`))
      return `rgba(${rgba.join(', ')})`
    }

    // Mistura a cor acumulada com a nova cor transparente
    if (rgba[3] > 0) {
      console.log(chalk.yellow(`Cor transparente encontrada: rgba(${rgba.join(',')})`))
      accumulatedColor = blendColorsRGBA(accumulatedColor, rgba)
    }
    console.log(chalk.cyan(`Cor acumulada: rgba(${accumulatedColor.join(',')})`))

    // Atualiza para o elemento pai
    currentElement = await getParentElementSafely(currentElement)
  }

  return `rgba(${accumulatedColor[0]}, ${accumulatedColor[1]}, ${accumulatedColor[2]}, ${accumulatedColor[3]})`
}

/**
 * Converte uma string de cor RGB ou RGBA para um array de números [r, g, b, a].
 */
export function parseRGB(color: string): [number, number, number, number] {
  const rgba = color.match(/rgba?\((\d+), (\d+), (\d+)(?:, (\d+(\.\d+)?))?\)/)

  if (!rgba) return [0, 0, 0, 0]

  const [r, g, b, a] = [Number(rgba[1]), Number(rgba[2]), Number(rgba[3]), rgba[4] ? parseFloat(rgba[4]) : 1]
  return [r, g, b, a]
}

/**
 * Mistura duas cores RGBA considerando transparência.
 */
function blendColorsRGBA(
  foregroundColor: [number, number, number, number],
  backgroundColor: [number, number, number, number]
): [number, number, number, number] {
  const [r1, g1, b1, a1] = foregroundColor
  const [r2, g2, b2, a2] = backgroundColor

  const finalAlpha = a1 + a2 * (1 - a1)

  if (finalAlpha === 0) return [0, 0, 0, 0] // Transparente total

  const blendedColor = [
    Math.round((r1 * a1 * (1 - a2) + r2 * a2) / finalAlpha), // Mistura do componente R
    Math.round((g1 * a1 * (1 - a2) + g2 * a2) / finalAlpha), // Mistura do componente G
    Math.round((b1 * a1 * (1 - a2) + b2 * a2) / finalAlpha), // Mistura do componente B
    finalAlpha, // Opacidade final
  ]

  console.log(chalk.blue(foregroundColor))
  console.log(chalk.green(backgroundColor))
  console.log(chalk.red(`Mistura de cores: rgba(${blendedColor[0]}, ${blendedColor[1]}, ${blendedColor[2]}, ${blendedColor[3]})`))

  return blendedColor as [number, number, number, number]
}
