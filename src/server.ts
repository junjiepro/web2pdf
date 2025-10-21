import Fastify, { type FastifyInstance } from 'fastify'
import { randomUUID } from 'crypto'
import { type AppConfig, validateConfig } from './config'
import { AuthError, TimeoutError, toErrorResponse } from './errors'
import { assertUrlAllowed } from './urlGuard'

export function buildServer(rawConfig: Partial<AppConfig> = {}): FastifyInstance {
  const config = validateConfig(rawConfig as any)
  const isProd = process.env.NODE_ENV === 'production'

  const server = Fastify({
    logger: isProd
      ? { level: 'info' }
      : {
          level: 'debug',
          transport: {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'SYS:standard',
              singleLine: true,
            },
          },
        },
    genReqId: (req) => {
      const hdr = req.headers['x-request-id']
      if (Array.isArray(hdr)) return hdr[0]
      if (typeof hdr === 'string' && hdr.length > 0) return hdr
      return randomUUID()
    },
  })

  server.decorate('config', config)

  server.addHook('onSend', (request, reply, payload, done) => {
    reply.header('x-request-id', request.id as string)
    done()
  })

  // Global auth check (if configured)
  server.addHook('onRequest', async (request) => {
    if (!config.authToken) return
    const auth = request.headers.authorization
    const expected = `Bearer ${config.authToken}`
    if (auth !== expected) {
      throw new AuthError('Invalid or missing Authorization header')
    }
  })

  // Centralized error handler
  server.setErrorHandler((err, _request, reply) => {
    const { statusCode, body } = toErrorResponse(err)
    reply.status(statusCode).send(body)
  })

  server.get('/health', async () => ({ status: 'ok' }))

  server.get('/', async () => {
    return { ok: true }
  })

  server.get('/sync', async () => {
    return { ok: true, type: 'sync' }
  })

  server.get('/async', async (request) => {
    const delayMs = Number((request.query as Record<string, string | undefined>)?.delay ?? 0)

    const delay = new Promise((resolve) => setTimeout(resolve, isNaN(delayMs) ? 0 : delayMs))
    const timeout = new Promise((_resolve, reject) =>
      setTimeout(() => reject(new TimeoutError('Operation timed out')), config.requestTimeoutMs)
    )

    await Promise.race([delay, timeout])

    return { ok: true, type: 'async', delayedMs: isNaN(delayMs) ? 0 : delayMs }
  })

  server.get('/redirect', async (request, reply) => {
    const to = (request.query as Record<string, string | undefined>)?.to ?? '/sync'
    reply.redirect(to)
  })

  server.get('/fetch', async (request, reply) => {
    const target = (request.query as Record<string, string | undefined>)?.url
    if (!target) {
      reply.code(400)
      return { error: { code: 'bad_request', message: 'Missing url parameter' } }
    }

    await assertUrlAllowed(target, config)

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), config.requestTimeoutMs)
    try {
      const res = await fetch(target, { signal: controller.signal })
      const text = await res.text()
      reply.code(200)
      return {
        ok: true,
        status: res.status,
        headers: Object.fromEntries(res.headers.entries()),
        body: text,
      }
    } finally {
      clearTimeout(timer)
    }
  })

  server.addHook('onClose', async (instance) => {
    instance.log.info('Server closing')
  })

  return server
}
