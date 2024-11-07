import sharp from 'sharp'

export class Screenshot {
  constructor(public image: Uint8Array) {}

  async grayscale(): Promise<Buffer> {
    return await sharp(this.image).greyscale().png().toBuffer()
  }
  
}