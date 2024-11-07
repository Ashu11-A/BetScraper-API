// Função para converter string RGB para array de números [r, g, b]
export function parseRGB(rgbString: string): [number, number, number] {
  const match = rgbString.match(/\d+/g)
  return match ? [parseInt(match[0]), parseInt(match[1]), parseInt(match[2])] : [0, 0, 0]
}