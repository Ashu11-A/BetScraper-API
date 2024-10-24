declare module 'fastify' {
    interface PassportUser {
        id: number
        uuid: string
        name: string
        username: string
        email: string
        language: string
        created_at: string
        updated_at: string
    }
    interface FastifyRequest {
        user?: PassportUser;
        // authInfo?: Record<string, unknown>;
        // account?: PassportUser;
    }
}
