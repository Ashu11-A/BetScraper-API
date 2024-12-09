import Database from '@/database/dataSource.js'
import { Image } from '@/database/entity/Image.js'
import { imageRepository } from '@/database/index.js'
import chalk from 'chalk'
import pLimit from 'p-limit'


await Database.initialize()
const limit = pLimit(5)

// Recuperar todas as imagens agrupadas por hash
const imagesByHash = await imageRepository
  .createQueryBuilder('image')
  .leftJoinAndSelect('image.ocrs', 'ocr')
  .getMany()

// Agrupar imagens por hash
const hashMap = new Map<string, Image[]>()
imagesByHash.forEach((image) => {
  const existingImages = hashMap.get(image.hash) || []
  hashMap.set(image.hash, [...existingImages, image])
})

await Promise.all(
  Array.from(hashMap.entries()).map(([hash, images]) =>
    limit((async () => {
      if (images.length > 1) {
        console.log(chalk.bgRed(`Hash duplicado: ${hash}`))
        // Selecionar a primeira imagem como principal
        const mainImage = images[0]
      
        for (let i = 1; i < images.length; i++) {
          const duplicateImage = images[i]
      
          // Mover OCRs da imagem duplicada para a principal
          if (duplicateImage.ocrs) {
            duplicateImage.ocrs.forEach((ocr) => {
              if (!mainImage.ocrs.find((o) => o.id === ocr.id)) {
                mainImage.ocrs.push(ocr)
              }
            })
          }
      
          //   Remover a imagem duplicada
          await imageRepository.remove(duplicateImage)
        }
      
        // Salvar a imagem principal atualizada
        await imageRepository.save(mainImage)
      }
    })))
)

await Database.destroy()