import { createHash } from 'crypto'


/**
 * Hashes a buffer using SHA-256
 */
export const sha256 = (data: Buffer<ArrayBufferLike> | string) => createHash('sha256').update(data).digest('hex')