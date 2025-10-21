import dns from 'node:dns/promises'
import net from 'node:net'
import * as ipaddr from 'ipaddr.js'
import { AppConfig } from './config'
import { UrlBlockedError, BadRequestError } from './errors'

function isPrivateAddress(ip: string): boolean {
  try {
    const addr = ipaddr.parse(ip)
    // private ranges include: private, loopback, linkLocal, uniqueLocal
    return (
      addr.range() === 'private' ||
      addr.range() === 'loopback' ||
      addr.range() === 'linkLocal' ||
      addr.range() === 'uniqueLocal'
    )
  } catch {
    return false
  }
}

async function resolveAll(host: string): Promise<string[]> {
  try {
    const results = await dns.lookup(host, { all: true })
    return results.map((r) => r.address)
  } catch (err) {
    return []
  }
}

export async function assertUrlAllowed(urlStr: string, config: AppConfig): Promise<void> {
  let u: URL
  try {
    u = new URL(urlStr)
  } catch {
    throw new BadRequestError('Invalid URL format', { url: urlStr })
  }

  // Only http/https
  if (!['http:', 'https:'].includes(u.protocol)) {
    throw new UrlBlockedError('Only http/https protocols are allowed', { protocol: u.protocol })
  }

  const host = u.hostname.toLowerCase()

  // Allowlist check
  if (config.allowlist.length > 0 && !config.allowlist.map((h) => h.toLowerCase()).includes(host)) {
    throw new UrlBlockedError('Hostname not in allowlist', { host, allowlist: config.allowlist })
  }

  if (config.blockPrivateIPs) {
    const isIp = net.isIP(host) !== 0
    if (isIp) {
      if (isPrivateAddress(host)) {
        throw new UrlBlockedError('Private IPs are blocked', { host })
      }
    } else {
      const addrs = await resolveAll(host)
      if (addrs.some((ip) => isPrivateAddress(ip))) {
        throw new UrlBlockedError('Resolved to private IP which is blocked', { host, addrs })
      }
    }
  }
}
