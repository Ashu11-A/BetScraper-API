import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

export const storagePath = join(dirname(fileURLToPath(import.meta.url)), '../storage')
export const storageImagePath = join(storagePath, '/avatars')
