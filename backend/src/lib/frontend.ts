import fastifyStatic from '@fastify/static'
import type { FastifyInstance } from 'fastify'
import { access } from 'node:fs/promises'
import { join } from 'node:path'

export async function registerFrontend(app: FastifyInstance, root: string) {
  await access(join(root, 'index.html'))
  await app.register(fastifyStatic, { root, wildcard: false })
  app.setNotFoundHandler((request, reply) => {
    const pathname = new URL(request.raw.url ?? '/', 'http://localhost').pathname
    const isServerRoute = /^\/(?:api|docs|assets)(?:\/|$)/.test(pathname)
    if ((request.method !== 'GET' && request.method !== 'HEAD') ||
      isServerRoute || !request.headers.accept?.includes('text/html'))
      return reply.code(404).send({ statusCode: 404, error: 'Not Found', message: 'Route not found' })

    reply.header('Cache-Control', 'no-cache')
    return reply.sendFile('index.html')
  })
}
