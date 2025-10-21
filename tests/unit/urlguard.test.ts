import { validateConfig } from '../../src/config'
import { assertUrlAllowed } from '../../src/urlGuard'

describe('URL Guard', () => {
  const baseCfg = validateConfig({ allowlist: [], blockPrivateIPs: true, requestTimeoutMs: 1000 })

  it('blocks private IP literal 127.0.0.1', async () => {
    await expect(assertUrlAllowed('http://127.0.0.1', baseCfg)).rejects.toMatchObject({ code: 'url_blocked' })
  })

  it('allows public IP literal 8.8.8.8', async () => {
    await expect(assertUrlAllowed('http://8.8.8.8', baseCfg)).resolves.toBeUndefined()
  })

  it('blocks localhost hostname when private IP blocking is enabled', async () => {
    await expect(assertUrlAllowed('http://localhost', baseCfg)).rejects.toMatchObject({ code: 'url_blocked' })
  })

  it('allows non-http schemes to be blocked', async () => {
    await expect(assertUrlAllowed('ftp://example.com', baseCfg)).rejects.toMatchObject({ code: 'url_blocked' })
  })
})
