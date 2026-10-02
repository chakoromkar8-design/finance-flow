import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createFakePrisma } from './fakePrisma.js'
import { seedDemoUser, DEMO_EMAIL } from '../services/demoData.js'
import { buildSummary } from '../services/analytics.js'
import { testConfig } from './helpers.js'

test('demo seed creates one demo user with consistent data, and is idempotent', async () => {
  const prisma = createFakePrisma()
  const first = await seedDemoUser(prisma, { password: 'Demo12345', bcryptRounds: 4 })
  assert.equal(first.created, true)
  const again = await seedDemoUser(prisma, { password: 'Demo12345', bcryptRounds: 4 })
  assert.equal(again.created, false)
  assert.equal(prisma._tables.user.length, 1)
  assert.equal(prisma._tables.user[0].email, DEMO_EMAIL)
  assert.ok(prisma._tables.transaction.every((t) => t.userId === first.userId))
  const summary = await buildSummary(prisma, first.userId, testConfig())
  assert.ok(summary.totals.income > 0 && summary.totals.balance !== 0)
})
