import chalk from 'chalk'
import sharp, { Sharp } from 'sharp'

export class Screenshot {
  private processedImg: Sharp

  constructor(public image: Uint8Array | string) {
    this.processedImg = sharp(image)
  }

  greyscale(): Omit<this, 'image' | 'greyscale'> {
    this.processedImg.greyscale()
    return this
  }

  bgBlack () {
    this.processedImg
      .flatten({ background: { r: 0, g: 0, b: 0, alpha: 1 } })

    return this
  }

  gaussian(): Omit<this, 'image' | 'gaussian'> {
    this.processedImg.blur(0.5)
      .normalise()
      .sharpen()
      .trim()
    return this
  }

  // Método para redimensionar a imagem SVG para não ultrapassar 512px
  async resize() {
    const metadata = await this.processedImg.metadata()

    if (metadata.width! < 3 || metadata.height! < 3) {
      console.log(chalk.bgYellow('Ignorando imagem menor que 3x3!'))
      return
    }
  
    if (metadata.format === 'svg') {
      if (metadata.width! <= 512 && metadata.height! <= 512) return

      console.log('Redimensionando SVG para garantir que não ultrapasse 512px...')
      this.processedImg.resize(512, 512, { fit: 'inside' })
    }

    if (['png', 'jpg', 'webp', 'jpeg'].includes(metadata?.format ?? '')) {
      if (metadata.width! <= 1024 && metadata.height! <= 1024) {
        return
      }

      console.log('Redimensionando PNG para garantir que não ultrapasse 1024px...')
      this.processedImg.resize(1024, 1024, { fit: 'inside' })
    }

  }

  async toBuffer(): Promise<Buffer> {
    await this.resize()

    return await this.processedImg
      .png()
      .toBuffer()
  }
}