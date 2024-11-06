import { Router } from '@/controllers/router.js'
import { Cron } from '@/database/entity/Cron.js'
import { MethodType } from '@/types/router.js'
import { z } from 'zod'
import { parseExpression } from 'cron-parser'
import { paginate, paginateSchema } from '@/database/pagination.js'
import { cronRepository } from '@/database/index.js'
import { BetQueue } from '@/queues/BetQueue.js'

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
  name: 'CronManagement',
  description: 'Handles CRUD operations for cron schedules in the database',
  method: [
    {
      type: MethodType.Get,
      authenticate: ['bearer'],
      async run(request, reply) {
        const validation = paginateSchema.safeParse(request.query)
        if (!validation.success) {
          return reply.code(400).send({ 
            message: 'Invalid query parameters.',
            zod: validation.error
          })
        }
        
        const { page, pageSize, interval, day } = validation.data

        try {
          const cronRecords = await paginate({
            repository: cronRepository,
            interval,
            page,
            pageSize,
            day
          })
          
          return reply.code(200).send({
            message: 'Cron records retrieved successfully.',
            ...cronRecords
          })
        } catch (error) {
          console.error('Error retrieving cron records:', error)
          return reply.code(500).send({ 
            message: 'Failed to retrieve cron records. Please try again later.'
          })
        }
      }
    },
    {
      type: MethodType.Post,
      authenticate: ['bearer'],
      async run(request, reply) {
        const validation = createSchema.safeParse(request.body)
        if (!validation.success) {
          return reply.code(400).send({ 
            message: 'Invalid cron expression.',
            zod: validation.error
          })
        }
        
        try {
          const newCron = await Cron.create({ ...validation.data }).save()
          return reply.code(201).send({ 
            message: 'Cron schedule created successfully.',
            data: newCron
          })
        } catch (error) {
          console.error('Error creating cron schedule:', error)
          return reply.code(500).send({ 
            message: 'Failed to create cron schedule. Please try again later.'
          })
        }
      }
    },
    {
      type: MethodType.Put,
      authenticate: ['bearer'],
      async run(request, reply) {
        const validation = await updateSchema.safeParseAsync(request.body)
        if (!validation.success) {
          return reply.code(400).send({ 
            message: 'Invalid input for updating cron schedule.',
            zod: validation.error
          })
        }
        
        try {
          const updatedCron = await Cron.update({ id: validation.data.id }, validation.data)

          if (updatedCron.affected === 0) {
            return reply.code(404).send({ 
              message: 'Cron not found or no changes made.' 
            })
          }

          await BetQueue.checkAllCrons()

          return reply.code(200).send({
            message: 'Cron schedule updated successfully.',
            data: updatedCron
          })
        } catch (error) {
          console.error('Error updating cron schedule:', error)
          return reply.code(500).send({ 
            message: 'Failed to update cron schedule. Please try again later.'
          })
        }
      }
    },
    {
      type: MethodType.Delete,
      authenticate: ['bearer'],
      async run(request, reply) {
        const validation = await deleteSchema.safeParseAsync(request.body)
        if (!validation.success) {
          return reply.code(400).send({ 
            message: 'Invalid request for deleting cron schedule.',
            zod: validation.error
          })
        }
        
        try {
          const deletionResult = await Cron.delete({ id: validation.data.id })
          return reply.code(200).send({
            message: 'Cron schedule deleted successfully.',
            data: deletionResult
          })
        } catch (error) {
          console.error('Error deleting cron schedule:', error)
          return reply.code(500).send({ 
            message: 'Failed to delete cron schedule. Please try again later.'
          })
        }
      }
    }
  ]
})
