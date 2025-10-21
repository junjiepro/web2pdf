import { buildServer } from '../../src/server'

describe('Auth middleware', () => {
  it('rejects requests without valid Authorization header when authToken is set', async () => {
    const app = buildServer({ authToken: 'secret' })

    const res = await app.inject({ method: 'GET', url: '/sync' })
    expect(res.statusCode).toBe(401)
    const body = res.json()
    expect(body).toEqual({ error: { code: 'unauthorized', message: expect.any(String) } })

    await app.close()
  })

  it('allows requests with correct Bearer token', async () => {
    const app = buildServer({ authToken: 'secret' })

    const res = await app.inject({ method: 'GET', url: '/sync', headers: { authorization: 'Bearer secret' } })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toMatchObject({ ok: true, type: 'sync' })

    await app.close()
  })
})
