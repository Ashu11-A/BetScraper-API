import { Router } from '@/controllers/router.js'
import { Cron } from '@/database/entity/Cron.js'
import { MethodType } from '@/types/router.js'
import { z } from 'zod'
import { parseExpression } from 'cron-parser'

const createSchema = z.object({
  expression: z.string().refine((value) => {
    try {
      parseExpression(value)
      return true
    } catch {
      return false
    }
  }, { 
    message: 'Cron is not valid'
  })
})
const deleteSchema = z.object({
  id: z.number().refine(async (id) => (await Cron.findOneBy({ id })) !== undefined, {
    message: 'Cron not found in database'
  }),
})
const updateSchema = z.object({
  id: z.number().refine(async (id) => (await Cron.findOneBy({ id })) !== undefined, {
    message: 'Cron not found in database'
  }),
  expression: z.string().refine((value) => parseExpression(value), { 
    message: 'Cron is not valid'
  })
})

export default new Router({
  name: 'Cron',
  description: 'Cron Manager',
  path: '/cron',
  method: [
    {
      type: MethodType.Get,
      authenticate: ['bearer'],
      async run(_request, reply) {
        const crons = await Cron.find()
        return reply.send(JSON.stringify(crons))
      }
    },
    {
      type: MethodType.Post,
      authenticate: ['bearer'],
      async run(request, reply) {
        const parsed = createSchema.safeParse(request.body)

        if (!parsed.success) return reply.status(422).send(JSON.stringify(parsed.error))
        
        const cron = await Cron.create({ ...parsed.data }).save()
        return reply.status(201).send(cron)
      }
    },
    {
      type: MethodType.Put,
      authenticate: ['bearer'],
      async run(request, reply) {
        const parsed = await updateSchema.safeParseAsync(request.body)

        if (!parsed.success) return reply.status(422).send(JSON.stringify(parsed.error))
        const cron = await Cron.update({ id: parsed.data.id }, {
          ...parsed.data
        })
        return reply.status(200).send(JSON.stringify(cron))
      }
    },
    {
      type: MethodType.Delete,
      authenticate: ['bearer'],
      async run(request, reply) {
        const parsed = await deleteSchema.safeParseAsync(request.body)
        if (!parsed.success) return reply.status(422).send(JSON.stringify(parsed.error))
        
        const result = await Cron.delete({ id: parsed.data.id })
        return reply.send(JSON.stringify(result))
      }
    }
  ]
})