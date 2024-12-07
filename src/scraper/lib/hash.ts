import { BufferObject, imageHash as Hash, UrlRequestObject } from 'image-hash'

export async function imageHash(data: string | Buffer) {
  return new Promise<string | undefined | Error>((resolve, reject) => {
    let config: UrlRequestObject | BufferObject

    if (data instanceof Buffer) {
      config = {
        data
      }
    } else if (typeof data === 'string') {
      config = {
        url: data
      }
    }

    Hash(config!, 16, true, (error: Error, hash: string | undefined) => {
      if (error) reject(error)
      resolve(hash)
    })
  })
}