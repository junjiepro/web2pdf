import { buildServer } from './server'

const port = Number(process.env.PORT ?? 3000)
const host = process.env.HOST ?? '0.0.0.0'

async function main() {
  const app = buildServer()

  try {
    await app.listen({ port, host })
    app.log.info(`Server listening on http://${host}:${port}`)
  } catch (err) {
    app.log.error({ err }, 'Failed to start server')
    process.exit(1)
  }

  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM']
  for (const signal of signals) {
    process.on(signal, async () => {
      app.log.info({ signal }, 'Shutting down...')
      try {
        await app.close()
        app.log.info('Shutdown complete')
        process.exit(0)
      } catch (closeErr) {
        app.log.error({ err: closeErr }, 'Error during shutdown')
        process.exit(1)
      }
    })
  }
}

void main()
