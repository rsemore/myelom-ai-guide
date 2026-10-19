import 'dotenv/config'
import Fastify from 'fastify'
import { ApiRouter } from './routes/api'
import fastifySensible from '@fastify/sensible'
import fastifyJwt from '@fastify/jwt'
import fastifyCookie from '@fastify/cookie'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'
import { registerFrontend } from './lib/frontend'
import { resolve } from 'node:path'

async function main() {
  const app = Fastify({ logger: true })

  // error handler
  await app.setErrorHandler(async (error: any, request, reply) => {
    console.log(error)

    if (error.statusCode) // most likely came from sensible HTTP errors
      return reply.status(error.statusCode).send(error)

    return reply.status(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: process.env['NODE_ENV'] === 'production' ? undefined : error.message
    })
  })

  await app.register(fastifyCookie, {
    secret: process.env['COOKIE_SECRET']!
  })
  await app.register(fastifySensible)
  await app.register(fastifyJwt, {
    secret: process.env['JWT_SECRET']!,
    cookie: {
      cookieName: 'access_token',
      signed: false
    }
  })

  app.decorate('authenticate', async (request, _reply) => {
    try { await request.jwtVerify() }
    catch {
      throw app.httpErrors.unauthorized('Unauthorized: Missing or invalid session')
    }
  })

  await app.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'WigymTrio API',
        version: '1.0.0',
        description: 'Chat, user sessions, and knowledge base API.'
      },
      tags: [
        { name: 'auth', description: 'User registration and authentication.' },
        { name: 'knowledge', description: 'Knowledge base documents.' },
        { name: 'chat', description: 'Chat sessions and messages.' }
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          },
          cookieAuth: {
            type: 'apiKey',
            in: 'cookie',
            name: 'access_token'
          }
        }
      },
      security: [{ bearerAuth: [] }, { cookieAuth: [] }]
    }
  })
  await app.register(fastifySwaggerUi, {
    routePrefix: '/docs'
  })

  await app.register(ApiRouter, { prefix: '/api' })

  if (process.env['NODE_ENV'] === 'production')
    await registerFrontend(app, resolve(__dirname, '../../frontend/dist'))

  const address = await app.listen({
    port: +(process.env['PORT'] ?? '3000'),
    host: process.env['HOST'] ?? 'localhost'
  })
  console.log(`Server listening at ${address}`)
}

main()
  .catch(err => {
    console.error(err)
    process.exitCode = 1
  })
