
import { Router } from 'express'
import { notFound } from '../utils/errors.js'
import { Validator, MAX_MONEY, assertId } from '../validators/common.js'

const INVESTMENT_TYPES = [
  'SHARES',
  'MUTUAL_FUND',
  'SIP',
  'BOND',
  'FD',
  'COMMODITY',
  'LIC',
]

const INVESTMENT_STATUSES = [
  'ACTIVE',
  'COMPLETED',
  'MATURED',
  'CANCELLED',
]

const MAX_RATE = 999.99

function validateInvestment(body, { partial = false } = {}) {
  const v = new Validator(body, { partial })

  v.oneOf('type', INVESTMENT_TYPES, {
    label: 'Investment type',
    transform: (s) => s.toUpperCase(),
  })
    .string('name', { max: 100, label: 'Investment name' })
    .oneOf('status', INVESTMENT_STATUSES, {
      required: false,
      label: 'Investment status',
      transform: (s) => s.toUpperCase(),
    })
    .optionalString('institution', { max: 100 })
    .optionalString('symbol', { max: 30 })
    .optionalString('policyNumber', { max: 100 })
    .money('investedAmount', {
      max: MAX_MONEY,
      required: false,
      label: 'Invested amount',
    })
    .money('currentValue', {
      max: MAX_MONEY,
      required: false,
      label: 'Current value',
    })
    .number('quantity', {
      min: 0,
      required: false,
      label: 'Quantity',
    })
    .number('purchasePrice', {
      min: 0,
      required: false,
      label: 'Purchase price',
    })
    .number('currentPrice', {
      min: 0,
      required: false,
      label: 'Current price',
    })
    .number('units', {
      min: 0,
      required: false,
      label: 'Units',
    })
    .number('purchaseNav', {
      min: 0,
      required: false,
      label: 'Purchase NAV',
    })
    .number('currentNav', {
      min: 0,
      required: false,
      label: 'Current NAV',
    })
    .money('monthlyAmount', {
      max: MAX_MONEY,
      required: false,
      label: 'Monthly amount',
    })
    .date('startDate', {
      required: false,
      nullable: true,
      label: 'Start date',
    })
    .date('nextPaymentDate', {
      required: false,
      nullable: true,
      label: 'Next payment date',
    })
    .number('interestRate', {
      min: 0,
      max: MAX_RATE,
      required: false,
      label: 'Interest rate',
    })
    .date('maturityDate', {
      required: false,
      nullable: true,
      label: 'Maturity date',
    })
    .money('premiumAmount', {
      max: MAX_MONEY,
      required: false,
      label: 'Premium amount',
    })
    .optionalString('premiumFrequency', { max: 30 })
    .date('nextPremiumDate', {
      required: false,
      nullable: true,
      label: 'Next premium date',
    })
    .optionalString('notes', { max: 2000 })

  return v.done()
}

function toDatabaseData(data) {
  const result = { ...data }

  // Decimal fields in Prisma accept numbers as input.
  // Convert an explicitly supplied empty optional value to null.
  const nullableNumbers = [
    'quantity',
    'purchasePrice',
    'currentPrice',
    'units',
    'purchaseNav',
    'currentNav',
    'monthlyAmount',
    'interestRate',
    'premiumAmount',
  ]

  for (const key of nullableNumbers) {
    if (result[key] === '') result[key] = null
  }

  return result
}

export function investmentRoutes({ prisma }) {
  const router = Router()

  router.get('/', async (req, res) => {
    const where = { userId: req.user.id }

    if (req.query.type !== undefined) {
      const type = String(req.query.type).toUpperCase()

      if (!INVESTMENT_TYPES.includes(type)) {
        const v = new Validator({ type })
        v.oneOf('type', INVESTMENT_TYPES, {
          transform: (s) => s.toUpperCase(),
          label: 'Investment type',
        })
        v.done()
      }

      where.type = type
    }

    if (req.query.status !== undefined) {
      const status = String(req.query.status).toUpperCase()

      if (!INVESTMENT_STATUSES.includes(status)) {
        const v = new Validator({ status })
        v.oneOf('status', INVESTMENT_STATUSES, {
          transform: (s) => s.toUpperCase(),
          label: 'Investment status',
        })
        v.done()
      }

      where.status = status
    }

    const investments = await prisma.investment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    res.json({ data: investments })
  })

  router.get('/:id', async (req, res) => {
    const id = assertId(req.params.id)

    const investment = await prisma.investment.findFirst({
      where: { id, userId: req.user.id },
    })

    if (!investment) throw notFound('Investment')

    res.json({ data: investment })
  })

  router.post('/', async (req, res) => {
    const data = toDatabaseData(validateInvestment(req.body ?? {}))

    const investment = await prisma.investment.create({
      data: {
        ...data,
        status: data.status ?? 'ACTIVE',
        investedAmount: data.investedAmount ?? 0,
        currentValue: data.currentValue ?? 0,
        userId: req.user.id,
      },
    })

    res.status(201).json({ data: investment })
  })

  router.put('/:id', async (req, res) => {
    const id = assertId(req.params.id)

    const existing = await prisma.investment.findFirst({
      where: { id, userId: req.user.id },
    })

    if (!existing) throw notFound('Investment')

    const data = toDatabaseData(
      validateInvestment(req.body ?? {}, { partial: true }),
    )

    const investment = await prisma.investment.update({
      where: { id },
      data,
    })

    res.json({ data: investment })
  })

  router.delete('/:id', async (req, res) => {
    const id = assertId(req.params.id)

    const existing = await prisma.investment.findFirst({
      where: { id, userId: req.user.id },
      select: { id: true },
    })

    if (!existing) throw notFound('Investment')

    await prisma.investment.delete({ where: { id } })

    res.json({ data: { id } })
  })

  return router
}
