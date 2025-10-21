import { validateConfig } from '../../src/config'

describe('Config validation', () => {
  it('parses ALLOWLIST csv string', () => {
    const cfg = validateConfig({ ALLOWLIST: 'a.com, b.com' } as any)
    expect(cfg.allowlist).toEqual(['a.com', 'b.com'])
  })

  it('validates positive REQUEST_TIMEOUT_MS', () => {
    expect(() => validateConfig({ REQUEST_TIMEOUT_MS: -1 } as any)).toThrowError()
    const cfg = validateConfig({ REQUEST_TIMEOUT_MS: 500 } as any)
    expect(cfg.requestTimeoutMs).toBe(500)
  })

  it('parses boolean BLOCK_PRIVATE_IPS', () => {
    const cfg1 = validateConfig({ BLOCK_PRIVATE_IPS: 'false' } as any)
    expect(cfg1.blockPrivateIPs).toBe(false)
    const cfg2 = validateConfig({ BLOCK_PRIVATE_IPS: 'true' } as any)
    expect(cfg2.blockPrivateIPs).toBe(true)
  })
})
