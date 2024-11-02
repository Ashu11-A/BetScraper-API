import {
  FastifyReply,
  FastifyRequest,
  RawServerBase,
  RawRequestDefaultExpression,
  RawReplyDefaultExpression,
  RouteGenericInterface,
  ContextConfigDefault,
  FastifySchema,
  FastifyTypeProviderDefault
} from 'fastify'
import { ZodError } from 'zod'

// Enum para os tipos de método
export enum MethodType {
    Get = 'Get',
    Post = 'Post',
    Put = 'Put',
    Delete = 'Delete',
    Websocket = 'Websocket'
}

export type ListResponse<T> = {
    data: T[]
    total: number
    currentPage: number
    totalPages: number
    pageSize: number
}

export type TReply = {
    200: { 
      message: string
      toastMessage?: string 
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data?: any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } | Partial<ListResponse<any>>
    201: {
        message: string
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data?: any
    }
    302: { 
      url: string 
      message: string
      toastMessage?: string 
      shouldRedirect?: boolean 
    }
    404: { 
      message: string
      toastMessage?: string 
    }
    400: { 
        message: string
        zod: ZodError
        toastMessage?: string 
    }
    401: { 
        message: string
        toastMessage?: string 
    }
    403: { 
        message: string
        toastMessage?: string 
    }
    422: {
        message: string
        toastMessage?: string 
    }
    500: { 
      message: string
      toastMessage?: string 
    }
}  

// Mapeia as chaves para os códigos de resposta
type ReplyKeysToCodes = keyof TReply

// Define um tipo que resolve o tipo de resposta baseado no código de status
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type ResolveReplyTypeWithRouteGeneric<Reply, Code> =
    Code extends keyof TReply ? TReply[Code] : never

// Define um tipo genérico para o reply que é compatível com FastifyReply
export type ReplyType<Code extends ReplyKeysToCodes = keyof TReply> = FastifyReply<
    RawServerBase,
    RawRequestDefaultExpression<RawServerBase>,
    RawReplyDefaultExpression<RawServerBase>,
    RouteGenericInterface,
    ContextConfigDefault,
    FastifySchema,
    FastifyTypeProviderDefault,
    ResolveReplyTypeWithRouteGeneric<TReply, Code> // Resolve o tipo de resposta baseado no código
>

// Método da aplicação com o tipo de resposta dinâmico
export type MethodApp<Code extends ReplyKeysToCodes = keyof TReply> = {
    type: MethodType
    authenticate?: ('bearer')[]
    run: (request: FastifyRequest, reply: ReplyType<Code>) => Promise<ReplyType<Code>>
}

// Define as opções do roteador
export type RouterOptions<Code extends ReplyKeysToCodes = keyof TReply> = {
    name: string
    path?: string
    description: string
    method: MethodApp<Code>[]
}

// Extensão do método code
declare module 'fastify' {
interface FastifyReply {
        code<Code extends ReplyKeysToCodes>(statusCode: Code): FastifyReply<
            RawServerBase,
            RawRequestDefaultExpression<RawServerBase>,
            RawReplyDefaultExpression<RawServerBase>,
            RouteGenericInterface,
            ContextConfigDefault,
            FastifySchema,
            FastifyTypeProviderDefault,
            ResolveReplyTypeWithRouteGeneric<TReply, Code> // Tipagem dinâmica com base no código
        >
    }
}
