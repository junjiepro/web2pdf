import { ValidationError } from './errors'

export interface AppConfig {
  authToken?: string
  allowlist: string[]
  blockPrivateIPs: boolean
  requestTimeoutMs: number
}

export function parseBool(value: unknown, defaultValue: boolean): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase()
    if (['true', '1', 'yes', 'y'].includes(v)) return true
    if (['false', '0', 'no', 'n'].includes(v)) return false
  }
  return defaultValue
}

export function parseNumber(value: unknown, defaultValue: number): number {
  if (typeof value === 'number' && !Number.isNaN(value)) return value
  if (typeof value === 'string' && value.trim().length > 0) {
    const n = Number(value)
    if (!Number.isNaN(n)) return n
  }
  return defaultValue
}

export function validateConfig(raw: Partial<AppConfig> & Record<string, unknown> = {}): AppConfig {
  const allowlistRaw = (raw.allowlist ?? raw.ALLOWLIST ?? process.env.ALLOWLIST) as string | string[] | undefined
  let allowlist: string[] = []
  if (Array.isArray(allowlistRaw)) {
    allowlist = allowlistRaw
  } else if (typeof allowlistRaw === 'string' && allowlistRaw.trim().length > 0) {
    allowlist = allowlistRaw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }

  const requestTimeoutMs = parseNumber(
    (raw.requestTimeoutMs ?? raw.REQUEST_TIMEOUT_MS ?? process.env.REQUEST_TIMEOUT_MS) as unknown,
    1000
  )
  if (!Number.isFinite(requestTimeoutMs) || requestTimeoutMs <= 0) {
    throw new ValidationError('REQUEST_TIMEOUT_MS must be a positive number', { value: requestTimeoutMs })
  }

  const blockPrivateIPs = parseBool(
    (raw.blockPrivateIPs ?? raw.BLOCK_PRIVATE_IPS ?? process.env.BLOCK_PRIVATE_IPS) as unknown,
    true
  )

  const authToken = (raw.authToken ?? raw.AUTH_TOKEN ?? process.env.AUTH_TOKEN) as string | undefined
  if (authToken !== undefined && typeof authToken !== 'string') {
    throw new ValidationError('AUTH_TOKEN must be a string')
  }

  return {
    authToken,
    allowlist,
    blockPrivateIPs,
    requestTimeoutMs,
  }
}
