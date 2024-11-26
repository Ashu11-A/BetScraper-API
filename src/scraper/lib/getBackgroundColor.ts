import { ElementHandle } from 'puppeteer'
import chalk from 'chalk'

export async function resolveCssVariable(element: ElementHandle, variableName: string): Promise<string | null> {
  const resolvedValue = await element.evaluate((el, variable) => {
    let currentElement = el
    while (currentElement) {
      const style = window.getComputedStyle(currentElement)
      const value = style.getPropertyValue(variable)?.trim()
      if (value) return value // Retorna o valor da variável se encontrada
      currentElement = currentElement.parentElement as Element // Sobe na hierarquia
    }
    return null // Se não for encontrado, retorna null
  }, variableName)

  return resolvedValue
}

export async function findBackgroundColor(element: ElementHandle): Promise<string> {
  let currentElement = element
  let accumulatedColor = [0, 0, 0, 0] // Representa RGBA

  while (currentElement) {
    const elementDetails = await currentElement.evaluate((el) => {
      const tag = el.tagName.toLowerCase()
      const id = el.id ? `#${el.id}` : ''
      const classes = el.className ? `.${el.className.split(' ').join('.')}` : ''
      return `${tag}${id}${classes}`
    })

    const { backgroundColor, opacity } = await currentElement.evaluate((el) => {
      const style = window.getComputedStyle(el)
      return {
        backgroundColor: style.backgroundColor || style.getPropertyValue('background-color'),
        opacity: parseFloat(style.opacity) || 1 // Obtém o valor de opacity (1 por padrão)
      }
    })
    console.log(`Processando elemento: ${elementDetails} com cor: ${backgroundColor}, opacidade: ${opacity}`)

    const rgba = parseRGB(backgroundColor)
    rgba[3] *= opacity

    if (rgba[3] === 1 && !(rgba[0] === 0 && rgba[1] === 0 && rgba[2] === 0)) {
      console.log(chalk.green(`Cor opaca encontrada: rgba(${rgba[0]}, ${rgba[1]}, ${rgba[2]}, ${rgba[3]})`))
      return `rgba(${rgba[0]}, ${rgba[1]}, ${rgba[2]}, ${rgba[3]})`
    } else if (rgba[3] > 0) {
      console.log(chalk.yellow(`Cor transparente encontrada: rgba(${rgba[0]}, ${rgba[1]}, ${rgba[2]}, ${rgba[3]})`))
      accumulatedColor = blendColorsRGBA([accumulatedColor[0], accumulatedColor[1], accumulatedColor[2], accumulatedColor[3]], rgba)
    }
    console.log(chalk.cyan(`[${accumulatedColor.join(', ')}] Subindo para o elemento pai...`))
    currentElement = await currentElement.evaluateHandle((el) => el.parentElement) as ElementHandle
  }

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