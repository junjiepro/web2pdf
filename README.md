Fastify Service with URL Guard, Auth, and Tests

Overview
- Fastify TypeScript service with:
  - Token-based auth (optional)
  - URL guard with allowlist and private IP blocking
  - Config validation
  - Error mapping
  - Endpoints for sync/async responses, redirects, and safe fetch proxy
- Comprehensive unit and integration tests
- Basic load testing using autocannon

Endpoints
- GET /health: health check
- GET /sync: immediate response
- GET /async?delay=MS: delayed response; times out based on REQUEST_TIMEOUT_MS
- GET /redirect?to=PATH: redirect to a given path
- GET /fetch?url=ENCODED_URL: fetches a URL after URL guard checks

Configuration
Environment variables or programmatic config:
- AUTH_TOKEN: If set, requires Authorization: Bearer <token>
- ALLOWLIST: Comma-separated hostnames to allow (e.g., "example.com, api.example.com")
- BLOCK_PRIVATE_IPS: true/false to block private/loopback IPs (default: true)
- REQUEST_TIMEOUT_MS: positive integer for request timeout (default: 1000)

Install
- npm install

Run (dev)
- npm run dev

Build and start
- npm run build
- npm start

Tests
- Unit and integration tests with Jest
- Run: npm test
- Watch mode: npm run test:watch

Load testing (autocannon)
- Default: runs against /sync with 50 connections for 10s
- Run locally: npm run load
- Environment variables:
  - AC_CONNECTIONS: number of concurrent connections (default 50)
  - AC_DURATION: duration in seconds (default 10)

Running in CI
- Ensure Node >= 20
- Install deps: npm ci
- Run tests: npm test
- Optional load smoke in CI (short run):
  - AC_CONNECTIONS=10 AC_DURATION=5 npm run load

Security notes
- URL guard enforces http/https, an allowlist, and blocks private IP ranges to mitigate SSRF
- Private IP blocking can be disabled for trusted internal environments by setting BLOCK_PRIVATE_IPS=false
