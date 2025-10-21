import autocannon from 'autocannon'
import { buildServer } from '../src/server'

async function run() {
  const app = buildServer({ requestTimeoutMs: 2000 })
  await app.listen({ port: 3000, host: '0.0.0.0' })

  const instance = autocannon({
    url: 'http://localhost:3000/sync',
    connections: Number(process.env.AC_CONNECTIONS ?? 50),
    duration: Number(process.env.AC_DURATION ?? 10),
  })

  autocannon.track(instance, { renderProgressBar: true })

  await new Promise<void>((resolve) => instance.once('done', () => resolve()))

  await app.close()
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
