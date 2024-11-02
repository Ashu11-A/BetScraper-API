import { Router } from '@/controllers/router.js'
import { storageImagePath } from '@/index.js'
import { MethodType } from '@/types/router.js'
import { existsSync } from 'fs'
import { mkdir } from 'fs/promises'
import { join } from 'path'
import sharp from 'sharp'

export default new Router({
  name: 'Avatar',
  description: 'Manager Avatars',
  method: [
    {
      type: MethodType.Get,
      authenticate: ['bearer'],
      async run(request, reply) {
        const path = join(storageImagePath, `${request.user!.uuid}.png`)

        if (!existsSync(path)) {
          return reply.code(404).send({ message: 'Arquivo não encontrado'  })
        }

        return reply.sendFile(path)
      },
    },
    {
      type: MethodType.Post,
      authenticate: ['bearer'],
      async run(request, reply) {
        const userUUID = request.user!.uuid
        const data = await request.file()
        if (!data) return reply.code(422).send({ message: 'Arquivo não encontrado' })

        // Criação do diretório caso não exista
        await mkdir(storageImagePath, { recursive: true })

        const path = join(storageImagePath, `${userUUID}.png`)

        // Processamento da imagem e salvamento diretamente em arquivo
        await sharp(await data.toBuffer())
          .resize(256)
          .png({ compressionLevel: 9 })
          .toFile(path)

        return reply.code(200).send({ message: 'Avatar salvo com sucesso!', toastMessage: 'Seu avatar foi salvo!' })
      },
    }
  ]
})
