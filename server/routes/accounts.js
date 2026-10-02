import { Router } from 'express'
import { ApiError, notFound } from '../utils/errors.js'
import { toCents, fromCents } from '../utils/money.js'
import { Validator, ACCOUNT_TYPES, assertId } from '../validators/common.js'
import { listAccountsWithBalances, getAccountWithBalance, serializeAccount } from '../services/balances.js'

export function accountRoutes({ prisma }) {
  const router = Router()

  router.get('/', async (req, res) => {
    const accounts = await listAccountsWithBalances(prisma, req.user.id)
    res.json({ data: accounts.map(serializeAccount) })
  })

  router.get('/:id', async (req, res) => {
    const account = await getAccountWithBalance(prisma, req.user.id, assertId(req.params.id))
    if (!account) throw notFound('Account')
    res.json({ data: serializeAccount(account) })
  })

  router.post('/', async (req, res) => {
    const v = new Validator(req.body ?? {})
    v.string('name', { max: 60, label: 'Account name' })
      .oneOf('type', ACCOUNT_TYPES, { label: 'Account type', transform: (s) => s.toUpperCase() })
      .optionalString('institution', { max: 80 })
      .money('openingBalance', { min: -MAX, required: false, label: 'Opening balance' })
    const data = v.done()

    await assertNameFree(prisma, req.user.id, data.name)
    const created = await prisma.account.create({
      data: { userId: req.user.id, name: data.name, type: data.type, institution: data.institution ?? null, openingBalance: data.openingBalance ?? 0 },
    })
    const account = await getAccountWithBalance(prisma, req.user.id, created.id)
    res.status(201).json({ data: serializeAccount(account) })
  })

  router.put('/:id', async (req, res) => {
    const id = assertId(req.params.id)
    const existing = await getAccountWithBalance(prisma, req.user.id, id)
    if (!existing) throw notFound('Account')

    const v = new Validator(req.body ?? {}, { partial: true })
    v.string('name', { max: 60, label: 'Account name' })
      .oneOf('type', ACCOUNT_TYPES, { label: 'Account type', transform: (s) => s.toUpperCase() })
      .optionalString('institution', { max: 80 })
      .money('openingBalance', { min: -MAX, required: false, label: 'Opening balance' })
      .money('balance', { min: -MAX, required: false, label: 'Balance' })
    const data = v.done()

    if (data.name && data.name !== existing.name) await assertNameFree(prisma, req.user.id, data.name, id)

    const update = {}
    for (const key of ['name', 'type', 'institution']) if (data[key] !== undefined) update[key] = data[key]
    if (data.openingBalance !== undefined) update.openingBalance = data.openingBalance
    // "balance" means: make the current balance equal to this number. We do it by
    // adjusting the opening balance, because the live balance = opening + transactions.
    if (data.balance !== undefined) update.openingBalance = fromCents(toCents(data.balance) - existing.netCents)

    await prisma.account.update({ where: { id }, data: update })
    const account = await getAccountWithBalance(prisma, req.user.id, id)
    res.json({ data: serializeAccount(account) })
  })

  router.delete('/:id', async (req, res) => {
    const id = assertId(req.params.id)
    const existing = await prisma.account.findFirst({ where: { id, userId: req.user.id } })
    if (!existing) throw notFound('Account')

    const count = await prisma.transaction.count({ where: { accountId: id, userId: req.user.id } })
    if (count > 0 && req.query.force !== 'true') {
      throw new ApiError(409, `This account has ${count} transaction${count === 1 ? '' : 's'}. Deleting it will delete them too.`, {
        code: 'ACCOUNT_HAS_TRANSACTIONS',
      })
    }
    await prisma.$transaction(async (tx) => {
      await tx.transaction.deleteMany({ where: { accountId: id, userId: req.user.id } })
      await tx.account.delete({ where: { id } })
    })
    res.json({ data: { id } })
  })

  return router
}

const MAX = 99_999_999_999.99

async function assertNameFree(prisma, userId, name, exceptId) {
  const clash = await prisma.account.findFirst({ where: { userId, name } })
  if (clash && clash.id !== exceptId) {
    throw new ApiError(409, 'You already have an account with this name.', { code: 'CONFLICT', fields: { name: 'You already have an account with this name.' } })
  }
}
