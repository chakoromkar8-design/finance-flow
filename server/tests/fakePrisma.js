// A tiny in-memory stand-in for PrismaClient, used ONLY by the tests so they run
// without PostgreSQL. It supports just the query features our routes use, and it
// imitates the database rules that matter (unique constraints, foreign keys).
const MODELS = ['user', 'account', 'transaction', 'budget', 'goal', 'loan', 'emi']

const DEFAULTS = {
  user: () => ({}),
  account: () => ({ institution: null, openingBalance: 0 }),
  transaction: () => ({ notes: null }),
  budget: () => ({}),
  goal: () => ({ currentAmount: 0, monthlyContribution: 0, deadline: null }),
  loan: () => ({ status: 'ACTIVE', endDate: null }),
  emi: () => ({ status: 'PENDING', paidDate: null, principalPaid: null }),
}

const UNIQUE = { user: [['email']], account: [['userId', 'name']], budget: [['userId', 'category']] }

// Foreign keys: model -> [field, parentModel]
const FOREIGN = {
  account: [['userId', 'user']],
  transaction: [['userId', 'user'], ['accountId', 'account']],
  budget: [['userId', 'user']],
  goal: [['userId', 'user']],
  loan: [['userId', 'user']],
  emi: [['userId', 'user'], ['loanId', 'loan']],
}

const prismaError = (code, message) => Object.assign(new Error(message), { code })
const val = (v) => (v instanceof Date ? v.getTime() : v)

function matchOne(actual, cond) {
  const isOp = cond !== null && typeof cond === 'object' && !(cond instanceof Date)
  if (!isOp) return val(actual) === val(cond)
  return Object.entries(cond).every(([op, target]) => {
    switch (op) {
      case 'equals': return val(actual) === val(target)
      case 'in': return target.map(val).includes(val(actual))
      case 'not': return val(actual) !== val(target)
      case 'gte': return val(actual) >= val(target)
      case 'lte': return val(actual) <= val(target)
      case 'gt': return val(actual) > val(target)
      case 'lt': return val(actual) < val(target)
      case 'contains': return typeof actual === 'string' && actual.toLowerCase().includes(String(target).toLowerCase())
      case 'mode': return true
      default: throw new Error(`fakePrisma: unsupported operator ${op}`)
    }
  })
}

function matches(row, where = {}) {
  return Object.entries(where).every(([key, cond]) => {
    if (key === 'OR') return cond.some((w) => matches(row, w))
    if (key === 'AND') return cond.every((w) => matches(row, w))
    return matchOne(row[key], cond)
  })
}

function sortRows(rows, orderBy) {
  if (!orderBy) return rows
  const list = Array.isArray(orderBy) ? orderBy : [orderBy]
  return [...rows].sort((a, b) => {
    for (const o of list) {
      const [key, dir] = Object.entries(o)[0]
      const av = val(a[key])
      const bv = val(b[key])
      if (av === bv) continue
      const cmp = av < bv ? -1 : 1
      return dir === 'desc' ? -cmp : cmp
    }
    return 0
  })
}

export function createFakePrisma() {
  const tables = Object.fromEntries(MODELS.map((m) => [m, []]))
  let seq = 0
  let tick = 0
  const clone = (row) => ({ ...row })
  const ts = () => new Date(Date.UTC(2026, 0, 1) + ++tick * 1000)

  const checkUnique = (model, row, ignoreId) => {
    for (const fields of UNIQUE[model] ?? []) {
      const clash = tables[model].find((r) => r.id !== ignoreId && fields.every((f) => r[f] === row[f]))
      if (clash) throw prismaError('P2002', `Unique constraint failed on ${fields.join(',')}`)
    }
  }
  const checkForeign = (model, row) => {
    for (const [field, parent] of FOREIGN[model] ?? []) {
      if (!tables[parent].some((p) => p.id === row[field])) throw prismaError('P2003', `Foreign key constraint failed on ${field}`)
    }
  }

  const delegate = (model) => ({
    findUnique: async ({ where }) => {
      const found = tables[model].find((r) => matches(r, where))
      return found ? clone(found) : null
    },
    findFirst: async ({ where, orderBy } = {}) => {
      const found = sortRows(tables[model].filter((r) => matches(r, where)), orderBy)[0]
      return found ? clone(found) : null
    },
    findMany: async ({ where, orderBy, take, skip = 0 } = {}) => {
      const rows = sortRows(tables[model].filter((r) => matches(r, where)), orderBy).slice(skip, take === undefined ? undefined : skip + take)
      return rows.map(clone)
    },
    count: async ({ where } = {}) => tables[model].filter((r) => matches(r, where)).length,
    create: async ({ data }) => {
      const row = { id: `c${String(++seq).padStart(6, '0')}x`, ...DEFAULTS[model](), ...data, createdAt: ts(), updatedAt: ts() }
      checkUnique(model, row)
      checkForeign(model, row)
      tables[model].push(row)
      return clone(row)
    },
    update: async ({ where, data }) => {
      const row = tables[model].find((r) => matches(r, where))
      if (!row) throw prismaError('P2025', 'Record to update not found.')
      const next = { ...row, ...data, updatedAt: ts() }
      checkUnique(model, next, row.id)
      checkForeign(model, next)
      Object.assign(row, next)
      return clone(row)
    },
    delete: async ({ where }) => {
      const i = tables[model].findIndex((r) => matches(r, where))
      if (i < 0) throw prismaError('P2025', 'Record to delete does not exist.')
      const [row] = tables[model].splice(i, 1)
      // Mimic ON DELETE rules.
      if (model === 'account' && tables.transaction.some((t) => t.accountId === row.id)) {
        tables[model].splice(i, 0, row)
        throw prismaError('P2003', 'Foreign key constraint failed (account still has transactions)')
      }
      if (model === 'loan') tables.emi = tables.emi.filter((e) => e.loanId !== row.id)
      return clone(row)
    },
    deleteMany: async ({ where } = {}) => {
      const before = tables[model].length
      tables[model] = tables[model].filter((r) => !matches(r, where))
      return { count: before - tables[model].length }
    },
  })

  const client = Object.fromEntries(MODELS.map((m) => [m, delegate(m)]))
  client.$transaction = async (fn) => fn(client)
  client.$disconnect = async () => {}
  client._tables = tables // handy for assertions (e.g. "password is hashed")
  return client
}
