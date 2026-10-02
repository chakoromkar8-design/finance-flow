import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import cors from 'cors'
import { requireAuth } from './middleware/auth.js'
import { securityHeaders, originGuard } from './middleware/security.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import { authRoutes } from './routes/auth.js'
import { accountRoutes } from './routes/accounts.js'
import { transactionRoutes } from './routes/transactions.js'
import { budgetRoutes } from './routes/budgets.js'
import { goalRoutes } from './routes/goals.js'
import { loanRoutes } from './routes/loans.js'
import { emiRoutes } from './routes/emis.js'
import { dashboardRoutes } from './routes/dashboard.js'

// The app is built by a function so tests can hand in a fake database and a
// test config. index.js hands in the real Prisma client and the real config.
export function createApp({ prisma, config }) {
  const app = express()
  app.disable('x-powered-by')
  if (config.isProd) app.set('trust proxy', 1) // we are behind a host's HTTPS proxy

  app.use(securityHeaders)
  app.use(
    cors({
      origin(origin, callback) {
        // No Origin header = not a browser (curl, health checks): fine.
        if (!origin || config.frontendOrigins.includes(origin)) return callback(null, true)
        return callback(null, false)
      },
      credentials: true,
    }),
  )
  app.use(express.json({ limit: '100kb' }))
  app.use(originGuard(config.frontendOrigins))

  app.get('/api/health', (req, res) => res.json({ data: { ok: true } }))
  app.use('/api/auth', authRoutes({ prisma, config }))

  // Everything below needs a valid login cookie.
  const auth = requireAuth({ prisma, config })
  app.use('/api/accounts', auth, accountRoutes({ prisma, config }))
  app.use('/api/transactions', auth, transactionRoutes({ prisma, config }))
  app.use('/api/budgets', auth, budgetRoutes({ prisma, config }))
  app.use('/api/goals', auth, goalRoutes({ prisma, config }))
  app.use('/api/loans', auth, loanRoutes({ prisma, config }))
  app.use('/api/emis', auth, emiRoutes({ prisma, config }))
  app.use('/api/dashboard', auth, dashboardRoutes({ prisma, config }))
    // Serve the built React app from the same server (production)
  const distDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist')
  app.use(express.static(distDir))
  app.get(/^\/(?!api\/).*/, (req, res) => res.sendFile(path.join(distDir, 'index.html')))
  app.use(notFoundHandler)
  app.use(errorHandler(config))
  return app
}
