import { Router } from 'express'
import { ApiError, notFound } from '../utils/errors.js'
import { Validator, assertId } from '../validators/common.js'
import { serializeEmi, setEmiPaid } from '../services/loans.js'
import { parseDay, todayString } from '../utils/dates.js'

export function emiRoutes({ prisma, config }) {
  const router = Router()

  const loanNames = async (userId) => new Map((await prisma.loan.findMany({ where: { userId } })).map((l) => [l.id, l.name]))
  const ownLoan = async (userId, loanId) => {
    const loan = await prisma.loan.findFirst({ where: { id: loanId, userId } })
    if (!loan) throw new ApiError(400, 'Please fix the highlighted fields.', { code: 'VALIDATION', fields: { loanId: 'Loan not found.' } })
    return loan
  }

  router.get('/', async (req, res) => {
    const where = { userId: req.user.id }
    if (req.query.loanId !== undefined) where.loanId = assertId(String(req.query.loanId))
    if (req.query.status !== undefined) {
      const s = String(req.query.status).toUpperCase()
      if (!['PENDING', 'PAID'].includes(s)) throw new ApiError(400, 'status must be PENDING or PAID.', { code: 'VALIDATION' })
      where.status = s
    }
    const [emis, names] = await Promise.all([prisma.emi.findMany({ where, orderBy: { dueDate: 'asc' } }), loanNames(req.user.id)])
    res.json({ data: emis.map((e) => serializeEmi(e, names.get(e.loanId), config)) })
  })

  router.post('/', async (req, res) => {
    const v = new Validator(req.body ?? {})
    v.id('loanId')
      .money('amount', { min: 0, allowZero: false, label: 'EMI amount' })
      .date('dueDate', { label: 'Due date' })
      .oneOf('status', ['PENDING', 'PAID'], { required: false, label: 'Status', transform: (s) => s.toUpperCase() })
    const data = v.done()

    const loan = await ownLoan(req.user.id, data.loanId)
    const emi = await prisma.$transaction(async (tx) => {
      const created = await tx.emi.create({ data: { userId: req.user.id, loanId: loan.id, amount: data.amount, dueDate: data.dueDate } })
      return data.status === 'PAID' ? setEmiPaid(tx, created, loan, true, parseDay(todayString(config))) : created
    })
    res.status(201).json({ data: serializeEmi(emi, loan.name, config) })
  })

  router.put('/:id', async (req, res) => {
    const id = assertId(req.params.id)
    const existing = await prisma.emi.findFirst({ where: { id, userId: req.user.id } })
    if (!existing) throw notFound('EMI')
    const loan = await prisma.loan.findFirst({ where: { id: existing.loanId, userId: req.user.id } })
    if (!loan) throw notFound('Loan')

    const v = new Validator(req.body ?? {}, { partial: true })
    v.money('amount', { min: 0, allowZero: false, label: 'EMI amount' })
      .date('dueDate', { label: 'Due date' })
      .date('paidDate', { required: false, label: 'Paid date' })
      .oneOf('status', ['PENDING', 'PAID'], { label: 'Status', transform: (s) => s.toUpperCase() })
    const data = v.done()

    if (existing.status === 'PAID' && data.status !== 'PENDING' && data.amount !== undefined) {
      throw new ApiError(400, 'Mark this EMI as pending before changing its amount.', { code: 'VALIDATION', fields: { amount: 'Paid EMIs cannot be edited.' } })
    }

    const result = await prisma.$transaction(async (tx) => {
      let emi = existing
      if (data.status !== undefined) {
        emi = await setEmiPaid(tx, emi, loan, data.status === 'PAID', data.paidDate ?? parseDay(todayString(config)))
      }
      const rest = {}
      if (data.amount !== undefined) rest.amount = data.amount
      if (data.dueDate !== undefined) rest.dueDate = data.dueDate
      return Object.keys(rest).length ? tx.emi.update({ where: { id }, data: rest }) : emi
    })
    res.json({ data: serializeEmi(result, loan.name, config) })
  })

  router.delete('/:id', async (req, res) => {
    const id = assertId(req.params.id)
    const existing = await prisma.emi.findFirst({ where: { id, userId: req.user.id } })
    if (!existing) throw notFound('EMI')
    const loan = await prisma.loan.findFirst({ where: { id: existing.loanId, userId: req.user.id } })
    await prisma.$transaction(async (tx) => {
      // Deleting a paid EMI undoes its effect on the loan first.
      if (existing.status === 'PAID' && loan) await setEmiPaid(tx, existing, loan, false)
      await tx.emi.delete({ where: { id } })
    })
    res.json({ data: { id } })
  })

  return router
}
