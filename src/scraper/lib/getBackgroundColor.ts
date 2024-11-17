import { ElementHandle } from 'puppeteer'
import chalk from 'chalk'

export async function findBackgroundColor(element: ElementHandle): Promise<string> {
  let currentElement = element
  let accumulatedColor = [0, 0, 0, 0] // Representa RGBA, iniciando como transparente

  console.log(chalk.blue('Iniciando a busca pela cor de fundo...'))

  while (currentElement) {
    const isElement = await currentElement.evaluate((el) => el instanceof Element)
    if (!isElement) break

    const backgroundColor = await currentElement.evaluate((el) => {
      const style = window.getComputedStyle(el)
      return style.backgroundColor
    })

    const rgba = parseRGB(backgroundColor)

    if (rgba[3] === 1 && !(rgba[0] === 0 && rgba[1] === 0 && rgba[2] === 0)) {
      // Cor completamente opaca e não é totalmente transparente preta
      console.log(chalk.green(`Cor opaca encontrada: rgba(${rgba[0]}, ${rgba[1]}, ${rgba[2]}, ${rgba[3]})`))
      return `rgba(${rgba[0]}, ${rgba[1]}, ${rgba[2]}, ${rgba[3]})`
    } else if (rgba[3] > 0) {
      // Cor parcialmente transparente, acumula a mistura
      console.log(chalk.yellow(`Cor transparente encontrada: rgba(${rgba[0]}, ${rgba[1]}, ${rgba[2]}, ${rgba[3]})`))
      accumulatedColor = blendColorsRGBA([accumulatedColor[0], accumulatedColor[1], accumulatedColor[2], accumulatedColor[3]], rgba)
    }

    currentElement = await currentElement.evaluateHandle((el) => el.parentElement) as ElementHandle
    console.log(chalk.cyan(`[${accumulatedColor.join(', ')}] Subindo para o elemento pai...`))
  }

  console.log(chalk.green(`Cor final encontrada após combinar com os elementos anteriores: rgba(${accumulatedColor[0]}, ${accumulatedColor[1]}, ${accumulatedColor[2]}, ${accumulatedColor[3]})`))
  return `rgba(${accumulatedColor[0]}, ${accumulatedColor[1]}, ${accumulatedColor[2]}, ${accumulatedColor[3]})`
}

// Função auxiliar para verificar e corrigir o parse de cores
export function parseRGB(color: string): [number, number, number, number] {
  const rgba = color.match(/rgba?\((\d+), (\d+), (\d+)(?:, (\d+(\.\d+)?))?\)/)
  if (!rgba) return [0, 0, 0, 0] // Retorna transparente por padrão se não puder ser analisado corretamente
  const [r, g, b, a] = [Number(rgba[1]), Number(rgba[2]), Number(rgba[3]), rgba[4] ? parseFloat(rgba[4]) : 1]
  return [r, g, b, a]
}


// Função para calcular a mistura de cores RGBA considerando a transparência
function blendColorsRGBA(foregroundColor: [number, number, number, number], backgroundColor: [number, number, number, number]): [number, number, number, number] {
  const [r1, g1, b1, a1] = foregroundColor // Cor da frente (com alpha)
  const [r2, g2, b2, a2] = backgroundColor // Cor de fundo (com alpha)

  // Calcula o alpha final
  const finalAlpha = a1 + a2 * (1 - a1)

  // Se a opacidade final for 0, retorna transparente
  if (finalAlpha === 0) return [0, 0, 0, 0]

  // Calcula as cores finais (R, G, B) levando em consideração as opacidades
  const blendedColor = [
    Math.round((r1 * a1 * (1 - a2) + r2 * a2) / finalAlpha), // Mistura do componente R
    Math.round((g1 * a1 * (1 - a2) + g2 * a2) / finalAlpha), // Mistura do componente G
    Math.round((b1 * a1 * (1 - a2) + b2 * a2) / finalAlpha), // Mistura do componente B
    finalAlpha, // Opacidade final
  ]

  console.log(chalk.blue(foregroundColor))
  console.log(chalk.green(backgroundColor))
  console.log(chalk.red(`Mistura de cores: rgba(${blendedColor[0]}, ${blendedColor[1]}, ${blendedColor[2]}, ${blendedColor[3]})`))

  // Retorna a cor final misturada no formato RGBA
  return [blendedColor[0], blendedColor[1], blendedColor[2], blendedColor[3]]
}