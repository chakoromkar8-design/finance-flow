import { Router } from 'express'
import { notFound } from '../utils/errors.js'
import { num } from '../utils/money.js'
import { dayString } from '../utils/dates.js'
import { Validator, assertId } from '../validators/common.js'

export const serializeGoal = (g) => ({
  id: g.id,
  name: g.name,
  targetAmount: num(g.targetAmount),
  currentAmount: num(g.currentAmount),
  monthlyContribution: num(g.monthlyContribution),
  deadline: dayString(g.deadline),
  createdAt: g.createdAt,
  updatedAt: g.updatedAt,
})

const parseGoal = (body, partial) =>
  new Validator(body ?? {}, { partial })
    .string('name', { max: 80, label: 'Goal name' })
    .money('targetAmount', { min: 0, allowZero: false, label: 'Target amount' })
    .money('currentAmount', { min: 0, required: false, label: 'Saved amount' })
    .money('monthlyContribution', { min: 0, required: false, label: 'Monthly contribution' })
    .date('deadline', { required: false, nullable: true, label: 'Deadline' })
    .done()

export function goalRoutes({ prisma }) {
  const router = Router()

  router.get('/', async (req, res) => {
    const goals = await prisma.goal.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'asc' } })
    res.json({ data: goals.map(serializeGoal) })
  })

  router.post('/', async (req, res) => {
    const data = parseGoal(req.body, false)
    const created = await prisma.goal.create({ data: { userId: req.user.id, ...data } })
    res.status(201).json({ data: serializeGoal(created) })
  })

  router.put('/:id', async (req, res) => {
    const id = assertId(req.params.id)
    const existing = await prisma.goal.findFirst({ where: { id, userId: req.user.id } })
    if (!existing) throw notFound('Goal')
    const data = parseGoal(req.body, true)
    const updated = await prisma.goal.update({ where: { id }, data })
    res.json({ data: serializeGoal(updated) })
  })

  router.delete('/:id', async (req, res) => {
    const id = assertId(req.params.id)
    const existing = await prisma.goal.findFirst({ where: { id, userId: req.user.id } })
    if (!existing) throw notFound('Goal')
    await prisma.goal.delete({ where: { id } })
    res.json({ data: { id } })
  })

  return router
}
