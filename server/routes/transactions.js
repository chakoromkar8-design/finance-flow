import { Router } from 'express'
import { ApiError, notFound } from '../utils/errors.js'
import { num } from '../utils/money.js'
import { dayString, parseDay } from '../utils/dates.js'
import { Validator, assertId, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../validators/common.js'

const lower = (s) => s.toLowerCase()

export function serializeTransaction(t, accountNames) {
  return {
    id: t.id,
    accountId: t.accountId,
    accountName: accountNames.get(t.accountId) ?? null,
    type: lower(t.type),
    amount: num(t.amount),
    category: t.category,
    description: t.description,
    notes: t.notes ?? null,
    date: dayString(t.date),
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  }
}

const accountNameMap = async (prisma, userId) => new Map((await prisma.account.findMany({ where: { userId } })).map((a) => [a.id, a.name]))

function checkCategory(type, category) {
  const allowed = type === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
  if (!allowed.includes(category)) {
    throw new ApiError(400, 'Please fix the highlighted fields.', {
      code: 'VALIDATION',
      fields: { category: `For ${lower(type)} transactions choose one of: ${allowed.join(', ')}.` },
    })
  }
}

async function assertOwnAccount(prisma, userId, accountId) {
  const account = await prisma.account.findFirst({ where: { id: accountId, userId } })
  if (!account) {
    throw new ApiError(400, 'Please fix the highlighted fields.', { code: 'VALIDATION', fields: { accountId: 'Account not found.' } })
  }
}

export function transactionRoutes({ prisma }) {
  const router = Router()

  router.get('/', async (req, res) => {
    const q = req.query
    const where = { userId: req.user.id }

    if (q.type !== undefined) {
      const t = String(q.type).toUpperCase()
      if (!['INCOME', 'EXPENSE'].includes(t)) throw new ApiError(400, 'type must be income or expense.', { code: 'VALIDATION' })
      where.type = t
    }
    if (q.category !== undefined) where.category = String(q.category)
    if (q.accountId !== undefined) where.accountId = assertId(String(q.accountId))
    const range = {}
    if (q.from !== undefined) {
      const d = parseDay(String(q.from))
      if (!d) throw new ApiError(400, 'from must be a date (YYYY-MM-DD).', { code: 'VALIDATION' })
      range.gte = d
    }
    if (q.to !== undefined) {
      const d = parseDay(String(q.to))
      if (!d) throw new ApiError(400, 'to must be a date (YYYY-MM-DD).', { code: 'VALIDATION' })
      range.lte = d
    }
    if (Object.keys(range).length) where.date = range
    if (q.search !== undefined && String(q.search).trim()) {
      const s = String(q.search).trim().slice(0, 100)
      where.OR = [
        { description: { contains: s, mode: 'insensitive' } },
        { notes: { contains: s, mode: 'insensitive' } },
      ]
    }

    const sort = q.sort === undefined ? 'date' : String(q.sort)
    if (!['date', 'amount'].includes(sort)) throw new ApiError(400, 'sort must be date or amount.', { code: 'VALIDATION' })
    const order = q.order === undefined ? 'desc' : String(q.order)
    if (!['asc', 'desc'].includes(order)) throw new ApiError(400, 'order must be asc or desc.', { code: 'VALIDATION' })
    const orderBy = sort === 'amount' ? [{ amount: order }, { date: 'desc' }] : [{ date: order }, { createdAt: order }]

    const limit = q.limit === undefined ? 1000 : Number(q.limit)
    const offset = q.offset === undefined ? 0 : Number(q.offset)
    if (!Number.isInteger(limit) || limit < 1 || limit > 5000) throw new ApiError(400, 'limit must be between 1 and 5000.', { code: 'VALIDATION' })
    if (!Number.isInteger(offset) || offset < 0) throw new ApiError(400, 'offset must be 0 or more.', { code: 'VALIDATION' })

    const [rows, total, names] = await Promise.all([
      prisma.transaction.findMany({ where, orderBy, take: limit, skip: offset }),
      prisma.transaction.count({ where }),
      accountNameMap(prisma, req.user.id),
    ])
    res.json({ data: rows.map((t) => serializeTransaction(t, names)), meta: { total, limit, offset } })
  })

  router.get('/:id', async (req, res) => {
    const row = await prisma.transaction.findFirst({ where: { id: assertId(req.params.id), userId: req.user.id } })
    if (!row) throw notFound('Transaction')
    res.json({ data: serializeTransaction(row, await accountNameMap(prisma, req.user.id)) })
  })

  router.post('/', async (req, res) => {
    const v = new Validator(req.body ?? {})
    v.oneOf('type', ['INCOME', 'EXPENSE'], { label: 'Type', transform: (s) => s.toUpperCase() })
      .money('amount', { min: 0, allowZero: false, label: 'Amount' })
      .string('category', { max: 40, label: 'Category' })
      .string('description', { max: 120, label: 'Description' })
      .optionalString('notes', { max: 500 })
      .date('date')
      .id('accountId')
    const data = v.done()

    checkCategory(data.type, data.category)
    await assertOwnAccount(prisma, req.user.id, data.accountId)

    const created = await prisma.transaction.create({
      data: {
        userId: req.user.id,
        accountId: data.accountId,
        type: data.type,
        amount: data.amount,
        category: data.category,
        description: data.description,
        notes: data.notes ?? null,
        date: data.date,
      },
    })
    res.status(201).json({ data: serializeTransaction(created, await accountNameMap(prisma, req.user.id)) })
  })

  router.put('/:id', async (req, res) => {
    const id = assertId(req.params.id)
    const existing = await prisma.transaction.findFirst({ where: { id, userId: req.user.id } })
    if (!existing) throw notFound('Transaction')

    const v = new Validator(req.body ?? {}, { partial: true })
    v.oneOf('type', ['INCOME', 'EXPENSE'], { label: 'Type', transform: (s) => s.toUpperCase() })
      .money('amount', { min: 0, allowZero: false, label: 'Amount' })
      .string('category', { max: 40, label: 'Category' })
      .string('description', { max: 120, label: 'Description' })
      .optionalString('notes', { max: 500 })
      .date('date')
      .id('accountId')
    const data = v.done()

    checkCategory(data.type ?? existing.type, data.category ?? existing.category)
    if (data.accountId && data.accountId !== existing.accountId) await assertOwnAccount(prisma, req.user.id, data.accountId)

    const updated = await prisma.transaction.update({ where: { id }, data })
    res.json({ data: serializeTransaction(updated, await accountNameMap(prisma, req.user.id)) })
  })

  router.delete('/:id', async (req, res) => {
    const id = assertId(req.params.id)
    const existing = await prisma.transaction.findFirst({ where: { id, userId: req.user.id } })
    if (!existing) throw notFound('Transaction')
    await prisma.transaction.delete({ where: { id } })
    res.json({ data: { id } })
  })

  return router
}
