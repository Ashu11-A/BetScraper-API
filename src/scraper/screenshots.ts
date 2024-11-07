import sharp, { Sharp } from 'sharp'

export class Screenshot {
  private processedImg: Sharp

  constructor(public image: Uint8Array) {
    this.processedImg = sharp(image)
  }

  greyscale(): Omit<this, 'image' | 'greyscale'> {
    this.processedImg.greyscale()
    return this
  }

  gaussian(): Omit<this, 'image' | 'gaussian'> {
    this.processedImg.blur(2)
      .normalise()
      .sharpen()
      .trim()
    return this
  }

  async toBuffer(): Promise<Buffer> {
    return await this.processedImg
      .png()
      .toBuffer()
  }
}