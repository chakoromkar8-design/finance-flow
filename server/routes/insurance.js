
import { Router } from 'express'
import { notFound } from '../utils/errors.js'
import { Validator, MAX_MONEY, assertId } from '../validators/common.js'

const INSURANCE_TYPES = [
  'HEALTH',
  'LIFE',
  'TERM',
  'VEHICLE',
  'HOME',
  'TRAVEL',
  'OTHER',
]

const INSURANCE_FREQUENCIES = [
  'MONTHLY',
  'QUARTERLY',
  'HALF_YEARLY',
  'YEARLY',
]

const INSURANCE_STATUSES = [
  'ACTIVE',
  'EXPIRED',
  'CANCELLED',
  'PENDING',
]

function validateInsurance(body, { partial = false } = {}) {
  const v = new Validator(body, { partial })

  v.string('name', { max: 100, label: 'Policy name' })
    .oneOf('type', INSURANCE_TYPES, {
      label: 'Insurance type',
      transform: (s) => s.toUpperCase(),
    })
    .string('provider', { max: 100, label: 'Insurance provider' })
    .string('policyNumber', { max: 100, label: 'Policy number' })
    .string('policyholder', { max: 100, label: 'Policyholder' })
    .money('coverageAmount', {
      max: MAX_MONEY,
      label: 'Coverage amount',
    })
    .money('premiumAmount', {
      max: MAX_MONEY,
      label: 'Premium amount',
    })
    .oneOf('frequency', INSURANCE_FREQUENCIES, {
      label: 'Premium frequency',
      transform: (s) => s.toUpperCase(),
    })
    .date('startDate', { label: 'Start date' })
    .date('endDate', {
      required: false,
      nullable: true,
      label: 'End date',
    })
    .date('renewalDate', {
      required: false,
      nullable: true,
      label: 'Renewal date',
    })
    .oneOf('status', INSURANCE_STATUSES, {
      required: false,
      label: 'Insurance status',
      transform: (s) => s.toUpperCase(),
    })
    .optionalString('nominee', { max: 100 })
    .optionalString('notes', { max: 2000 })

  return v.done()
}

export function insuranceRoutes({ prisma }) {
  const router = Router()

  // List the logged-in user's policies, with optional filters.
  router.get('/', async (req, res) => {
    const where = { userId: req.user.id }

    if (req.query.type !== undefined) {
      const v = new Validator({ type: String(req.query.type) })
      v.oneOf('type', INSURANCE_TYPES, {
        label: 'Insurance type',
        transform: (s) => s.toUpperCase(),
      })
      where.type = v.done().type
    }

    if (req.query.status !== undefined) {
      const v = new Validator({ status: String(req.query.status) })
      v.oneOf('status', INSURANCE_STATUSES, {
        label: 'Insurance status',
        transform: (s) => s.toUpperCase(),
      })
      where.status = v.done().status
    }

    const insurances = await prisma.insurance.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    res.json({ data: insurances })
  })

  // Get one policy belonging to the logged-in user.
  router.get('/:id', async (req, res) => {
    const id = assertId(req.params.id)

    const insurance = await prisma.insurance.findFirst({
      where: { id, userId: req.user.id },
    })

    if (!insurance) throw notFound('Insurance policy')

    res.json({ data: insurance })
  })

  // Create a policy.
  router.post('/', async (req, res) => {
    const data = validateInsurance(req.body ?? {})

    const insurance = await prisma.insurance.create({
      data: {
        ...data,
        status: data.status ?? 'ACTIVE',
        userId: req.user.id,
      },
    })

    res.status(201).json({ data: insurance })
  })

  // Update a policy.
  router.put('/:id', async (req, res) => {
    const id = assertId(req.params.id)

    const existing = await prisma.insurance.findFirst({
      where: { id, userId: req.user.id },
      select: { id: true },
    })

    if (!existing) throw notFound('Insurance policy')

    const data = validateInsurance(req.body ?? {}, { partial: true })

    const insurance = await prisma.insurance.update({
      where: { id },
      data,
    })

    res.json({ data: insurance })
  })

  // Delete a policy.
  router.delete('/:id', async (req, res) => {
    const id = assertId(req.params.id)

    const existing = await prisma.insurance.findFirst({
      where: { id, userId: req.user.id },
      select: { id: true },
    })

    if (!existing) throw notFound('Insurance policy')

    await prisma.insurance.delete({ where: { id } })

    res.json({ data: { id } })
  })

  return router
}
