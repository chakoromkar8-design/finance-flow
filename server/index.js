import { config } from './config.js'
import { prisma } from './prisma.js'
import { createApp } from './app.js'

const app = createApp({ prisma, config })

const server = app.listen(config.port, () => {
  console.log(`FinanceFlow API listening on http://localhost:${config.port} (${config.nodeEnv})`)
  console.log(`Allowed frontend origin(s): ${config.frontendOrigins.join(', ')}`)
})

const shutdown = async () => {
  server.close()
  await prisma.$disconnect()
  process.exit(0)
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
