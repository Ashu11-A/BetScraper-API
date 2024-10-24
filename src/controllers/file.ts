import { FastifyRequest } from 'fastify'

export class Multipart {
  constructor(private request: FastifyRequest) {}

  async getFiles(): Promise<File[]> {
    const multiparts = this.request.files()
    const files:  File[] = []
        
    for await (const { filename, file, mimetype: type } of multiparts) {
      const chunks: Buffer[] = []

      for await (const chunk of file) chunks.push(chunk)

      const buffer = Buffer.concat(chunks)
      const blob = new Blob([buffer])
      files.push(new File([blob], filename, { type }))
    }

    return files
  }
}
