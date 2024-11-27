import chalk from 'chalk'

export function rgbaToRgb(
  rgba: [number, number, number, number?],
  bgColor: [number, number, number] = [255, 255, 255] // Fundo padrão: branco
): [number, number, number] {
  const [srcR, srcG, srcB, alpha = 1] = rgba
  const [bgR, bgG, bgB] = bgColor

  if (alpha === 0) return bgColor

  // Calcula a cor resultante levando em conta a transparência
  const red = Math.round((1 - alpha) * bgR + (alpha * srcR))
  const green = Math.round((1 - alpha) * bgG + (alpha * srcG))
  const blue = Math.round((1 - alpha) * bgB + (alpha * srcB))

  return [red, green, blue]
}

export function parseRGB(
  colorString: string,
  opacity: number = 1,
  bgColor: [number, number, number] = [255, 255, 255] // Fundo padrão
): [number, number, number] {
  // Expressão regular para corresponder a RGB ou RGBA
  const rgbMatch = colorString.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(\.\d+)?))?\)$/)

  if (rgbMatch) {
    // Converte os valores capturados em números
    const [r, g, b] = [1, 2, 3].map((i) => parseInt(rgbMatch[i], 10))
    const alpha = rgbMatch[4] ? parseFloat(rgbMatch[4]) : 1 // Pega alpha, ou assume 1 se não presente

    // Ajusta o alpha com base na opacidade do elemento
    const effectiveAlpha = alpha * opacity

    // Se for RGBA, converte para RGB usando a cor de fundo
    if (effectiveAlpha < 1) {
      console.log(chalk.bgWhite(`Cor tansparente ${colorString} ${bgColor}`))
      return rgbaToRgb([r, g, b, effectiveAlpha], bgColor)
    } else {
      // Caso seja apenas RGB, retorna diretamente
      return [r, g, b]
    }
  }

  console.error('Cor inválida fornecida. Retornando preto.')
  return [0, 0, 0] // Retorna preto se não for um valor válido
}