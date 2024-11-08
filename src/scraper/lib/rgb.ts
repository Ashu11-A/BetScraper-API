export function rgbaToRgb(
  rgba: [number, number, number, number?],
  bgColor: [number, number, number] = [255, 255, 255] // Fundo padrão: branco
): [number, number, number] {
  const [srcR, srcG, srcB, alpha = 1] = rgba
  const [bgR, bgG, bgB] = bgColor

  if (alpha === 0) return bgColor

  const red = Math.round((1 - alpha) * bgR + (alpha * srcR))
  const green = Math.round((1 - alpha) * bgG + (alpha * srcG))
  const blue = Math.round((1 - alpha) * bgB + (alpha * srcB))

  return [red, green, blue]
}

// Função para interpretar strings RGB ou RGBA e retornar um array RGB.
export function parseRGB(
  colorString: string,
  bgColor: [number, number, number] = [255, 255, 255] // Fundo padrão
): [number, number, number] {
  const match = colorString.match(/\d+/g)

  if (match) {
    const [r, g, b, alpha] = match.map(Number)

    if (alpha !== undefined) {
      // Converte RGBA para RGB usando a cor de fundo especificada
      return rgbaToRgb([r, g, b, alpha / 255], bgColor)
    } else {
      // Retorna diretamente os valores RGB
      return [r, g, b]
    }
  }

  return [0, 0, 0]
}
