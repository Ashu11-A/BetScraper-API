import { ElementHandle } from 'puppeteer'
import chalk from 'chalk'

export async function findBackgroundColor(element: ElementHandle): Promise<string> {
  let currentElement = element
  let accumulatedColor = [0, 0, 0, 0] // Representa RGBA, acumulando a transparência

  console.log(chalk.blue('Iniciando a busca pela cor de fundo...'))

  while (currentElement) {
    // Verifica se currentElement é um elemento do tipo `Element`
    const isElement = await currentElement.evaluate((el) => el instanceof Element)
    if (!isElement) break // Se não for um `Element`, sai do loop

    const backgroundColor = await currentElement.evaluate((el) => {
      const style = window.getComputedStyle(el)
      return style.backgroundColor
    })
    
    // Converte a cor de fundo para RGBA para manipular a transparência
    const rgba = parseRGB(backgroundColor)
    if (rgba[3] === 1) {
      // Cor completamente opaca, pode retornar
      console.log(chalk.green(`Cor opaca encontrada: rgba(${rgba[0]}, ${rgba[1]}, ${rgba[2]}, ${rgba[3]})`))
      return `rgba(${rgba[0]}, ${rgba[1]}, ${rgba[2]}, ${rgba[3]})`
    } else {
      // Cor parcialmente transparente, acumula para uma mistura
      console.log(chalk.yellow(`Cor transparente encontrada: rgba(${rgba[0]}, ${rgba[1]}, ${rgba[2]}, ${rgba[3]})`))
      accumulatedColor = blendColorsRGBA([accumulatedColor[0], accumulatedColor[1], accumulatedColor[2], accumulatedColor[3]], rgba)
    }
    // Move para o elemento pai
    currentElement = await currentElement.evaluateHandle((el) => el.parentElement) as ElementHandle
    console.log(chalk.cyan('Subindo para o elemento pai...'))
  }

  console.log(chalk.green(`Cor final encontrada após combinar com os elementos anteriores: rgba(${accumulatedColor[0]}, ${accumulatedColor[1]}, ${accumulatedColor[2]}, ${accumulatedColor[3]})`))
  return `rgba(${accumulatedColor[0]}, ${accumulatedColor[1]}, ${accumulatedColor[2]}, ${accumulatedColor[3]})`
}

// Função auxiliar para converter a cor em RGBA
function parseRGB(color: string): [number, number, number, number] {
  const rgba = color.match(/rgba?\((\d+), (\d+), (\d+)(?:, (\d+(\.\d+)?))?\)/)
  if (!rgba) return [0, 0, 0, 1] // Cor padrão preta opaca
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