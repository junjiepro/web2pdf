import { validateConfig } from '../../src/config'
import { assertUrlAllowed } from '../../src/urlGuard'

describe('Allowlist', () => {
  it('allows hostnames present in allowlist', async () => {
    const config = validateConfig({ allowlist: ['example.com'], blockPrivateIPs: true, requestTimeoutMs: 1000 })
    await expect(assertUrlAllowed('http://example.com', config)).resolves.toBeUndefined()
  })

  it('blocks hostnames not present in allowlist', async () => {
    const config = validateConfig({ allowlist: ['allowed.com'], blockPrivateIPs: true, requestTimeoutMs: 1000 })
    await expect(assertUrlAllowed('http://example.com', config)).rejects.toMatchObject({
      code: 'url_blocked',
    })
  })
})
