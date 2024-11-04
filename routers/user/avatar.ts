import { Router } from '@/controllers/router.js'
import { storageImagePath } from '@/index.js'
import { MethodType } from '@/types/router.js'
import { existsSync } from 'fs'
import { mkdir } from 'fs/promises'
import { join } from 'path'
import sharp from 'sharp'

export default new Router({
  name: 'UserAvatar',
  description: 'Avatar management for users, including upload and retrieval.',
  method: [
    {
      type: MethodType.Get,
      authenticate: ['bearer'],
      async run(request, reply) {
        const avatarFilePath = join(storageImagePath, `${request.user!.uuid}.png`)
        if (!existsSync(avatarFilePath)) {
          return reply.code(404).send({ message: 'Avatar not found.' })
        }

        return reply.sendFile(`/avatars/${request.user!.uuid}.png`)
      },
    },
    {
      type: MethodType.Post,
      authenticate: ['bearer'],
      async run(request, reply) {
        const userUUID = request.user!.uuid
        const uploadedFile = await request.file()
        if (!uploadedFile) {
          return reply.code(422).send({ message: 'File upload failed: No file provided.' })
        }

        // Create directory if it does not exist
        await mkdir(storageImagePath, { recursive: true })

        const avatarFilePath = join(storageImagePath, `${userUUID}.png`)

        // Process the image and save directly to file
        await sharp(await uploadedFile.toBuffer())
          .resize(256)
          .png({ compressionLevel: 9 })
          .toFile(avatarFilePath)

        return reply.code(200).send({ 
          message: 'Avatar uploaded successfully!', 
          toastMessage: 'Your avatar has been saved!' 
        })
      },
    }
  ]
})
