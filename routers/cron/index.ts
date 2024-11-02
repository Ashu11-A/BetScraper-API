import { Router } from '@/controllers/router.js'
import { Cron } from '@/database/entity/Cron.js'
import { MethodType } from '@/types/router.js'
import { z } from 'zod'
import { parseExpression } from 'cron-parser'
import { paginate, paginateSchema } from '@/database/pagination.js'
import { cronRepository } from '@/database/index.js'

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
  method: [
    {
      type: MethodType.Get,
      authenticate: ['bearer'],
      async run(request, reply) {
        const parsed = paginateSchema.safeParse(request.query)
        if (!parsed.success) return reply.code(400).send({ message: parsed.error.message, zod: parsed.error })
        const { page, pageSize, interval, day } = parsed.data

        const crons = await paginate({
          repository: cronRepository,
          interval,
          page,
          pageSize,
          day
        })
        return reply.code(200).send(crons)
      }
    },
    {
      type: MethodType.Post,
      authenticate: ['bearer'],
      async run(request, reply) {
        const parsed = createSchema.safeParse(request.body)
        if (!parsed.success) return reply.code(400).send({ message: parsed.error.message, zod: parsed.error })
        
        const cron = await Cron.create({ ...parsed.data }).save()
        return reply.code(201).send({ 
          message: 'Cron criado com sucesso!',
          data: cron
        })
      }
    },
    {
      type: MethodType.Put,
      authenticate: ['bearer'],
      async run(request, reply) {
        const parsed = await updateSchema.safeParseAsync(request.body)
        if (!parsed.success) return reply.code(400).send({ message: parsed.error.message, zod: parsed.error })

        const cron = await Cron.update({ id: parsed.data.id }, {
          ...parsed.data
        })
        return reply.code(200).send({
          message: 'Cron editado com sucesso!',
          data: cron
        })
      }
    },
    {
      type: MethodType.Delete,
      authenticate: ['bearer'],
      async run(request, reply) {
        const parsed = await deleteSchema.safeParseAsync(request.body)
        if (!parsed.success) return reply.code(400).send({ message: parsed.error.message, zod: parsed.error })
        
        const result = await Cron.delete({ id: parsed.data.id })
        return reply.code(200).send({
          message: 'Cron deletado com sucesso!',
          data: result
        })
      }
    }
  ]
})