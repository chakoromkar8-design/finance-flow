import { Router } from 'express'
import { ApiError } from '../utils/errors.js'
import { buildSummary, buildAnalytics } from '../services/analytics.js'

export function dashboardRoutes({ prisma, config }) {
  const router = Router()

  router.get('/summary', async (req, res) => {
    res.json({ data: await buildSummary(prisma, req.user.id, config) })
  })

  router.get('/analytics', async (req, res) => {
    const months = req.query.months === undefined ? 6 : Number(req.query.months)
    if (!Number.isInteger(months) || months < 1 || months > 24) throw new ApiError(400, 'months must be between 1 and 24.', { code: 'VALIDATION' })
    res.json({ data: await buildAnalytics(prisma, req.user.id, config, months) })
  })

  return router
}
