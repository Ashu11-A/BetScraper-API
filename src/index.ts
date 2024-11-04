import { existsSync } from 'fs'
import { mkdir } from 'fs/promises'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

export const storagePath = join(dirname(fileURLToPath(import.meta.url)), '../storage')
export const storageImagePath = join(storagePath, '/avatars')

if (!existsSync(storagePath)) await mkdir(storagePath)
if (!existsSync(storageImagePath)) await mkdir(storageImagePath)
