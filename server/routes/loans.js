import { Router } from 'express'
import { ApiError, notFound } from '../utils/errors.js'
import { toCents } from '../utils/money.js'
import { dayString } from '../utils/dates.js'
import { Validator, assertId } from '../validators/common.js'
import { serializeLoan } from '../services/loans.js'

const fieldError = (fields) => new ApiError(400, 'Please fix the highlighted fields.', { code: 'VALIDATION', fields })

export function loanRoutes({ prisma }) {
  const router = Router()

  const pendingEmisFor = (userId, loanIds) => prisma.emi.findMany({ where: { userId, status: 'PENDING', loanId: { in: loanIds } } })

  router.get('/', async (req, res) => {
    const loans = await prisma.loan.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'asc' } })
    const emis = loans.length ? await pendingEmisFor(req.user.id, loans.map((l) => l.id)) : []
    res.json({ data: loans.map((l) => serializeLoan(l, emis.filter((e) => e.loanId === l.id))) })
  })

  router.get('/:id', async (req, res) => {
    const id = assertId(req.params.id)
    const loan = await prisma.loan.findFirst({ where: { id, userId: req.user.id } })
    if (!loan) throw notFound('Loan')
    res.json({ data: serializeLoan(loan, await pendingEmisFor(req.user.id, [id])) })
  })

  router.post('/', async (req, res) => {
    const v = new Validator(req.body ?? {})
    v.string('name', { max: 80, label: 'Loan name' })
      .money('principalAmount', { min: 0, allowZero: false, label: 'Principal' })
      .money('outstandingAmount', { min: 0, required: false, label: 'Outstanding amount' })
      .number('interestRate', { min: 0, max: 100, label: 'Interest rate' })
      .money('emiAmount', { min: 0, allowZero: false, label: 'EMI amount' })
      .date('startDate', { label: 'Start date' })
      .date('endDate', { required: false, nullable: true, label: 'End date' })
      .date('nextEmiDate', { required: false, nullable: true, label: 'Next EMI date' })
    const data = v.done()

    const outstanding = data.outstandingAmount ?? data.principalAmount
    if (outstanding > data.principalAmount) throw fieldError({ outstandingAmount: 'Outstanding amount cannot be more than the principal.' })
    if (data.endDate && data.endDate < data.startDate) throw fieldError({ endDate: 'End date must be after the start date.' })

    const loan = await prisma.$transaction(async (tx) => {
      const created = await tx.loan.create({
        data: {
          userId: req.user.id,
          name: data.name,
          principalAmount: data.principalAmount,
          outstandingAmount: outstanding,
          interestRate: data.interestRate,
          emiAmount: data.emiAmount,
          startDate: data.startDate,
          endDate: data.endDate ?? null,
        },
      })
      // Optional convenience: create the first upcoming EMI so "next payment" shows up.
      if (data.nextEmiDate) {
        await tx.emi.create({ data: { userId: req.user.id, loanId: created.id, amount: data.emiAmount, dueDate: data.nextEmiDate } })
      }
      return created
    })
    res.status(201).json({ data: serializeLoan(loan, await pendingEmisFor(req.user.id, [loan.id])) })
  })

  router.put('/:id', async (req, res) => {
    const id = assertId(req.params.id)
    const existing = await prisma.loan.findFirst({ where: { id, userId: req.user.id } })
    if (!existing) throw notFound('Loan')

    const v = new Validator(req.body ?? {}, { partial: true })
    v.string('name', { max: 80, label: 'Loan name' })
      .money('principalAmount', { min: 0, allowZero: false, label: 'Principal' })
      .money('outstandingAmount', { min: 0, label: 'Outstanding amount' })
      .number('interestRate', { min: 0, max: 100, label: 'Interest rate' })
      .money('emiAmount', { min: 0, allowZero: false, label: 'EMI amount' })
      .date('startDate', { label: 'Start date' })
      .date('endDate', { required: false, nullable: true, label: 'End date' })
      .oneOf('status', ['ACTIVE', 'CLOSED'], { label: 'Status', transform: (s) => s.toUpperCase() })
    const data = v.done()

    const principal = data.principalAmount ?? Number(existing.principalAmount)
    const outstanding = data.outstandingAmount ?? Number(existing.outstandingAmount)
    if (toCents(outstanding) > toCents(principal)) throw fieldError({ outstandingAmount: 'Outstanding amount cannot be more than the principal.' })
    const start = data.startDate ?? existing.startDate
    const end = data.endDate === undefined ? existing.endDate : data.endDate
    if (end && dayString(end) < dayString(start)) throw fieldError({ endDate: 'End date must be after the start date.' })

    const updated = await prisma.loan.update({ where: { id }, data })
    res.json({ data: serializeLoan(updated, await pendingEmisFor(req.user.id, [id])) })
  })

  router.delete('/:id', async (req, res) => {
    const id = assertId(req.params.id)
    const existing = await prisma.loan.findFirst({ where: { id, userId: req.user.id } })
    if (!existing) throw notFound('Loan')
    await prisma.$transaction(async (tx) => {
      await tx.emi.deleteMany({ where: { loanId: id, userId: req.user.id } })
      await tx.loan.delete({ where: { id } })
    })
    res.json({ data: { id } })
  })

  return router
}
