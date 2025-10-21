import { buildServer } from '../../src/server'
import request from 'supertest'

async function getBaseUrl(app: ReturnType<typeof buildServer>): Promise<string> {
  const address = await app.listen({ port: 0 })
  if (typeof address === 'string') return address
  const addr = app.server.address()
  if (typeof addr === 'string' || addr === null) throw new Error('Unexpected address type')
  return `http://127.0.0.1:${addr.port}`
}

describe('Integration: private IP blocking and allowlist', () => {
  it('blocks fetch to localhost when private IP blocking enabled', async () => {
    const app = buildServer({ allowlist: ['127.0.0.1', 'localhost'], blockPrivateIPs: true, requestTimeoutMs: 500 })
    const baseUrl = await getBaseUrl(app)

    const agent = request(baseUrl)
    const target = `${baseUrl}/sync`
    const res = await agent.get('/fetch').query({ url: target })
    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: { code: 'url_blocked', message: expect.any(String) } })

    await app.close()
  })

  it('allows fetch to localhost when private IP blocking disabled and allowlisted', async () => {
    const app = buildServer({ allowlist: ['127.0.0.1', 'localhost'], blockPrivateIPs: false, requestTimeoutMs: 1000 })
    const baseUrl = await getBaseUrl(app)

    const agent = request(baseUrl)
    const target = `${baseUrl}/sync`
    const res = await agent.get('/fetch').query({ url: target })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ ok: true, status: 200 })

    await app.close()
  })

  it('blocks fetch to non-allowlisted host', async () => {
    const app = buildServer({ allowlist: ['good.com'], blockPrivateIPs: false, requestTimeoutMs: 500 })
    const baseUrl = await getBaseUrl(app)

    const agent = request(baseUrl)
    const res = await agent.get('/fetch').query({ url: 'http://example.com' })
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('url_blocked')

    await app.close()
  })
})
