export function calculateProportion(sizeElement: number, sizeRef: number): number {
  if (sizeRef === 0) {
    return 0
  }
  
  return (sizeElement / sizeRef) * 100
}