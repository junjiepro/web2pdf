import Fastify, { type FastifyInstance } from 'fastify'
import { randomUUID } from 'crypto'

export function buildServer(): FastifyInstance {
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

  server.addHook('onSend', (request, reply, payload, done) => {
    reply.header('x-request-id', request.id as string)
    done()
  })

  server.get('/health', async () => ({ status: 'ok' }))

  server.get('/', async () => {
    return { ok: true }
  })

  server.addHook('onClose', async (instance) => {
    instance.log.info('Server closing')
  })

  return server
}
