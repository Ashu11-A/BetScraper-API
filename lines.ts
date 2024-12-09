import fs from 'fs'
import path, { dirname } from 'path'
import { glob } from 'glob'
import { fileURLToPath } from 'url'

const countLinesInFile = (filePath: string): number => {
  const content = fs.readFileSync(filePath, 'utf-8')
  return content.split('\n').length
}

const countLinesInDirectories = (directories: string[]): { file: string, lines: number }[] => {
  let filesWithLineCounts: { file: string, lines: number }[] = []
  directories.forEach(dir => {
    const tsFiles = glob.sync(`${dir}/**/*.ts`)
    tsFiles.forEach(file => {
      const lines = countLinesInFile(file)
      filesWithLineCounts.push({ file, lines })
    })
  })
  return filesWithLineCounts
}

const projectPath = dirname(fileURLToPath(import.meta.url))
const directoriesToCount = [path.join(projectPath, 'src'), path.join(projectPath, 'scripts')]

const filesWithLineCounts = countLinesInDirectories(directoriesToCount)

// Ordena os arquivos pelo número de linhas, do maior para o menor
filesWithLineCounts.sort((a, b) => b.lines - a.lines)

// Exibe o processo de busca e as linhas de cada arquivo
console.log('Arquivos encontrados e suas respectivas linhas:')
filesWithLineCounts.forEach(file => {
  console.log(`${file.file}: ${file.lines} linhas`)
})

// Soma o total de linhas
const totalLines = filesWithLineCounts.reduce((total, file) => total + file.lines, 0)

console.log(`\nTotal de linhas de código TypeScript: ${totalLines}`)
