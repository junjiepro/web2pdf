import { z } from 'zod'

// Helpers
const csv = () =>
  z.preprocess((value) => {
    if (Array.isArray(value)) return value
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    }
    return []
  }, z.array(z.string()))

const booleanFromEnv = z
  .union([z.string(), z.boolean(), z.number(), z.undefined()])
  .transform((v) => {
    if (typeof v === 'boolean') return v
    if (typeof v === 'number') return v === 1
    if (typeof v === 'string') {
      if (/^(1|true|yes|y|on)$/i.test(v)) return true
      if (/^(0|false|no|n|off)$/i.test(v)) return false
    }
    return v as unknown
  })
  .pipe(z.boolean())
  .default(false)

// Environment schema: validates and coerces raw process.env
const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().max(65535).default(3000),

  // API keys: support a single API_KEY or a comma-separated list via API_KEYS
  API_KEY: z.string().min(1).optional(),
  API_KEYS: csv().default([]),

  // Comma-separated list for allowlist (e.g. origins, IPs, etc.)
  ALLOWLIST: csv().default([]),

  // Timeouts in milliseconds
  REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),
  CONNECTION_TIMEOUT_MS: z.coerce.number().int().positive().default(5_000),

  // Logging and feature flags
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  ENABLE_METRICS: booleanFromEnv,

  // Optional public URL for the service
  PUBLIC_URL: z.string().url().optional(),
})

// Parse and validate environment immediately (fail-fast)
const env = EnvSchema.parse(process.env)

// Build the runtime config consumed by the application
const ConfigSchema = z.object({
  env: z.enum(['development', 'test', 'production']),
  port: z.number().int().positive().max(65535),
  apiKey: z.string().min(1).optional(),
  apiKeys: z.array(z.string()),
  allowlist: z.array(z.string()),
  requestTimeoutMs: z.number().int().positive(),
  connectionTimeoutMs: z.number().int().positive(),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']),
  enableMetrics: z.boolean(),
  publicUrl: z.string().url().optional(),
})

const mergedApiKeys = (() => {
  const keys = new Set<string>(env.API_KEYS)
  if (env.API_KEY) keys.add(env.API_KEY)
  return Array.from(keys)
})()

const builtConfig = {
  env: env.NODE_ENV,
  port: env.PORT,
  apiKey: env.API_KEY,
  apiKeys: mergedApiKeys,
  allowlist: env.ALLOWLIST,
  requestTimeoutMs: env.REQUEST_TIMEOUT_MS,
  connectionTimeoutMs: env.CONNECTION_TIMEOUT_MS,
  logLevel: env.LOG_LEVEL,
  enableMetrics: env.ENABLE_METRICS,
  publicUrl: env.PUBLIC_URL,
}

export const config = ConfigSchema.parse(builtConfig)
export type Config = z.infer<typeof ConfigSchema>

export type NodeEnv = Config['env']
export type LogLevel = Config['logLevel']
