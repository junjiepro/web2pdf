import { buildServer } from '../../src/server'
import request from 'supertest'

describe('Integration: sync/async, redirects, timeouts', () => {
  it('handles sync and async routes', async () => {
    const app = buildServer({ requestTimeoutMs: 200 })

    // Supertest can use Fastify.inject, but we'll listen on ephemeral port for redirect handling
    const address = await app.listen({ port: 0 })
    const url = typeof address === 'string' ? address : `http://127.0.0.1:${(app.server.address() as any).port}`

    const agent = request(url)

    const r1 = await agent.get('/sync')
    expect(r1.status).toBe(200)
    expect(r1.body).toMatchObject({ ok: true, type: 'sync' })

    const r2 = await agent.get('/async').query({ delay: 50 })
    expect(r2.status).toBe(200)
    expect(r2.body).toMatchObject({ ok: true, type: 'async' })

    const r3 = await agent.get('/redirect').query({ to: '/sync' }).redirects(0)
    expect(r3.status).toBe(302)

    const r4 = await agent.get('/async').query({ delay: 1000 })
    expect(r4.status).toBe(504)

    await app.close()
  })
})
