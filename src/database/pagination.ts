import { Between, FindOptionsWhere, ObjectLiteral, Repository } from 'typeorm'
import { addYears, subYears, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfHour, endOfHour } from 'date-fns'
import { z } from 'zod'

// TypeORM Query Operators
export const AfterDate = (date: Date) => Between(date, addYears(date, 100))
export const BeforeDate = (date: Date) => Between(subYears(date, 100), date)

export const paginateSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((value) => (value ? parseInt(value) : 1))
    .refine((value) => value > 0, { message: 'Page must be greater than 0' }),

  pageSize: z
    .string()
    .optional()
    .transform((value) => (value ? parseInt(value) : 10))
    .refine((value) => value > 0, { message: 'PageSize must be greater than 0' }),

  interval: z.enum(['month', 'day', 'hour', 'none']).default('none'),

  day: z.string().optional().refine((value) => {
    if (!value) return true
    const date = new Date(value)
    return !isNaN(date.getTime())
  }, { message: 'Invalid date format for day' }),
})


export async function paginate<T extends ObjectLiteral>({
  repository,
  page,
  pageSize,
  interval,
  day,
}: {
  repository: Repository<T>;
  page: number;
  pageSize: number;
  interval: 'month' | 'day' | 'hour' | 'none';
  day?: string;
}) {
  // Se 'day' não for fornecido, use a data atual
  const targetDate = day ? new Date(day) : new Date()
  
  let start: Date | undefined = undefined
  let end: Date | undefined = undefined

  // Define os limites de acordo com o intervalo especificado
  switch (interval) {
  case 'day':
    start = startOfDay(targetDate)
    end = endOfDay(targetDate)
    break
  case 'month':
    start = startOfMonth(targetDate)
    end = endOfMonth(targetDate)
    break
  case 'hour':
    start = startOfHour(targetDate)
    end = endOfHour(targetDate)
    break
  }

  const whereCondition: FindOptionsWhere<T> = {
    createdAt: Between(start, end) as unknown as T[keyof T], // forçando a tipagem
  }

  const [data, total] = await repository.findAndCount({
    where: (start !== undefined && end !== undefined) ? whereCondition : undefined,
    skip: (page - 1) * pageSize,
    take: pageSize,
  })

  return {
    data,
    total,
    currentPage: page,
    totalPages: Math.ceil(total / pageSize),
    pageSize,
  }
}
