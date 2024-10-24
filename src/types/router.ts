import { FastifyReply, FastifyRequest } from 'fastify'

export enum MethodType {
    Get = 'Get',
    Post = 'Post',
    Put = 'Put',
    Delete = 'Delete',
    Websocket = 'Websocket'
}

export type MethodApp = {
    type: MethodType
    authenticate?: ('bearer')[]
    run: (request: FastifyRequest, reply: FastifyReply) => Promise<FastifyReply>
}

export type RouterOptions = {
    name: string
    path?: string
    description: string
    method: MethodApp[]
}