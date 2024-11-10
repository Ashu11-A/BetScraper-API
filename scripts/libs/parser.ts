export function removeSpecialCharacters(input: string): string {
  // Expressão regular para manter apenas letras, números e espaços
  return input.replace(/[^a-zA-Z0-9 ]/g, '')
}