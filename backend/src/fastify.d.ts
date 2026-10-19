import type { preHandlerAsyncHookHandler } from 'fastify'

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: preHandlerAsyncHookHandler
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      id: string
      email: string
    }
    user: {
      id: string
      email: string
    }
  }
}
