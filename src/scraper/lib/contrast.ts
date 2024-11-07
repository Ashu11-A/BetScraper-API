function calculateLuminance(red: number, green: number, blue: number): number {
  const [normalizedRed, normalizedGreen, normalizedBlue] = [red, green, blue].map((colorValue) => {
    const normalizedValue = colorValue / 255
    return normalizedValue <= 0.03928
      ? normalizedValue / 12.92
      : Math.pow((normalizedValue + 0.055) / 1.055, 2.4)
  })
    
  return 0.2126 * normalizedRed + 0.7152 * normalizedGreen + 0.0722 * normalizedBlue
}
    
export function calculateContrastRatio(
  color1: [number, number, number],
  color2: [number, number, number]
): number {
  const luminanceColor1 = calculateLuminance(color1[0], color1[1], color1[2])
  const luminanceColor2 = calculateLuminance(color2[0], color2[1], color2[2])
    
  const [higherLuminance, lowerLuminance] = [luminanceColor1, luminanceColor2].sort(
    (a, b) => b - a
  ) // Ordena para garantir que higherLuminance seja maior
    
  return (higherLuminance + 0.05) / (lowerLuminance + 0.05)
}
    
export function isContrastCompliant(
  contrastRatio: number,
  textType: 'normal' | 'large',
  complianceLevel: 'AA' | 'AAA'
): boolean {
  if (complianceLevel === 'AA') {
    if (textType === 'normal') {
      return contrastRatio >= 4.5
    } else if (textType === 'large') {
      return contrastRatio >= 3
    }
  } else if (complianceLevel === 'AAA') {
    if (textType === 'normal') {
      return contrastRatio >= 7
    } else if (textType === 'large') {
      return contrastRatio >= 4.5
    }
  }
  return false
}
    