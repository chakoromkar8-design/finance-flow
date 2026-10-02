import { Router } from 'express'
import { ApiError, notFound } from '../utils/errors.js'
import { monthKey, isMonthKey } from '../utils/dates.js'
import { Validator, assertId, EXPENSE_CATEGORIES } from '../validators/common.js'
import { serializeBudget, spentByCategory, budgetWithSpent } from '../services/budgets.js'

export function budgetRoutes({ prisma, config }) {
  const router = Router()

  // ?month=YYYY-MM lets you look at another month (defaults to the current one).
  const requestedMonth = (req) => {
    if (req.query.month === undefined) return monthKey(config)
    if (!isMonthKey(String(req.query.month))) throw new ApiError(400, 'month must look like 2026-09.', { code: 'VALIDATION' })
    return String(req.query.month)
  }

  router.get('/', async (req, res) => {
    const month = requestedMonth(req)
    const [budgets, transactions] = await Promise.all([
      prisma.budget.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'asc' } }),
      prisma.transaction.findMany({ where: { userId: req.user.id, type: 'EXPENSE' } }),
    ])
    const spent = spentByCategory(transactions, month)
    res.json({ data: budgets.map((b) => serializeBudget(b, spent.get(b.category) ?? 0)), meta: { month } })
  })

  router.post('/', async (req, res) => {
    const v = new Validator(req.body ?? {})
    v.oneOf('category', EXPENSE_CATEGORIES, { label: 'Category' }).money('amount', { min: 0, allowZero: false, label: 'Budget amount' })
    const data = v.done()

    const clash = await prisma.budget.findFirst({ where: { userId: req.user.id, category: data.category } })
    if (clash) {
      throw new ApiError(409, `You already have a budget for ${data.category}.`, { code: 'CONFLICT', fields: { category: 'A budget for this category already exists.' } })
    }
    const created = await prisma.budget.create({ data: { userId: req.user.id, category: data.category, amount: data.amount } })
    res.status(201).json({ data: await budgetWithSpent(prisma, req.user.id, created, monthKey(config)) })
  })

  router.put('/:id', async (req, res) => {
    const id = assertId(req.params.id)
    const existing = await prisma.budget.findFirst({ where: { id, userId: req.user.id } })
    if (!existing) throw notFound('Budget')

    const v = new Validator(req.body ?? {}, { partial: true })
    v.oneOf('category', EXPENSE_CATEGORIES, { label: 'Category' }).money('amount', { min: 0, allowZero: false, label: 'Budget amount' })
    const data = v.done()

    if (data.category && data.category !== existing.category) {
      const clash = await prisma.budget.findFirst({ where: { userId: req.user.id, category: data.category } })
      if (clash) throw new ApiError(409, `You already have a budget for ${data.category}.`, { code: 'CONFLICT', fields: { category: 'A budget for this category already exists.' } })
    }
    const updated = await prisma.budget.update({ where: { id }, data })
    res.json({ data: await budgetWithSpent(prisma, req.user.id, updated, monthKey(config)) })
  })

  router.delete('/:id', async (req, res) => {
    const id = assertId(req.params.id)
    const existing = await prisma.budget.findFirst({ where: { id, userId: req.user.id } })
    if (!existing) throw notFound('Budget')
    await prisma.budget.delete({ where: { id } })
    res.json({ data: { id } })
  })

  return router
}
