export function normalizeText<T extends string | string[] | undefined>(text: T): T {
  if (!text) return text

  function normalize(text: string) {
    return text.normalize('NFD') // Remove diacríticos
      .replace(/[\u0300-\u036f]/g, '') // Remove os acentos
      .replace(/\s+/g, ' ') // Substitui múltiplos espaços por um único espaço
      .trim() // Remove espaços no início e no fim
      .toLowerCase() as T // Converte para minúsculas
  }

  return Array.isArray(text)
    ? text.map((value) => normalize(value)) as unknown as T
    : normalize(text)
    
}